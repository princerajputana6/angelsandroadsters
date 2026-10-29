import { connectDB } from './db';
import RaceEvent from './models/RaceEvent';
import { reduceEffective } from './raceHistoryCore';

/**
 * Derive the "effective" timing history of a race from its append-only events
 * (plan §6, §8.1). The pure reduction lives in raceHistoryCore.reduceEffective
 * (unit-tested); this wrapper just fetches the events.
 */
export async function loadEffectiveEvents(raceId) {
  await connectDB();
  const all = await RaceEvent.find({ race: raceId }).sort({ occurredAt: 1, deviceSequence: 1 }).lean();
  const { effective, byEntry, voidedIds, corrections } = reduceEffective(all);
  return { all, effective, byEntry, voidedIds, corrections };
}
