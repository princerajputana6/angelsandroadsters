'use client';
import { getDB } from './db';
import { getOrCreateDeviceId } from './device';
import { backoff } from './sync';
import { boardSessionId, getBoardRace, setBoardFlags } from './boardStore';

/**
 * Auto-sync for the fully-offline Race Board. Drains this device's queued board
 * events (and the race's start/end markers) to /api/race/board-sync whenever the
 * device has connectivity. Triggers: on reconnect (`online`), on tab focus, on a
 * short interval, and at startup — so the moment mobile data / wifi returns,
 * everything uploads automatically. Never deletes an event until the server
 * acknowledges it; retries reuse the same clientEventId (idempotent).
 */
const MAX_ATTEMPTS = 8;
const inFlight = new Set();

export async function syncBoardNow(raceId) {
  if (inFlight.has(raceId)) return { skipped: 'in-flight' };
  inFlight.add(raceId);
  const db = getDB();
  const sessionId = boardSessionId(raceId);
  try {
    const now = Date.now();
    const due = await db.outbox
      .where('sessionId').equals(sessionId)
      .filter((o) => o.state !== 'failed' && (o.nextAttemptAt || 0) <= now)
      .toArray();

    const boardRace = await getBoardRace(raceId);
    const needCompletion = !!boardRace?.endedAt && !boardRace?.completionSynced;
    if (!due.length && !needCompletion) return { sent: 0 };

    const cids = due.map((o) => o.clientEventId);
    const localEvents = await db.localEvents.where('clientEventId').anyOf(cids).toArray();
    const byId = Object.fromEntries(localEvents.map((e) => [e.clientEventId, e]));

    await db.transaction('rw', db.outbox, db.localEvents, async () => {
      for (const o of due) {
        await db.outbox.update(o.clientEventId, { state: 'uploading' });
        await db.localEvents.update(o.clientEventId, { syncState: 'uploading' });
      }
    });

    const deviceId = await getOrCreateDeviceId();
    const batchId = crypto.randomUUID();
    const events = due.map((o) => byId[o.clientEventId]).filter(Boolean).map((e) => ({
      clientEventId: e.clientEventId,
      deviceSequence: e.deviceSequence,
      entryId: e.entryId,
      type: e.type,
      occurredAt: e.occurredAt,
      monotonicElapsedMs: e.monotonicElapsedMs,
      clockOffsetMs: e.clockOffsetMs,
      clockUncertaintyMs: e.clockUncertaintyMs,
      payload: e.payload,
    }));

    let res;
    try {
      res = await fetch('/api/race/board-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, raceId, deviceId, events, markStarted: !!boardRace?.startedAt, markCompleted: needCompletion }),
      });
    } catch (_) {
      await requeue(db, due, 'network');
      return { error: 'network' };
    }

    if (res.status === 401 || res.status === 403) { await requeue(db, due, `auth ${res.status}`, true); return { error: 'auth', status: res.status }; }
    if (!res.ok) { await requeue(db, due, `server ${res.status}`); return { error: 'server', status: res.status }; }

    const data = await res.json();
    const ack = new Set([...(data.accepted || []), ...(data.alreadyAccepted || [])].map((r) => r.clientEventId));
    const rejected = data.rejected || [];

    await db.transaction('rw', db.outbox, db.localEvents, async () => {
      for (const cid of ack) { await db.localEvents.update(cid, { syncState: 'acknowledged' }); await db.outbox.delete(cid); }
      for (const r of rejected) {
        const retryable = /retryable/i.test(r.reason || '');
        if (retryable) {
          const o = await db.outbox.get(r.clientEventId); const attempts = (o?.attempts || 0) + 1;
          await db.outbox.update(r.clientEventId, { state: 'pending', attempts, lastError: r.reason, nextAttemptAt: Date.now() + backoff(attempts) });
          await db.localEvents.update(r.clientEventId, { syncState: 'pending' });
        } else {
          await db.outbox.update(r.clientEventId, { state: 'failed', lastError: r.reason });
          await db.localEvents.update(r.clientEventId, { syncState: 'failed' });
        }
      }
    });

    if (needCompletion) await setBoardFlags(raceId, { completionSynced: true });
    return { ok: true, accepted: (data.accepted || []).length, alreadyAccepted: (data.alreadyAccepted || []).length, rejected: rejected.length };
  } finally {
    inFlight.delete(raceId);
  }
}

async function requeue(db, due, reason, pauseLonger = false) {
  await db.transaction('rw', db.outbox, db.localEvents, async () => {
    for (const o of due) {
      const attempts = (o.attempts || 0) + 1;
      const failed = attempts >= MAX_ATTEMPTS && !pauseLonger;
      await db.outbox.update(o.clientEventId, { state: failed ? 'failed' : 'pending', attempts, lastError: reason, nextAttemptAt: Date.now() + (pauseLonger ? 60000 : backoff(attempts)) });
      await db.localEvents.update(o.clientEventId, { syncState: failed ? 'failed' : 'pending' });
    }
  });
}

/** Start auto-sync triggers for a board race. Returns a stop() cleanup. */
export function startBoardSyncEngine(raceId, { intervalMs = 15000, onResult } = {}) {
  let stopped = false;
  const run = async (why) => { if (stopped) return; const r = await syncBoardNow(raceId).catch((e) => ({ error: 'exception', message: e.message })); onResult?.(r, why); };
  const onOnline = () => run('online');
  const onVisible = () => { if (document.visibilityState === 'visible') run('visible'); };
  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
  const iv = setInterval(() => run('interval'), intervalMs);
  run('startup');
  return () => { stopped = true; window.removeEventListener('online', onOnline); document.removeEventListener('visibilitychange', onVisible); clearInterval(iv); };
}
