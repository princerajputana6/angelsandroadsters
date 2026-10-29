'use client';

/**
 * Canonical serialization + SHA-256, byte-for-byte compatible with the server's
 * `canonical()` in src/lib/raceConfig.js, so the device can verify the offline
 * bundle checksum it downloaded during preflight (plan §6.1.4).
 *
 * Keep this IN SYNC with raceConfig.js — any change to one must change the other.
 */
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
}

export async function sha256Hex(str) {
  const bytes = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Recompute the checksum of a snapshot and compare to the expected value. */
export async function verifySnapshot(snapshot, expectedChecksum) {
  const actual = await sha256Hex(canonical(snapshot));
  return actual === expectedChecksum;
}
