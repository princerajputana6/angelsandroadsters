'use client';
import { getDB, requestPersistentStorage, storageEstimate } from './db';
import { getOrCreateDeviceId } from './device';
import { calibrateClock } from './clock';
import { verifySnapshot } from './checksum';

/**
 * Device preflight (plan §6.1). Runs the mandatory online checks before a device
 * can operate offline:
 *   1. ensure device identity
 *   2. request persistent storage + check free space
 *   3. calibrate the clock
 *   4. claim the session + download the offline bundle
 *   5. VERIFY the bundle checksum before trusting it
 *   6. store bundle + session locally
 * Returns a readiness report. A failed checksum or a stale bundle does NOT mark
 * the device ready — we never operate on an unverified/incomplete roster.
 */
export async function runPreflight(sessionId, deviceLabel) {
  const db = getDB();
  const steps = {};

  const deviceId = await getOrCreateDeviceId();
  steps.deviceId = deviceId;

  steps.persistentStorage = await requestPersistentStorage();
  steps.storage = await storageEstimate();

  steps.clock = await calibrateClock();

  // Claim session + download bundle.
  const res = await fetch(`/api/race/sessions/${sessionId}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, deviceLabel }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || 'Failed to claim session / download bundle');
  }
  const { session, bundle } = await res.json();

  // Integrity verification (plan §6.1.4).
  const checksumOk = await verifySnapshot(bundle.snapshot, bundle.checksum);
  steps.checksumOk = checksumOk;
  steps.bundleStale = !!bundle.stale;
  if (!checksumOk) throw new Error('Downloaded bundle failed checksum verification — not stored.');
  if (bundle.stale) throw new Error('Only a stale config bundle is available. Re-lock the race to regenerate it.');

  // Persist bundle + session locally.
  await db.transaction('rw', db.bundles, db.sessions, async () => {
    await db.bundles.put({
      sessionId: session.sessionId,
      race: session.race,
      configVersion: bundle.version,
      snapshot: bundle.snapshot,
      checksum: bundle.checksum,
      downloadedAt: new Date().toISOString(),
    });
    await db.sessions.put({
      sessionId: session.sessionId,
      race: session.race,
      event: session.event,
      checkpointType: session.checkpointType,
      checkpointId: session.checkpointId,
      configVersion: bundle.version,
      status: 'ready',
      preflightedAt: new Date().toISOString(),
    });
  });

  const lowStorage = steps.storage && steps.storage.pct >= 90;
  return {
    ready: checksumOk && !bundle.stale,
    deviceId,
    session,
    bundle: { version: bundle.version, rosterSize: bundle.snapshot?.roster?.length || 0 },
    warnings: [
      ...(!steps.persistentStorage ? ['Persistent storage was not granted — the OS may evict data under pressure.'] : []),
      ...(lowStorage ? ['Device storage is nearly full.'] : []),
      ...(steps.clock.uncertaintyMs == null ? ['Clock could not be calibrated (offline?).'] : []),
    ],
    steps,
  };
}

export async function getLocalBundle(sessionId) {
  const db = getDB();
  return db.bundles.get(sessionId);
}

export async function getLocalSession(sessionId) {
  const db = getDB();
  return db.sessions.get(sessionId);
}
