import { describe, it, expect } from 'vitest';
import { canonical, sha256Hex, verifySnapshot } from '../src/lib/offline/checksum';

describe('offline bundle checksum (preflight integrity — plan §6.1.4)', () => {
  it('canonical serialization is stable regardless of key order', () => {
    expect(canonical({ b: 1, a: 2 })).toBe(canonical({ a: 2, b: 1 }));
    expect(canonical({ a: [1, 2, { y: 1, x: 2 }] })).toBe(canonical({ a: [1, 2, { x: 2, y: 1 }] }));
  });

  it('verifySnapshot accepts a matching checksum', async () => {
    const snapshot = { race: { id: 'r1', configVersion: 1 }, roster: [{ raceNumber: 7 }] };
    const checksum = await sha256Hex(canonical(snapshot));
    expect(await verifySnapshot(snapshot, checksum)).toBe(true);
  });

  it('verifySnapshot rejects a tampered snapshot', async () => {
    const snapshot = { race: { id: 'r1' }, roster: [{ raceNumber: 7 }] };
    const checksum = await sha256Hex(canonical(snapshot));
    const tampered = { race: { id: 'r1' }, roster: [{ raceNumber: 8 }] };
    expect(await verifySnapshot(tampered, checksum)).toBe(false);
  });
});
