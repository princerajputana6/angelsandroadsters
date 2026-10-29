import { reduceEffective } from './raceHistoryCore';

/**
 * Pure result projection (no DB) — unit-testable (plan §13.1, §13.4).
 *
 * @param {object} race   { startModel, resultsState }
 * @param {Array}  allEvents  full append-only event list for the race
 * @param {Array}  entries    [{ _id, status }]
 * @param {Set}    openConflictEntryIds  stringified entry ids with open conflicts
 * @returns {{ results: Array, finishedOrder: Array }} results carry a `rank`
 *          for finished entries (laps desc, then total time asc).
 */
export function computeProjection(race, allEvents, entries, openConflictEntryIds = new Set()) {
  const { effective, byEntry } = reduceEffective(allEvents);
  const commonStart = effective.find((e) => e.type === 'RACE_STARTED');
  const provisional = race.resultsState !== 'final';

  const results = [];
  const finished = [];

  for (const entry of entries) {
    const key = String(entry._id);
    const evs = byEntry.get(key) || [];

    const startEv = race.startModel === 'common' ? commonStart : evs.find((e) => e.type === 'RIDER_STARTED');
    const lapEvs = evs.filter((e) => e.type === 'LAP_RECORDED');
    const finishEv = evs.find((e) => e.type === 'RIDER_FINISHED');
    const dnfEv = evs.find((e) => e.type === 'DNF');

    let status = 'dns';
    if (finishEv) status = 'finished';
    else if (dnfEv) status = 'dnf';
    else if (startEv || lapEvs.length) status = 'running';

    const startedAt = startEv ? new Date(startEv.occurredAt) : undefined;
    const finishedAt = finishEv ? new Date(finishEv.occurredAt) : undefined;
    const totalTimeMs = startedAt && finishedAt ? finishedAt - startedAt : undefined;

    const crossings = [
      ...(startedAt ? [startedAt.getTime()] : []),
      ...lapEvs.map((e) => new Date(e.occurredAt).getTime()),
      ...(finishedAt ? [finishedAt.getTime()] : []),
    ].sort((a, b) => a - b);
    let bestLapMs;
    for (let i = 1; i < crossings.length; i++) {
      const gap = crossings[i] - crossings[i - 1];
      if (gap > 0 && (bestLapMs === undefined || gap < bestLapMs)) bestLapMs = gap;
    }

    const result = {
      entry: entry._id,
      status,
      provisional,
      lapsCompleted: lapEvs.length,
      startedAt,
      finishedAt,
      totalTimeMs,
      bestLapMs,
      hasOpenConflicts: openConflictEntryIds.has(key),
    };
    results.push(result);
    if (status === 'finished') finished.push({ entry: entry._id, laps: lapEvs.length, totalTimeMs });
  }

  finished.sort((a, b) => b.laps - a.laps || ((a.totalTimeMs ?? Infinity) - (b.totalTimeMs ?? Infinity)));
  finished.forEach((f, i) => {
    const r = results.find((x) => String(x.entry) === String(f.entry));
    if (r) r.rank = i + 1;
  });

  return { results, finishedOrder: finished };
}
