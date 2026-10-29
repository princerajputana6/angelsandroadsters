'use client';
import { getDB } from './db';
import { writeLocalEvent, listLocalEvents } from './eventStore';

/**
 * In/Out track-timer board logic (offline-durable).
 *
 * Model: press OUT when a rider leaves for a lap, IN when they return. Each
 * OUT→IN segment is one lap, timed as (inAt − outAt) — only on-track time, the
 * paddock rest between IN and the next OUT is not counted. Completed laps are
 * durable, syncable LAP_RECORDED events carrying `durationMs` in their payload.
 * The "currently out" marker lives in the `trackState` store so a lap in
 * progress survives a reload/restart (the live timer resumes from outAt).
 */
const keyOf = (sessionId, entryId) => `${sessionId}:${entryId}`;

export async function pressOut(sessionId, entryId) {
  const db = getDB();
  await db.trackState.put({ id: keyOf(sessionId, entryId), sessionId, entryId, outAt: Date.now() });
}

/** Cancel an accidental OUT without recording a lap. */
export async function cancelOut(sessionId, entryId) {
  const db = getDB();
  await db.trackState.delete(keyOf(sessionId, entryId));
}

export async function pressIn(sessionId, raceId, entryId, { raceNumber, checkpointId } = {}) {
  const db = getDB();
  const row = await db.trackState.get(keyOf(sessionId, entryId));
  const outAt = row?.outAt || null;
  const inAt = Date.now();
  const durationMs = outAt ? inAt - outAt : null;

  await writeLocalEvent({
    sessionId,
    raceId,
    entryId,
    type: 'LAP_RECORDED',
    payload: {
      raceNumber,
      checkpointId,
      outAt: outAt ? new Date(outAt).toISOString() : null,
      inAt: new Date(inAt).toISOString(),
      durationMs,
      source: 'track-board',
    },
  });
  if (row) await db.trackState.delete(row.id);
  return { durationMs };
}

/**
 * Per-rider board state for a session: who is currently out (+ since when) and
 * each rider's lap count / total on-track / last / best lap, from the durable
 * LAP_RECORDED events (newest-first ordering preserved by listLocalEvents).
 */
export async function getBoardState(sessionId) {
  const db = getDB();
  const [events, outRows] = await Promise.all([
    listLocalEvents(sessionId),
    db.trackState.where('sessionId').equals(sessionId).toArray(),
  ]);

  const outByEntry = {};
  for (const r of outRows) outByEntry[r.entryId] = r.outAt;

  const stats = {};
  for (const e of events) {
    if (e.type !== 'LAP_RECORDED' || !e.entryId) continue;
    const s = (stats[e.entryId] ||= { laps: 0, totalMs: 0, lastMs: null, bestMs: null });
    s.laps += 1;
    const d = e.payload?.durationMs;
    if (typeof d === 'number') {
      s.totalMs += d;
      if (s.lastMs === null) s.lastMs = d; // events are newest-first → first seen is latest
      if (s.bestMs === null || d < s.bestMs) s.bestMs = d;
    }
  }
  return { outByEntry, stats };
}
