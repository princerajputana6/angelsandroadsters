import { describe, it, expect } from 'vitest';
import { eventPayloadHash } from '../src/lib/raceEventHash';

const base = {
  type: 'LAP_RECORDED',
  raceId: 'r1',
  entryId: 'e1',
  deviceId: 'd1',
  deviceSequence: 5,
  occurredAt: '2026-10-29T10:00:00.000Z',
  payload: { lapNumberCandidate: 1, checkpointId: 'cp1' },
};

describe('eventPayloadHash (idempotency key — plan §9.1.7-8)', () => {
  it('is deterministic for identical content (retry → same hash)', () => {
    expect(eventPayloadHash(base)).toBe(eventPayloadHash({ ...base }));
  });

  it('is independent of payload key order (canonical sorting)', () => {
    const reordered = { ...base, payload: { checkpointId: 'cp1', lapNumberCandidate: 1 } };
    expect(eventPayloadHash(reordered)).toBe(eventPayloadHash(base));
  });

  it('changes when identifying content changes (→ integrity conflict)', () => {
    expect(eventPayloadHash({ ...base, deviceSequence: 6 })).not.toBe(eventPayloadHash(base));
    expect(eventPayloadHash({ ...base, type: 'RIDER_FINISHED' })).not.toBe(eventPayloadHash(base));
    expect(eventPayloadHash({ ...base, payload: { lapNumberCandidate: 2, checkpointId: 'cp1' } })).not.toBe(eventPayloadHash(base));
  });

  it('treats missing optional payload as empty object, stably', () => {
    const a = eventPayloadHash({ ...base, payload: undefined });
    const b = eventPayloadHash({ ...base, payload: {} });
    expect(a).toBe(b);
  });
});
