import { describe, it, expect } from 'vitest';
import { findConflicts, conflictKey } from '../src/lib/raceConflictCore';

let seq = 0;
const ev = (o) => ({ _id: `ev-${++seq}`, deviceId: 'd1', deviceSequence: seq, entry: 'e1', payload: {}, ...o });
const types = (findings) => findings.map((f) => f.type);

describe('conflict detection (plan §10.2, §13.4)', () => {
  it('flags a double start', () => {
    const f = findConflicts({}, [
      ev({ type: 'RIDER_STARTED', occurredAt: '2026-01-01T00:00:00Z' }),
      ev({ type: 'RIDER_STARTED', occurredAt: '2026-01-01T00:00:05Z' }),
    ]);
    expect(types(f)).toContain('DOUBLE_START');
  });

  it('flags DNF + finish for the same rider', () => {
    const f = findConflicts({}, [
      ev({ type: 'RIDER_FINISHED', occurredAt: '2026-01-01T00:10:00Z' }),
      ev({ type: 'DNF', occurredAt: '2026-01-01T00:11:00Z' }),
    ]);
    expect(types(f)).toContain('DNF_FINISH_CONFLICT');
  });

  it('flags a lap recorded before the start', () => {
    const f = findConflicts({}, [
      ev({ type: 'RIDER_STARTED', occurredAt: '2026-01-01T00:05:00Z' }),
      ev({ type: 'LAP_RECORDED', occurredAt: '2026-01-01T00:04:00Z' }),
    ]);
    expect(types(f)).toContain('FINISH_BEFORE_START');
  });

  it('flags a duplicate / suspiciously short lap against minLapDurationMs', () => {
    const race = { minLapDurationMs: 60000 };
    const dup = findConflicts(race, [
      ev({ type: 'LAP_RECORDED', occurredAt: '2026-01-01T00:00:00.000Z' }),
      ev({ type: 'LAP_RECORDED', occurredAt: '2026-01-01T00:00:00.000Z' }), // 0ms gap
    ]);
    expect(types(dup)).toContain('DUPLICATE_LAP');

    const short = findConflicts(race, [
      ev({ type: 'LAP_RECORDED', occurredAt: '2026-01-01T00:00:00Z' }),
      ev({ type: 'LAP_RECORDED', occurredAt: '2026-01-01T00:00:10Z' }), // 10s < 60s
    ]);
    expect(types(short)).toContain('SUSPICIOUS_INTERVAL');
  });

  it('does not flag short laps when no minimum is configured', () => {
    const f = findConflicts({}, [
      ev({ type: 'LAP_RECORDED', occurredAt: '2026-01-01T00:00:00Z' }),
      ev({ type: 'LAP_RECORDED', occurredAt: '2026-01-01T00:00:01Z' }),
    ]);
    expect(types(f)).not.toContain('SUSPICIOUS_INTERVAL');
  });

  it('flags high clock uncertainty', () => {
    const f = findConflicts({}, [ev({ type: 'LAP_RECORDED', occurredAt: '2026-01-01T00:00:00Z', clockUncertaintyMs: 5000 })]);
    expect(types(f)).toContain('CLOCK_UNCERTAINTY');
  });

  it('flags per-device sequence gaps', () => {
    const f = findConflicts({}, [
      { _id: 'a', type: 'LAP_RECORDED', entry: 'e1', deviceId: 'd9', deviceSequence: 1, occurredAt: '2026-01-01T00:00:00Z' },
      { _id: 'b', type: 'LAP_RECORDED', entry: 'e1', deviceId: 'd9', deviceSequence: 5, occurredAt: '2026-01-01T00:00:10Z' },
    ]);
    expect(types(f)).toContain('SEQUENCE_GAP');
  });

  it('produces a stable dedup key independent of id order', () => {
    expect(conflictKey('DOUBLE_START', 'e1', ['b', 'a'])).toBe(conflictKey('DOUBLE_START', 'e1', ['a', 'b']));
  });
});
