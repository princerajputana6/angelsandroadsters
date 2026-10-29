import { connectDB } from './db';
import Race from './models/Race';
import RaceEntry from './models/RaceEntry';
import RaceResult from './models/RaceResult';
import RaceConflict from './models/RaceConflict';
import RaceEvent from './models/RaceEvent';
import { computeProjection } from './raceProjectionCore';

/**
 * Recompute per-entry result projections from the append-only history
 * (plan §9.1.11, §10.2). The computation is pure (raceProjectionCore); this
 * wrapper loads inputs, persists results, and manages rank + race state.
 * Idempotent; each run bumps projectionVersion. Results stay provisional until
 * the race is finalized.
 */
export async function recomputeRaceResults(raceId) {
  await connectDB();
  const race = await Race.findById(raceId).lean();
  if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

  const [allEvents, entries, openConflicts] = await Promise.all([
    RaceEvent.find({ race: raceId }).lean(),
    RaceEntry.find({ race: raceId }).select('_id status').lean(),
    RaceConflict.find({ race: raceId, status: 'open', entry: { $ne: null } }).select('entry').lean(),
  ]);
  const openConflictEntryIds = new Set(openConflicts.map((c) => String(c.entry)));

  const { results } = computeProjection(race, allEvents, entries, openConflictEntryIds);

  for (const r of results) {
    await RaceResult.findOneAndUpdate(
      { race: race._id, entry: r.entry },
      {
        $set: {
          event: race.event,
          status: r.status,
          provisional: r.provisional,
          lapsCompleted: r.lapsCompleted,
          startedAt: r.startedAt,
          finishedAt: r.finishedAt,
          totalTimeMs: r.totalTimeMs,
          bestLapMs: r.bestLapMs,
          hasOpenConflicts: r.hasOpenConflicts,
          computedAt: new Date(),
          ...(r.rank ? { rank: r.rank } : {}),
        },
        ...(r.rank ? {} : { $unset: { rank: '' } }),
        $inc: { projectionVersion: 1 },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  if (race.resultsState === 'none' && allEvents.length) {
    await Race.updateOne({ _id: race._id }, { $set: { resultsState: 'provisional' } });
  }

  const finished = results.filter((r) => r.status === 'finished').length;
  return { entriesProjected: entries.length, finished };
}
