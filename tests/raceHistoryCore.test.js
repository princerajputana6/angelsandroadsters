import { describe, it, expect } from 'vitest';
import { reduceEffective } from '../src/lib/raceHistoryCore';

const ev = (o) => ({ deviceId: 'd1', deviceSequence: 1, entry: 'e1', payload: {}, ...o });

describe('effective history reduction (append-only — plan §8.1, §13.4)', () => {
  it('orders effective events by occurredAt then deviceSequence', () => {
    const { effective } = reduceEffective([
      ev({ _id: 'b', type: 'LAP_RECORDED', occurredAt: '2026-01-01T00:02:00Z', deviceSequence: 2 }),
      ev({ _id: 'a', type: 'RIDER_STARTED', occurredAt: '2026-01-01T00:00:00Z', deviceSequence: 1 }),
    ]);
    expect(effective.map((e) => e._id)).toEqual(['a', 'b']);
  });

  it('removes an event targeted by a VOID (never mutates, just excludes)', () => {
    const { effective } = reduceEffective([
      ev({ _id: 'a', type: 'LAP_RECORDED', occurredAt: '2026-01-01T00:00:00Z' }),
      ev({ _id: 'v', type: 'VOID', voidsEventId: 'a', occurredAt: '2026-01-01T00:01:00Z', entry: null }),
    ]);
    expect(effective.find((e) => e._id === 'a')).toBeUndefined();
    expect(effective.length).toBe(0); // VOID itself is meta, excluded too
  });

  it('applies a CORRECTION override to its target', () => {
    const { byEntry } = reduceEffective([
      ev({ _id: 'a', type: 'RIDER_STARTED', occurredAt: '2026-01-01T00:05:00Z' }),
      ev({ _id: 'c', type: 'CORRECTION', correctionOf: 'a', entry: null, occurredAt: '2026-01-01T00:06:00Z', payload: { setOccurredAt: '2026-01-01T00:00:00Z' } }),
    ]);
    const a = byEntry.get('e1').find((e) => e._id === 'a');
    expect(new Date(a.occurredAt).toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('groups effective events by entry', () => {
    const { byEntry } = reduceEffective([
      ev({ _id: 'a', type: 'LAP_RECORDED', entry: 'e1', occurredAt: '2026-01-01T00:00:00Z' }),
      ev({ _id: 'b', type: 'LAP_RECORDED', entry: 'e2', occurredAt: '2026-01-01T00:00:01Z' }),
    ]);
    expect(byEntry.get('e1').length).toBe(1);
    expect(byEntry.get('e2').length).toBe(1);
  });
});
