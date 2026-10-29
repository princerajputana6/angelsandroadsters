'use client';
import { getDB } from './db';
import { getOrCreateDeviceId } from './device';
import { getClock, monotonicNow } from './clock';

/**
 * Atomic local race-event write (plan §7.2). The event and its outbox item are
 * committed in ONE IndexedDB transaction together with the per-device sequence
 * allocation, so a committed event ALWAYS has a queue entry (and a sequence),
 * and nothing is ever shown as "saved" before the transaction commits.
 *
 * A retry of the SAME user action must reuse its clientEventId — callers never
 * call this twice for one confirmed action; corrections are separate events.
 */
export async function writeLocalEvent({ sessionId, raceId, entryId, type, payload = {} }) {
  const db = getDB();
  const deviceId = await getOrCreateDeviceId();
  const clock = await getClock();

  const clientEventId = crypto.randomUUID();
  const occurredAt = new Date().toISOString(); // device wall clock; offset stored alongside
  const monotonicElapsedMs = monotonicNow();

  const record = {
    clientEventId,
    sessionId,
    raceId,
    entryId: entryId || null,
    type,
    occurredAt,
    monotonicElapsedMs,
    clockOffsetMs: clock.offsetMs ?? null,
    clockUncertaintyMs: clock.uncertaintyMs ?? null,
    payload,
    deviceId,
    syncState: 'pending', // pending | uploading | acknowledged | needsReview | failed
    createdAt: occurredAt,
  };

  // Single transaction over counters + localEvents + outbox (atomic).
  await db.transaction('rw', db.counters, db.localEvents, db.outbox, async () => {
    const row = await db.counters.get('deviceSequence');
    const deviceSequence = (row?.value || 0) + 1;
    await db.counters.put({ key: 'deviceSequence', value: deviceSequence });
    record.deviceSequence = deviceSequence;

    await db.localEvents.add(record);
    await db.outbox.add({
      clientEventId,
      sessionId,
      state: 'pending', // pending | uploading | failed
      attempts: 0,
      nextAttemptAt: 0,
      lastError: null,
      enqueuedAt: occurredAt,
    });
  });

  return record;
}

export async function listLocalEvents(sessionId) {
  const db = getDB();
  const rows = await db.localEvents.where('sessionId').equals(sessionId).toArray();
  return rows.sort((a, b) => b.deviceSequence - a.deviceSequence);
}

export async function localEventCounts(sessionId) {
  const db = getDB();
  const rows = await db.localEvents.where('sessionId').equals(sessionId).toArray();
  const counts = { total: rows.length, pending: 0, acknowledged: 0, needsReview: 0, failed: 0 };
  for (const r of rows) {
    if (r.syncState === 'acknowledged') counts.acknowledged++;
    else if (r.syncState === 'needsReview') counts.needsReview++;
    else if (r.syncState === 'failed') counts.failed++;
    else counts.pending++;
  }
  return counts;
}

/** Last local event for a given entry (for lap-count display) — plan §6.3. */
export async function lastEventForEntry(sessionId, entryId, type) {
  const db = getDB();
  const rows = await db.localEvents
    .where('sessionId').equals(sessionId)
    .filter((r) => r.entryId === entryId && (!type || r.type === type))
    .toArray();
  if (!rows.length) return null;
  return rows.sort((a, b) => b.deviceSequence - a.deviceSequence)[0];
}

export async function countLapsForEntry(sessionId, entryId) {
  const db = getDB();
  return db.localEvents
    .where('sessionId').equals(sessionId)
    .filter((r) => r.entryId === entryId && r.type === 'LAP_RECORDED')
    .count();
}
