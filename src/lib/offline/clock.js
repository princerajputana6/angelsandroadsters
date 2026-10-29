'use client';
import { getDB } from './db';

/**
 * Clock calibration (plan §10.3). We estimate the device wall-clock offset from
 * the server and an uncertainty bound (half the round-trip time). Monotonic
 * elapsed time uses performance.now() and is ONLY comparable within this same
 * device/session — never across devices (plan §10.3).
 *
 * A wall clock can be changed manually; we record the calibration time so a
 * later suspicious jump can be flagged server-side.
 */
export async function calibrateClock() {
  const db = getDB();
  try {
    const t0 = Date.now();
    const res = await fetch('/api/race/time', { cache: 'no-store' });
    const t1 = Date.now();
    if (!res.ok) throw new Error('time endpoint failed');
    const { now: serverNow } = await res.json();
    const rtt = t1 - t0;
    // Assume symmetric latency: server time corresponds to ~ (t0+t1)/2 locally.
    const localMid = t0 + rtt / 2;
    const offsetMs = serverNow - localMid;
    const uncertaintyMs = Math.ceil(rtt / 2);
    const calibration = { offsetMs, uncertaintyMs, calibratedAt: new Date().toISOString(), rtt };
    await db.meta.put({ key: 'clock', value: calibration });
    return calibration;
  } catch (_) {
    // Offline or failed — keep any previous calibration; report unknown.
    const prev = await db.meta.get('clock');
    return prev?.value || { offsetMs: 0, uncertaintyMs: null, calibratedAt: null };
  }
}

export async function getClock() {
  const db = getDB();
  const row = await db.meta.get('clock');
  return row?.value || { offsetMs: 0, uncertaintyMs: null, calibratedAt: null };
}

/** Monotonic elapsed milliseconds since navigation start (same-session only). */
export function monotonicNow() {
  return typeof performance !== 'undefined' ? Math.round(performance.now()) : null;
}
