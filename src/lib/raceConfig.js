import { createHash } from 'crypto';
import { connectDB } from './db';
import Race from './models/Race';
import RaceCategory from './models/RaceCategory';
import RaceEntry from './models/RaceEntry';
import RaceConfiguration from './models/RaceConfiguration';

/**
 * Build a deterministic, canonical snapshot of a race's rules + roster and
 * persist it as an immutable RaceConfiguration for the race's current
 * configVersion (plan §4.3.11–12, §6.1). This is the "offline bundle" a device
 * downloads during preflight and verifies via the checksum.
 *
 * Idempotent per version: re-running for the same configVersion upserts the same
 * document (so a lock retry never creates duplicates). A later config change
 * bumps configVersion, producing a NEW version rather than overwriting.
 */
function canonical(value) {
  // Stable stringify (sorted keys) so the checksum is deterministic.
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
}

export async function buildRaceSnapshot(raceId) {
  await connectDB();
  const race = await Race.findById(raceId).lean();
  if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

  const [categories, entries] = await Promise.all([
    RaceCategory.find({ race: raceId }).sort({ sortOrder: 1, name: 1 }).lean(),
    RaceEntry.find({ race: raceId, status: 'active' }).sort({ raceNumber: 1 }).lean(),
  ]);

  // Only the fields a checkpoint device needs offline — no secrets, minimal PII.
  const snapshot = {
    race: {
      id: String(race._id),
      event: String(race.event),
      name: race.name,
      startModel: race.startModel,
      finishType: race.finishType,
      expectedLaps: race.expectedLaps,
      durationMinutes: race.durationMinutes,
      allowedCheckpoints: race.allowedCheckpoints || [],
      minLapDurationMs: race.minLapDurationMs,
      maxLapDurationMs: race.maxLapDurationMs,
      numberUniquenessScope: race.numberUniquenessScope,
      configVersion: race.configVersion,
    },
    categories: categories.map((c) => ({
      id: String(c._id),
      name: c.name,
      code: c.code,
    })),
    roster: entries.map((e) => ({
      id: String(e._id),
      raceNumber: e.raceNumber,
      displayName: e.displayName || e.riderName,
      category: e.category ? String(e.category) : null,
      riderPhoto: e.photos?.rider?.url || '',
    })),
    generatedAt: new Date().toISOString(),
  };

  const checksum = createHash('sha256').update(canonical(snapshot)).digest('hex');
  return { race, snapshot, checksum, version: race.configVersion };
}

/**
 * Fetch the offline bundle a device should download: the RaceConfiguration
 * matching the race's current configVersion. Returns { bundle, stale } where
 * stale=true means only an older version exists (config changed but was not
 * re-snapshotted) — the caller should surface that rather than hand out a wrong
 * bundle (plan §4.3.12, §6.1).
 */
export async function getCurrentBundle(race) {
  await connectDB();
  const exact = await RaceConfiguration.findOne({ race: race._id, version: race.configVersion }).lean();
  if (exact) return { bundle: exact, stale: false };
  const latest = await RaceConfiguration.findOne({ race: race._id }).sort({ version: -1 }).lean();
  return { bundle: latest || null, stale: !!latest };
}

export async function persistRaceSnapshot(raceId, createdBy) {
  const { race, snapshot, checksum, version } = await buildRaceSnapshot(raceId);
  const doc = await RaceConfiguration.findOneAndUpdate(
    { race: race._id, version },
    { $set: { event: race.event, snapshot, checksum, createdBy } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc;
}
