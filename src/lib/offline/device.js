'use client';
import { getDB } from './db';

/**
 * Stable per-device identity (plan §8.1 deviceId). Generated once and stored in
 * IndexedDB; survives reloads/restarts. NOT a substitute for user auth (plan
 * §3.1) — it only tags the source device on each event.
 */
export async function getOrCreateDeviceId() {
  const db = getDB();
  const row = await db.meta.get('device');
  if (row?.value?.deviceId) return row.value.deviceId;
  const deviceId = crypto.randomUUID();
  await db.meta.put({ key: 'device', value: { deviceId, createdAt: new Date().toISOString() } });
  return deviceId;
}

export async function getDeviceMeta() {
  const db = getDB();
  const row = await db.meta.get('device');
  return row?.value || null;
}
