'use client';
import { getDB } from './db';
import { listLocalEvents } from './eventStore';

/**
 * Local cache for the fully-offline Race Board. A race's roster is downloaded
 * while online and stored in IndexedDB so the board runs with no connectivity
 * (and survives an app restart). Per-rider OUT/IN state is derived from the
 * local events this device recorded (sessionId = `board:<raceId>`).
 */
export const boardSessionId = (raceId) => `board:${raceId}`;

export async function listBoardRaces() {
  const db = getDB();
  const rows = await db.boardRaces.toArray();
  return rows.sort((a, b) => (b.downloadedAt || '').localeCompare(a.downloadedAt || ''));
}

export async function getBoardRace(raceId) {
  return getDB().boardRaces.get(raceId);
}

/** Download a race's roster from the server (online) and cache it for offline use. */
export async function downloadRaceForBoard(raceId) {
  const res = await fetch(`/api/race/races/${raceId}/board`, { cache: 'no-store' });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || 'Failed to download race');
  }
  const data = await res.json();
  const db = getDB();
  const existing = await db.boardRaces.get(raceId);
  const row = {
    raceId,
    name: data.race?.name || 'Race',
    status: data.race?.status,
    roster: (data.riders || []).map((r) => ({ entryId: r.entryId, raceNumber: r.raceNumber, riderName: r.riderName })),
    downloadedAt: new Date().toISOString(),
    startedAt: existing?.startedAt || null,
    endedAt: existing?.endedAt || null,
  };
  await db.boardRaces.put(row);
  return row;
}

export async function setBoardFlags(raceId, patch) {
  const db = getDB();
  const row = await db.boardRaces.get(raceId);
  if (!row) return null;
  const next = { ...row, ...patch };
  await db.boardRaces.put(next);
  return next;
}

export async function removeBoardRace(raceId) {
  await getDB().boardRaces.delete(raceId);
}

/**
 * Derive each rider's board state from this device's local events:
 *   idle → not started, out → started (on track), done → finished.
 * Returns { byEntry, allIn, counts }.
 */
export async function deriveBoardState(raceId, roster) {
  const sessionId = boardSessionId(raceId);
  const events = await listLocalEvents(sessionId);
  const start = {}; const finish = {};
  for (const e of events) {
    if (!e.entryId) continue;
    if (e.type === 'RIDER_STARTED' && !start[e.entryId]) start[e.entryId] = e.occurredAt;
    if (e.type === 'RIDER_FINISHED' && !finish[e.entryId]) finish[e.entryId] = e.occurredAt;
  }
  const byEntry = {};
  for (const r of roster) {
    const s = start[r.entryId]; const f = finish[r.entryId];
    byEntry[r.entryId] = {
      state: f ? 'done' : s ? 'out' : 'idle',
      startedAt: s || null,
      finishedAt: f || null,
      timeMs: s && f ? new Date(f) - new Date(s) : null,
    };
  }
  const states = roster.map((r) => byEntry[r.entryId].state);
  const counts = {
    total: roster.length,
    out: states.filter((x) => x === 'out').length,
    done: states.filter((x) => x === 'done').length,
  };
  const allIn = roster.length > 0 && states.every((x) => x === 'done');
  return { byEntry, allIn, counts };
}
