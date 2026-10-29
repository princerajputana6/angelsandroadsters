import { connectDB } from './db';
import Race from './models/Race';
import RaceEvent from './models/RaceEvent';
import RaceConflict from './models/RaceConflict';
import { findConflicts, conflictKey } from './raceConflictCore';

/**
 * Detect cross-device conflicts and persist them idempotently (plan §10.2).
 * The detection is pure (raceConflictCore.findConflicts); this wrapper loads
 * events and writes RaceConflict rows, skipping any finding whose deterministic
 * key already exists (open OR already resolved/waived — so resolutions stick).
 * It NEVER deletes or mutates events.
 */
export async function detectConflicts(raceId) {
  await connectDB();
  const race = await Race.findById(raceId).lean();
  if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

  const allEvents = await RaceEvent.find({ race: raceId }).lean();
  const findings = findConflicts(race, allEvents);

  let created = 0;
  for (const f of findings) {
    const key = conflictKey(f.type, f.entry, f.ids, f.keyExtra);
    const existing = await RaceConflict.findOne({ race: race._id, key }).select('_id').lean();
    if (existing) continue;
    await RaceConflict.create({
      event: race.event,
      race: race._id,
      entry: f.entry || undefined,
      type: f.type,
      status: 'open',
      key,
      relatedEventIds: f.ids,
      detail: f.detail,
    });
    created += 1;
  }

  const openCount = await RaceConflict.countDocuments({ race: race._id, status: 'open' });
  return { created, openCount, findings: findings.length };
}
