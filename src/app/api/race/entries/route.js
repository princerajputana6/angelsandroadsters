import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import RaceCategory from '@/lib/models/RaceCategory';
import RaceEntry from '@/lib/models/RaceEntry';
import User from '@/lib/models/User'; // registers ref for populate
import Registration from '@/lib/models/Registration'; // registers ref for populate
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { parseOrThrow, entryCreateSchema } from '@/lib/raceValidation';

/**
 * Application-level uniqueness guard for the race's configured scope. The
 * per-race DB unique index (uniq_active_race_number) is the hard guarantee for
 * the default 'race' scope; for 'event'/'category' scope we additionally check
 * here. A DB-level unique index for those wider scopes is a documented
 * follow-up handled by the ensure-indexes script (plan §5.2, §8.3).
 */
async function assertNumberFree(race, raceNumber, category, excludeId) {
  const base = { raceNumber, status: 'active' };
  if (excludeId) base._id = { $ne: excludeId };
  let scopeFilter;
  if (race.numberUniquenessScope === 'event') scopeFilter = { event: race.event };
  else if (race.numberUniquenessScope === 'category') scopeFilter = { race: race._id, category };
  else scopeFilter = { race: race._id };
  const clash = await RaceEntry.findOne({ ...base, ...scopeFilter }).lean();
  if (clash) {
    throw Object.assign(
      new Error(`Race number ${raceNumber} is already assigned in this ${race.numberUniquenessScope}.`),
      { status: 409 }
    );
  }
}

// Turn a Mongo duplicate-key error into a clean 409 (plan §8.3 — treat
// duplicate-key as an expected conflict path, never a 500).
function as409IfDuplicate(err) {
  if (err && err.code === 11000) {
    return Object.assign(new Error('Race number already taken (unique index).'), { status: 409 });
  }
  return err;
}

// GET /api/race/entries?race=<id>
export async function GET(req) {
  return handler(async () => {
    await requireRaceManager();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const race = searchParams.get('race');
    if (!race) throw Object.assign(new Error('race query param required'), { status: 400 });
    const status = searchParams.get('status');
    const filter = { race };
    if (status) filter.status = status;
    const entries = await RaceEntry.find(filter)
      .populate('category', 'name code')
      .sort({ raceNumber: 1 })
      .lean();
    return ok({ entries: toJSON(entries) });
  });
}

// POST /api/race/entries
export async function POST(req) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const body = parseOrThrow(entryCreateSchema, await req.json());

    const race = await Race.findById(body.race).lean();
    if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

    if (body.category) {
      const cat = await RaceCategory.findOne({ _id: body.category, race: race._id }).lean();
      if (!cat) throw Object.assign(new Error('Category does not belong to this race'), { status: 400 });
    }

    await assertNumberFree(race, body.raceNumber, body.category);

    try {
      const entry = await RaceEntry.create({
        ...body,
        event: race.event,
        createdBy: user._id,
      });
      await logRaceAudit({
        actor: user, action: 'ENTRY_CREATED', event: race.event, race: race._id,
        targetType: 'RaceEntry', targetId: entry._id, meta: { raceNumber: entry.raceNumber },
      });
      return ok({ entry: toJSON(entry) }, 201);
    } catch (err) {
      throw as409IfDuplicate(err);
    }
  });
}
