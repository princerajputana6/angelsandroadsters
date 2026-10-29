'use client';
import { getDB } from './db';
import { getOrCreateDeviceId } from './device';

/**
 * Outbox sync engine (plan §9.2). Drains un-acknowledged local events to the
 * server batch endpoint and applies per-event results. Key guarantees:
 *   - Never deletes a local event on timeout/failure (plan §9.1.14) — only the
 *     server's explicit per-event acknowledgement marks it acknowledged.
 *   - Retries reuse the same clientEventId + payload (idempotent).
 *   - Bounded exponential backoff with jitter; capped max delay (plan §2.9).
 *   - navigator.onLine is only a trigger hint — reachability is proven by the
 *     fetch result, not the flag (plan §9.2).
 */
const MAX_ATTEMPTS = 8;
const MAX_BACKOFF_MS = 60_000;
const inFlight = new Set(); // sessionIds currently syncing

export function backoff(attempts) {
  const base = Math.min(1000 * 2 ** attempts, MAX_BACKOFF_MS);
  return base / 2 + Math.random() * (base / 2); // jitter in [base/2, base]
}

export async function syncNow(sessionId) {
  if (inFlight.has(sessionId)) return { skipped: 'in-flight' };
  inFlight.add(sessionId);
  const db = getDB();
  try {
    const now = Date.now();
    const due = await db.outbox
      .where('sessionId').equals(sessionId)
      .filter((o) => o.state !== 'failed' && (o.nextAttemptAt || 0) <= now)
      .toArray();
    if (!due.length) return { sent: 0 };

    const cids = due.map((o) => o.clientEventId);
    const events = await db.localEvents.where('clientEventId').anyOf(cids).toArray();
    const byId = Object.fromEntries(events.map((e) => [e.clientEventId, e]));

    // Mark uploading.
    await db.transaction('rw', db.outbox, db.localEvents, async () => {
      for (const o of due) {
        await db.outbox.update(o.clientEventId, { state: 'uploading' });
        await db.localEvents.update(o.clientEventId, { syncState: 'uploading' });
      }
    });

    const deviceId = await getOrCreateDeviceId();
    const pendingCount = await db.outbox.where('sessionId').equals(sessionId).count();
    const batchId = crypto.randomUUID();
    const wire = due
      .map((o) => byId[o.clientEventId])
      .filter(Boolean)
      .map((e) => ({
        clientEventId: e.clientEventId,
        deviceSequence: e.deviceSequence,
        raceId: e.raceId,
        entryId: e.entryId || undefined,
        type: e.type,
        occurredAt: e.occurredAt,
        monotonicElapsedMs: e.monotonicElapsedMs,
        clockOffsetMs: e.clockOffsetMs,
        clockUncertaintyMs: e.clockUncertaintyMs,
        payload: e.payload,
      }));

    let res, data;
    try {
      res = await fetch('/api/race-sync/v1/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, deviceId, checkpointSessionId: sessionId, schemaVersion: 1, events: wire, reportedPending: pendingCount }),
      });
    } catch (netErr) {
      // Network failure / timeout — return items to pending with backoff. The
      // server may or may not have received them; the next retry uses the same
      // ids so the server returns alreadyAccepted if it did (plan §9.2).
      await requeue(db, due, 'network error');
      return { error: 'network', sent: 0 };
    }

    if (res.status === 401 || res.status === 403) {
      // Auth expired / session revoked — pause sync, keep everything (plan §9.2).
      await requeue(db, due, `auth (${res.status})`, true);
      return { error: 'auth', status: res.status };
    }
    if (!res.ok) {
      await requeue(db, due, `server ${res.status}`);
      return { error: 'server', status: res.status };
    }

    data = await res.json();
    await applyResults(db, sessionId, data);
    await db.receipts.put({ batchId: data.batchId, sessionId, receivedAt: new Date().toISOString(), ...summary(data) });
    return { ok: true, ...summary(data) };
  } finally {
    inFlight.delete(sessionId);
  }
}

async function requeue(db, due, reason, pauseLonger = false) {
  await db.transaction('rw', db.outbox, db.localEvents, async () => {
    for (const o of due) {
      const attempts = (o.attempts || 0) + 1;
      const failed = attempts >= MAX_ATTEMPTS && !pauseLonger;
      await db.outbox.update(o.clientEventId, {
        state: failed ? 'failed' : 'pending',
        attempts,
        lastError: reason,
        nextAttemptAt: Date.now() + (pauseLonger ? MAX_BACKOFF_MS : backoff(attempts)),
      });
      // Local event stays pending (or failed) — never acknowledged on failure.
      await db.localEvents.update(o.clientEventId, { syncState: failed ? 'failed' : 'pending' });
    }
  });
}

async function applyResults(db, sessionId, data) {
  const ack = new Set([...(data.accepted || []), ...(data.alreadyAccepted || [])].map((r) => r.clientEventId));
  const review = new Set((data.needsReview || []).map((r) => r.clientEventId));
  const rejected = data.rejected || [];

  await db.transaction('rw', db.outbox, db.localEvents, async () => {
    for (const cid of ack) {
      await db.localEvents.update(cid, { syncState: 'acknowledged' });
      await db.outbox.delete(cid);
    }
    for (const cid of review) {
      await db.localEvents.update(cid, { syncState: 'needsReview' });
      await db.outbox.delete(cid); // won't resolve by retry — surfaced for review
    }
    for (const r of rejected) {
      const retryable = /retryable/i.test(r.reason || '');
      if (retryable) {
        const o = await db.outbox.get(r.clientEventId);
        const attempts = (o?.attempts || 0) + 1;
        await db.outbox.update(r.clientEventId, { state: 'pending', attempts, lastError: r.reason, nextAttemptAt: Date.now() + backoff(attempts) });
        await db.localEvents.update(r.clientEventId, { syncState: 'pending' });
      } else {
        await db.outbox.update(r.clientEventId, { state: 'failed', lastError: r.reason });
        await db.localEvents.update(r.clientEventId, { syncState: 'failed' });
      }
    }
  });
}

function summary(data) {
  return {
    accepted: (data.accepted || []).length,
    alreadyAccepted: (data.alreadyAccepted || []).length,
    needsReview: (data.needsReview || []).length,
    rejected: (data.rejected || []).length,
  };
}

/**
 * Start multi-trigger syncing for a session (plan §7.3): immediately, on
 * network reconnect, when the tab becomes visible, and on a bounded interval.
 * Returns a stop() cleanup. Background Sync is only an optional optimization.
 */
export function startSyncEngine(sessionId, { intervalMs = 20_000, onResult } = {}) {
  let stopped = false;
  const run = async (why) => {
    if (stopped) return;
    const r = await syncNow(sessionId).catch((e) => ({ error: 'exception', message: e.message }));
    if (onResult) onResult(r, why);
  };

  const onOnline = () => run('online');
  const onVisible = () => { if (document.visibilityState === 'visible') run('visible'); };
  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
  const interval = setInterval(() => run('interval'), intervalMs);
  run('startup');

  return () => {
    stopped = true;
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
    clearInterval(interval);
  };
}
