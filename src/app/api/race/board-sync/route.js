import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import RaceEntry from '@/lib/models/RaceEntry';
import RaceEvent from '@/lib/models/RaceEvent';
import SyncReceipt from '@/lib/models/SyncReceipt';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { eventPayloadHash } from '@/lib/raceEventHash';
import { recomputeRaceResults } from '@/lib/raceProjection';

const ALLOWED = ['RIDER_STARTED', 'RIDER_FINISHED'];
const MAX_EVENTS = 1000;

/**
 * POST /api/race/board-sync — ingest the fully-offline Race Board's queued
 * events when the device reconnects. Admin-authenticated (no checkpoint session
 * needed). Idempotent by clientEventId and by batchId, so retries after a lost
 * response never duplicate. body:
 *   { batchId, raceId, deviceId, events:[...], markStarted?, markCompleted? }
 */
export async function POST(req) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();

    const body = await req.json();
    const { batchId, raceId, deviceId, events, markStarted, markCompleted } = body || {};
    if (!batchId || !raceId || !deviceId || !Array.isArray(events)) {
      throw Object.assign(new Error('batchId, raceId, deviceId and events[] are required'), { status: 400 });
    }
    if (events.length > MAX_EVENTS) throw Object.assign(new Error(`Batch too large (max ${MAX_EVENTS})`), { status: 413 });

    // Batch-level idempotency.
    const prior = await SyncReceipt.findOne({ batchId }).lean();
    if (prior) return ok(summary(prior));

    const race = await Race.findById(raceId);
    if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

    const accepted = [];
    const alreadyAccepted = [];
    const rejected = [];

    for (const evt of events) {
      const cid = evt?.clientEventId;
      try {
        if (!cid) { rejected.push({ clientEventId: null, status: 'rejected', reason: 'missing clientEventId' }); continue; }
        if (!ALLOWED.includes(evt.type)) { rejected.push({ clientEventId: cid, status: 'rejected', reason: 'invalid type' }); continue; }
        if (typeof evt.deviceSequence !== 'number' || !evt.occurredAt || !evt.entryId) {
          rejected.push({ clientEventId: cid, status: 'rejected', reason: 'missing fields' }); continue;
        }
        const entry = await RaceEntry.findOne({ _id: evt.entryId, race: race._id }).select('_id').lean();
        if (!entry) { rejected.push({ clientEventId: cid, status: 'rejected', reason: 'entry not in race' }); continue; }

        const payload = evt.payload || {};
        const payloadHash = eventPayloadHash({ type: evt.type, raceId: race._id, entryId: evt.entryId, deviceId, deviceSequence: evt.deviceSequence, occurredAt: evt.occurredAt, payload });

        const existing = await RaceEvent.findOne({ clientEventId: cid }).lean();
        if (existing) {
          (existing.payloadHash === payloadHash ? alreadyAccepted : rejected).push(
            existing.payloadHash === payloadHash
              ? { clientEventId: cid, serverEventId: existing._id, status: 'alreadyAccepted' }
              : { clientEventId: cid, status: 'rejected', reason: 'id reused with different content' }
          );
          continue;
        }

        const created = await RaceEvent.create({
          clientEventId: cid,
          event: race.event,
          race: race._id,
          entry: evt.entryId,
          deviceId,
          checkpointSessionId: `board:${race._id}`,
          officialId: user._id,
          deviceSequence: evt.deviceSequence,
          type: evt.type,
          occurredAt: new Date(evt.occurredAt),
          monotonicElapsedMs: evt.monotonicElapsedMs,
          clockOffsetMs: evt.clockOffsetMs,
          clockUncertaintyMs: evt.clockUncertaintyMs,
          payload,
          payloadHash,
          schemaVersion: 1,
        });
        accepted.push({ clientEventId: cid, serverEventId: created._id, status: 'accepted' });
      } catch (err) {
        if (err.code === 11000) {
          const existing = await RaceEvent.findOne({ clientEventId: cid }).lean();
          if (existing) alreadyAccepted.push({ clientEventId: cid, serverEventId: existing._id, status: 'alreadyAccepted' });
          else rejected.push({ clientEventId: cid, status: 'rejected', reason: 'sequence conflict' });
        } else {
          rejected.push({ clientEventId: cid, status: 'rejected', reason: 'server error (retryable)' });
        }
      }
    }

    // Reflect race lifecycle from the board.
    if ((markStarted || accepted.length) && ['draft', 'configured', 'locked'].includes(race.status)) {
      race.status = 'active';
      await race.save();
    }
    if (markCompleted && ['active', 'paused'].includes(race.status)) {
      race.status = 'completed';
      race.resultsState = race.resultsState === 'final' ? 'final' : 'provisional';
      await race.save();
    }

    let receipt;
    try {
      receipt = await SyncReceipt.create({
        batchId, event: race.event, race: race._id, deviceId, checkpointSessionId: `board:${race._id}`,
        eventCount: events.length, acceptedCount: accepted.length, alreadyAcceptedCount: alreadyAccepted.length,
        needsReviewCount: 0, rejectedCount: rejected.length,
        results: [...accepted, ...alreadyAccepted, ...rejected],
      });
    } catch (err) {
      if (err.code === 11000) return ok(summary(await SyncReceipt.findOne({ batchId }).lean()));
      throw err;
    }

    // Keep results fresh after each sync (timings/ranking).
    try { await recomputeRaceResults(race._id); } catch (e) { console.error('[board-sync] recompute failed', e.message); }

    await logRaceAudit({ actor: user, action: 'BOARD_SYNCED', event: race.event, race: race._id, targetType: 'Race', targetId: race._id, meta: { accepted: accepted.length, markCompleted: !!markCompleted } });

    return ok(summary(receipt.toObject ? receipt.toObject() : receipt));
  });
}

function summary(r) {
  const by = (s) => (r.results || []).filter((x) => x.status === s).map((x) => toJSON(x));
  return { batchId: r.batchId, accepted: by('accepted'), alreadyAccepted: by('alreadyAccepted'), rejected: by('rejected') };
}
