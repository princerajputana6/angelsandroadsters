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

/**
 * Pull a fresh roster from the server and merge it into the cached board race,
 * so riders ADDED to the race after it was downloaded show up on the board.
 * Online-only and non-destructive: preserves local flags (startedAt/endedAt/
 * completionSynced) and never drops a rider already in the local roster (anyone
 * an official may have started/finished). Returns the current cached row on
 * failure or when offline — the board keeps working from what it has.
 */
export async function refreshBoardRoster(raceId) {
  const db = getDB();
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return db.boardRaces.get(raceId);
  let data;
  try {
    const res = await fetch(`/api/race/races/${raceId}/board`, { cache: 'no-store' });
    if (!res.ok) return db.boardRaces.get(raceId);
    data = await res.json();
  } catch {
    return db.boardRaces.get(raceId);
  }

  const existing = await db.boardRaces.get(raceId);
  const serverRoster = (data.riders || []).map((r) => ({ entryId: r.entryId, raceNumber: r.raceNumber, riderName: r.riderName }));
  // Server roster wins, but keep any local-only rider so we never drop someone
  // already timed on this device.
  const byId = new Map(serverRoster.map((r) => [r.entryId, r]));
  for (const r of existing?.roster || []) if (!byId.has(r.entryId)) byId.set(r.entryId, r);
  const roster = [...byId.values()].sort((a, b) => a.raceNumber - b.raceNumber);

  const row = {
    ...(existing || {}),
    raceId,
    name: data.race?.name || existing?.name || 'Race',
    status: data.race?.status ?? existing?.status,
    roster,
    downloadedAt: existing?.downloadedAt || new Date().toISOString(),
    rosterSyncedAt: new Date().toISOString(),
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

// ---------------------------------------------------------------- reset timing
const TIMING_TYPES = ['RIDER_STARTED', 'RIDER_FINISHED'];

/** Delete this device's local timing events (+ their outbox items) for a race,
 *  optionally just one entry. Immediate: the board re-derives to "not started". */
async function clearLocalTiming(sessionId, entryId) {
  const db = getDB();
  await db.transaction('rw', db.localEvents, db.outbox, async () => {
    const rows = await db.localEvents
      .where('sessionId').equals(sessionId)
      .filter((r) => TIMING_TYPES.includes(r.type) && (!entryId || r.entryId === entryId))
      .toArray();
    for (const r of rows) {
      await db.localEvents.delete(r.clientEventId);
      await db.outbox.delete(r.clientEventId);
    }
  });
}

async function postBoardReset(raceId, bodyObj) {
  const res = await fetch(`/api/race/races/${raceId}/board`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyObj),
  });
  if (!res.ok) throw new Error(`reset failed (${res.status})`);
}

/**
 * Send any queued resets to the server so already-synced timing events are
 * cleared there too. Online-only and best-effort: if it can't reach the server
 * the resets stay queued and retry on the next sync tick. Called from the
 * board's sync loop and right after a reset.
 */
export async function flushPendingResets(raceId) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  const db = getDB();
  const row = await db.boardRaces.get(raceId);
  if (!row) return;
  const { pendingResetAll, pendingResetEntryIds = [] } = row;
  if (!pendingResetAll && pendingResetEntryIds.length === 0) return;
  try {
    if (pendingResetAll) {
      await postBoardReset(raceId, { action: 'reset-all' });
    } else {
      for (const entryId of pendingResetEntryIds) {
        await postBoardReset(raceId, { action: 'reset', entryId });
      }
    }
  } catch {
    return; // stay queued; next tick retries
  }
  await db.boardRaces.update(raceId, { pendingResetAll: false, pendingResetEntryIds: [] });
}

/** Reset one rider's timing on the offline board (local now, server when online). */
export async function resetBoardRider(raceId, entryId) {
  await clearLocalTiming(boardSessionId(raceId), entryId);
  const db = getDB();
  const row = await db.boardRaces.get(raceId);
  if (row && !row.pendingResetAll) {
    const ids = new Set(row.pendingResetEntryIds || []);
    ids.add(entryId);
    await db.boardRaces.update(raceId, { pendingResetEntryIds: [...ids] });
  }
  await flushPendingResets(raceId);
}

/** Reset every rider's timing on the offline board (local now, server when online). */
export async function resetBoardAll(raceId) {
  await clearLocalTiming(boardSessionId(raceId), null);
  await getDB().boardRaces.update(raceId, { pendingResetAll: true, pendingResetEntryIds: [] });
  await flushPendingResets(raceId);
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
