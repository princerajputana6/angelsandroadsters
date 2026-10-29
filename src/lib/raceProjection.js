import { connectDB } from './db';
import Race from './models/Race';
import RaceEntry from './models/RaceEntry';
import RaceResult from './models/RaceResult';
import RaceConflict from './models/RaceConflict';
import { loadEffectiveEvents } from './raceHistory';

/**
 * Recompute per-entry result projections from the append-only history
 * (plan §9.1.11, §10.2). Idempotent: running it repeatedly on the same history
 * yields the same results; each run bumps projectionVersion so stale writes can
 * be detected. Results are ALWAYS provisional until the race is finalized.
 */
export async function recomputeRaceResults(raceId) {
  await connectDB();
  const race = await Race.findById(raceId).lean();
  if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

  const { effective, byEntry } = await loadEffectiveEvents(raceId);
  const entries = await RaceEntry.find({ race: raceId }).select('_id status').lean();

  // Common-start reference (earliest RACE_STARTED), used when startModel=common.
  const commonStart = effective.find((e) => e.type === 'RACE_STARTED');

  // Which entries currently have open conflicts (so results can flag them).
  const openConflictEntries = new Set(
    (await RaceConflict.find({ race: raceId, status: 'open', entry: { $ne: null } }).select('entry').lean())
      .map((c) => String(c.entry))
  );

  const provisional = race.resultsState !== 'final';
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

    // Best lap = smallest positive gap between consecutive crossings.
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

    const doc = {
      event: race.event,
      race: race._id,
      entry: entry._id,
      status,
      provisional,
      lapsCompleted: lapEvs.length,
      startedAt,
      finishedAt,
      totalTimeMs,
      bestLapMs,
      hasOpenConflicts: openConflictEntries.has(key),
      computedAt: new Date(),
    };

    await RaceResult.findOneAndUpdate(
      { race: race._id, entry: entry._id },
      { $set: doc, $inc: { projectionVersion: 1 } },
      { upsert: true, setDefaultsOnInsert: true }
    );

    if (status === 'finished') finished.push({ entry: entry._id, laps: lapEvs.length, totalTimeMs });
  }

  // Rank finished entries: more laps first, then lower total time.
  finished.sort((a, b) => b.laps - a.laps || ((a.totalTimeMs ?? Infinity) - (b.totalTimeMs ?? Infinity)));
  let rank = 0;
  for (const f of finished) {
    rank += 1;
    await RaceResult.updateOne({ race: race._id, entry: f.entry }, { $set: { rank } });
  }
  // Clear rank on non-finished results.
  await RaceResult.updateMany(
    { race: race._id, status: { $ne: 'finished' } },
    { $unset: { rank: '' } }
  );

  // Move an un-started/none race into provisional once it has any events.
  if (race.resultsState === 'none' && effective.length) {
    await Race.updateOne({ _id: race._id }, { $set: { resultsState: 'provisional' } });
  }

  return { entriesProjected: entries.length, finished: finished.length };
}
