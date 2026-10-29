import { describe, it, expect } from 'vitest';
import { computeProjection } from '../src/lib/raceProjectionCore';

const race = { startModel: 'individual', resultsState: 'provisional' };
let seq = 0;
const ev = (entry, type, occurredAt) => ({ _id: `${entry}-${type}-${occurredAt}`, entry, type, occurredAt, deviceId: 'd1', deviceSequence: ++seq, payload: {} });
const resultFor = (res, entry) => res.find((r) => String(r.entry) === entry);

describe('result projection (plan §9.1.11, §13.4)', () => {
  it('computes finished status, laps, total and best lap', () => {
    const events = [
      ev('e1', 'RIDER_STARTED', '2026-01-01T00:00:00Z'),
      ev('e1', 'LAP_RECORDED', '2026-01-01T00:01:00Z'), // 60s
      ev('e1', 'LAP_RECORDED', '2026-01-01T00:01:40Z'), // 40s (best)
      ev('e1', 'RIDER_FINISHED', '2026-01-01T00:03:00Z'),
    ];
    const { results } = computeProjection(race, events, [{ _id: 'e1' }]);
    const r = resultFor(results, 'e1');
    expect(r.status).toBe('finished');
    expect(r.lapsCompleted).toBe(2);
    expect(r.totalTimeMs).toBe(180000);
    expect(r.bestLapMs).toBe(40000);
    expect(r.rank).toBe(1);
  });

  it('ranks by laps desc then total time asc', () => {
    const events = [
      // e1: 3 laps, 100s
      ev('e1', 'RIDER_STARTED', '2026-01-01T00:00:00Z'),
      ev('e1', 'LAP_RECORDED', '2026-01-01T00:00:30Z'),
      ev('e1', 'LAP_RECORDED', '2026-01-01T00:01:00Z'),
      ev('e1', 'LAP_RECORDED', '2026-01-01T00:01:30Z'),
      ev('e1', 'RIDER_FINISHED', '2026-01-01T00:01:40Z'),
      // e2: 3 laps, 90s (faster) -> should rank 1
      ev('e2', 'RIDER_STARTED', '2026-01-01T00:00:00Z'),
      ev('e2', 'LAP_RECORDED', '2026-01-01T00:00:20Z'),
      ev('e2', 'LAP_RECORDED', '2026-01-01T00:00:50Z'),
      ev('e2', 'LAP_RECORDED', '2026-01-01T00:01:10Z'),
      ev('e2', 'RIDER_FINISHED', '2026-01-01T00:01:30Z'),
      // e3: 2 laps -> fewer laps, ranks last
      ev('e3', 'RIDER_STARTED', '2026-01-01T00:00:00Z'),
      ev('e3', 'LAP_RECORDED', '2026-01-01T00:00:30Z'),
      ev('e3', 'LAP_RECORDED', '2026-01-01T00:01:00Z'),
      ev('e3', 'RIDER_FINISHED', '2026-01-01T00:01:05Z'),
    ];
    const { results } = computeProjection(race, events, [{ _id: 'e1' }, { _id: 'e2' }, { _id: 'e3' }]);
    expect(resultFor(results, 'e2').rank).toBe(1);
    expect(resultFor(results, 'e1').rank).toBe(2);
    expect(resultFor(results, 'e3').rank).toBe(3);
  });

  it('marks DNF, running and DNS correctly and leaves them unranked', () => {
    const events = [
      ev('e1', 'RIDER_STARTED', '2026-01-01T00:00:00Z'),
      ev('e1', 'DNF', '2026-01-01T00:02:00Z'),
      ev('e2', 'RIDER_STARTED', '2026-01-01T00:00:00Z'), // running, no finish
    ];
    const { results } = computeProjection(race, events, [{ _id: 'e1' }, { _id: 'e2' }, { _id: 'e3' }]);
    expect(resultFor(results, 'e1').status).toBe('dnf');
    expect(resultFor(results, 'e2').status).toBe('running');
    expect(resultFor(results, 'e3').status).toBe('dns');
    expect(resultFor(results, 'e1').rank).toBeUndefined();
  });

  it('reflects provisional flag and open-conflict flag', () => {
    const final = computeProjection({ ...race, resultsState: 'final' }, [], [{ _id: 'e1' }]);
    expect(resultFor(final.results, 'e1').provisional).toBe(false);

    const withConflict = computeProjection(race, [], [{ _id: 'e1' }], new Set(['e1']));
    expect(resultFor(withConflict.results, 'e1').hasOpenConflicts).toBe(true);
  });
});
