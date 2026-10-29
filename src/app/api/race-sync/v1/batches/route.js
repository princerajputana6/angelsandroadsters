import { connectDB } from '@/lib/db';
import RaceEvent, { RACE_EVENT_TYPES } from '@/lib/models/RaceEvent';
import RaceEntry from '@/lib/models/RaceEntry';
import RaceDevice from '@/lib/models/RaceDevice';
import RaceConflict from '@/lib/models/RaceConflict';
import SyncReceipt from '@/lib/models/SyncReceipt';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireUser } from '@/lib/auth';
import { loadSession, assertSessionAccess } from '@/lib/raceSession';
import { eventPayloadHash } from '@/lib/raceEventHash';
import { detectConflicts } from '@/lib/raceConflictDetect';
import { recomputeRaceResults } from '@/lib/raceProjection';

const MAX_EVENTS = 500;

/**
 * POST /api/race-sync/v1/batches — idempotent batch ingestion of local race
 * events (plan §9). This is the MINIMAL correct ingestion for M3:
 *   - authenticates the official + checkpoint session (rejects expired/revoked)
 *   - inserts each event idempotently by clientEventId
 *   - same id + same payload hash  -> alreadyAccepted
 *   - same id + different hash     -> needsReview + INTEGRITY_MISMATCH conflict
 *   - preserves the source record; never overwrites or deletes (plan §9.2)
 *   - batch-level idempotency via the unique SyncReceipt.batchId
 * Deeper race-rule conflict detection (duplicate lap, finish-before-start, …)
 * and result projections are added in M4.
 */
export async function POST(req) {
  return handler(async () => {
    const user = await requireUser();
    await connectDB();

    const body = await req.json();
    const { batchId, deviceId, checkpointSessionId, schemaVersion = 1, events, reportedPending } = body || {};
    if (!batchId || !deviceId || !checkpointSessionId || !Array.isArray(events)) {
      throw Object.assign(new Error('batchId, deviceId, checkpointSessionId and events[] are required'), { status: 400 });
    }
    if (events.length > MAX_EVENTS) {
      throw Object.assign(new Error(`Batch too large (max ${MAX_EVENTS} events)`), { status: 413 });
    }

    // Batch-level idempotency: a retried batch returns the stored receipt.
    const existingReceipt = await SyncReceipt.findOne({ batchId }).lean();
    if (existingReceipt) return ok(receiptToResponse(existingReceipt));

    const session = await loadSession(checkpointSessionId);
    assertSessionAccess(user, session, { allowManager: false, requireActive: true });
    if (session.deviceId && session.deviceId !== deviceId) {
      throw Object.assign(new Error('deviceId does not match the claimed session device'), { status: 403 });
    }

    const accepted = [];
    const alreadyAccepted = [];
    const needsReview = [];
    const rejected = [];
    let maxSeq = session.lastAcceptedDeviceSequence || 0;

    for (const evt of events) {
      const cid = evt?.clientEventId;
      try {
        // --- shape validation ---
        if (!cid) { rejected.push({ clientEventId: null, status: 'rejected', reason: 'missing clientEventId' }); continue; }
        if (!RACE_EVENT_TYPES.includes(evt.type)) { rejected.push({ clientEventId: cid, status: 'rejected', reason: 'invalid type' }); continue; }
        if (typeof evt.deviceSequence !== 'number') { rejected.push({ clientEventId: cid, status: 'rejected', reason: 'missing deviceSequence' }); continue; }
        if (!evt.occurredAt) { rejected.push({ clientEventId: cid, status: 'rejected', reason: 'missing occurredAt' }); continue; }

        // --- authorization scope: event must belong to this session's race ---
        if (evt.raceId && String(evt.raceId) !== String(session.race)) {
          rejected.push({ clientEventId: cid, status: 'rejected', reason: 'race mismatch for session' }); continue;
        }
        if (evt.entryId) {
          const entry = await RaceEntry.findOne({ _id: evt.entryId, race: session.race }).select('_id').lean();
          if (!entry) { rejected.push({ clientEventId: cid, status: 'rejected', reason: 'entry not in race' }); continue; }
        }

        const payloadHash = eventPayloadHash({ ...evt, deviceId, raceId: session.race });

        // --- idempotent insert by clientEventId ---
        const existing = await RaceEvent.findOne({ clientEventId: cid }).lean();
        if (existing) {
          if (existing.payloadHash === payloadHash) {
            alreadyAccepted.push({ clientEventId: cid, serverEventId: existing._id, status: 'alreadyAccepted' });
          } else {
            await flagIntegrityConflict(session, existing, cid);
            needsReview.push({ clientEventId: cid, serverEventId: existing._id, status: 'needsReview', reason: 'payload mismatch for existing id' });
          }
          maxSeq = Math.max(maxSeq, existing.deviceSequence || 0);
          continue;
        }

        const created = await RaceEvent.create({
          clientEventId: cid,
          event: session.event,
          race: session.race,
          entry: evt.entryId || undefined,
          deviceId,
          checkpointSessionId,
          officialId: user._id,
          deviceSequence: evt.deviceSequence,
          type: evt.type,
          occurredAt: new Date(evt.occurredAt),
          monotonicElapsedMs: evt.monotonicElapsedMs,
          clockOffsetMs: evt.clockOffsetMs,
          clockUncertaintyMs: evt.clockUncertaintyMs,
          payload: evt.payload || {},
          payloadHash,
          schemaVersion,
        });
        accepted.push({ clientEventId: cid, serverEventId: created._id, status: 'accepted' });
        maxSeq = Math.max(maxSeq, evt.deviceSequence);
      } catch (err) {
        if (err.code === 11000) {
          // Concurrent insert of the same id, or a {deviceId,deviceSequence}
          // reuse. Re-resolve against the now-existing record.
          const existing = await RaceEvent.findOne({ clientEventId: cid }).lean();
          if (existing) {
            const payloadHash = eventPayloadHash({ ...evt, deviceId, raceId: session.race });
            if (existing.payloadHash === payloadHash) {
              alreadyAccepted.push({ clientEventId: cid, serverEventId: existing._id, status: 'alreadyAccepted' });
            } else {
              await flagIntegrityConflict(session, existing, cid);
              needsReview.push({ clientEventId: cid, status: 'needsReview', reason: 'payload mismatch (race)' });
            }
          } else {
            // Sequence collision with a different clientEventId.
            needsReview.push({ clientEventId: cid, status: 'needsReview', reason: 'device sequence conflict' });
          }
        } else {
          // Retryable/unknown error — mark rejected for THIS batch but the
          // device keeps the record and retries (plan §9.1.5, §9.2).
          rejected.push({ clientEventId: cid, status: 'rejected', reason: 'server error (retryable)' });
        }
      }
    }

    const nextExpectedDeviceSequence = maxSeq + 1;

    // Durable receipt (batchId unique → safe under retry).
    let receipt;
    try {
      receipt = await SyncReceipt.create({
        batchId,
        event: session.event,
        race: session.race,
        deviceId,
        checkpointSessionId,
        schemaVersion,
        eventCount: events.length,
        acceptedCount: accepted.length,
        alreadyAcceptedCount: alreadyAccepted.length,
        needsReviewCount: needsReview.length,
        rejectedCount: rejected.length,
        results: [...accepted, ...alreadyAccepted, ...needsReview, ...rejected],
        nextExpectedDeviceSequence,
      });
    } catch (err) {
      if (err.code === 11000) {
        const stored = await SyncReceipt.findOne({ batchId }).lean();
        return ok(receiptToResponse(stored));
      }
      throw err;
    }

    // Advance session cursor + device sync markers (best-effort).
    await Promise.all([
      (async () => {
        if (nextExpectedDeviceSequence - 1 > (session.lastAcceptedDeviceSequence || 0)) {
          session.lastAcceptedDeviceSequence = nextExpectedDeviceSequence - 1;
          await session.save();
        }
      })(),
      RaceDevice.updateOne(
        { deviceId },
        { $set: { lastSyncAt: new Date(), lastSeenAt: new Date(), ...(typeof reportedPending === 'number' ? { lastReportedPending: reportedPending } : {}) } }
      ),
    ]);

    // Recompute conflicts + projections idempotently after new events land
    // (plan §9.1.11). Best-effort: the events are already durably persisted, so
    // a projection error must not fail ingestion — the admin can recompute.
    if (accepted.length > 0) {
      try {
        await detectConflicts(session.race);
        await recomputeRaceResults(session.race);
      } catch (projErr) {
        console.error('[race-sync] post-ingest recompute failed:', projErr.message);
      }
    }

    return ok(receiptToResponse(receipt.toObject ? receipt.toObject() : receipt));
  });
}

async function flagIntegrityConflict(session, existing, clientEventId) {
  // Deterministic key so repeated syncs of the mismatch don't pile up rows.
  const key = `INTEGRITY_MISMATCH:${clientEventId}`;
  const already = await RaceConflict.findOne({ race: session.race, key }).select('_id').lean();
  if (already) return;
  await RaceConflict.create({
    event: session.event,
    race: session.race,
    entry: existing.entry,
    type: 'INTEGRITY_MISMATCH',
    status: 'open',
    key,
    relatedEventIds: [existing._id],
    relatedClientEventIds: [clientEventId],
    detail: 'A record with this clientEventId already exists with different content; the new submission was not applied.',
  });
}

function receiptToResponse(r) {
  const by = (s) => (r.results || []).filter((x) => x.status === s).map((x) => toJSON(x));
  return {
    batchId: r.batchId,
    accepted: by('accepted'),
    alreadyAccepted: by('alreadyAccepted'),
    needsReview: by('needsReview'),
    rejected: by('rejected'),
    nextExpectedDeviceSequence: r.nextExpectedDeviceSequence,
  };
}
