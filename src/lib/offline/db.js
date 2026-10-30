import Dexie from 'dexie';

/**
 * Offline-first local database for race checkpoints (plan §7.1).
 *
 * Durability rules baked in here:
 *  - Stable primary keys; indexed query fields.
 *  - Versioned schema with ADD-ONLY migrations. We NEVER delete the database on
 *    a deployment or a migration error (plan §7.1, §7.3). If a future migration
 *    cannot complete, the recovery/export screen handles it — we do not wipe.
 *  - The event + its outbox item are written in ONE transaction (see
 *    writeLocalEvent in ./eventStore) so a committed event always has a queue
 *    entry and vice-versa (plan §7.2).
 *
 * This module is browser-only (IndexedDB). Import it exclusively from client
 * components / client-side code.
 */

let _db = null;

export function getDB() {
  if (_db) return _db;
  const db = new Dexie('AngelsRaceControl');

  // v1 — initial schema. Add future stores/indexes in a new version() block;
  // never rewrite this one.
  db.version(1).stores({
    // key/value singletons: 'device' (deviceId + flags), 'persist', etc.
    meta: '&key',
    // monotonic counters, e.g. { key:'deviceSequence', value:N }
    counters: '&key',
    // cached offline bundle (race rules + roster) per checkpoint session
    bundles: '&sessionId, race, configVersion',
    // preflighted sessions the official can operate
    sessions: '&sessionId, race, status',
    // canonical local race events (append-only on this device)
    localEvents: '&clientEventId, sessionId, entryId, type, syncState, deviceSequence',
    // delivery queue mirroring un-acknowledged events
    outbox: '&clientEventId, sessionId, state, nextAttemptAt',
    // durable per-batch receipts returned by the server
    receipts: '&batchId, sessionId',
    // locally-surfaced conflicts/validation failures awaiting review
    conflicts: '&clientEventId, sessionId',
  });

  // v2 — add the transient "on track" state for the In/Out timer board. Only
  // the NEW store is listed; Dexie carries v1 stores forward (add-only, never
  // destructive). A rider currently out-on-track is live local state; each
  // COMPLETED lap is a durable LAP_RECORDED event written on the IN press.
  db.version(2).stores({
    // id = `${sessionId}:${entryId}` → { outAt } while a rider is on track
    trackState: '&id, sessionId',
  });

  // v3 — fully-offline Race Board: a race's roster/config downloaded while
  // online so the board runs with no connectivity (survives app restart).
  db.version(3).stores({
    // keyed by raceId: { raceId, name, event, roster:[...], startedAt, endedAt, downloadedAt }
    boardRaces: '&raceId',
  });

  _db = db;
  return db;
}

/**
 * Transactionally allocate the next per-device sequence number (plan §7.2.3).
 * Must be called inside (or wrap) a readwrite transaction on 'counters'.
 */
export async function nextDeviceSequence(db = getDB()) {
  return db.transaction('rw', db.counters, async () => {
    const row = await db.counters.get('deviceSequence');
    const next = (row?.value || 0) + 1;
    await db.counters.put({ key: 'deviceSequence', value: next });
    return next;
  });
}

/** Best-effort request for persistent storage so the OS won't evict us (plan §7.4). */
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist) {
      const already = await navigator.storage.persisted?.();
      if (already) return true;
      return await navigator.storage.persist();
    }
  } catch (_) { /* unsupported — caller shows a warning */ }
  return false;
}

/** Storage estimate for the low-space warning (plan §7.4). Returns {usage,quota,pct} or null. */
export async function storageEstimate() {
  try {
    if (navigator.storage?.estimate) {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      return { usage, quota, pct: quota ? Math.round((usage / quota) * 100) : 0 };
    }
  } catch (_) { /* ignore */ }
  return null;
}
