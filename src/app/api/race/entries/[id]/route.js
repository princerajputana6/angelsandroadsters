import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import RaceEntry from '@/lib/models/RaceEntry';
import RaceEvent from '@/lib/models/RaceEvent';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { parseOrThrow, entryUpdateSchema } from '@/lib/raceValidation';

async function loadEntryAndRace(id) {
  const entry = await RaceEntry.findById(id);
  if (!entry) throw Object.assign(new Error('Entry not found'), { status: 404 });
  const race = await Race.findById(entry.race).lean();
  if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });
  return { entry, race };
}

async function assertNumberFree(race, raceNumber, category, excludeId) {
  const base = { raceNumber, status: 'active', _id: { $ne: excludeId } };
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

// GET /api/race/entries/:id
export async function GET(_req, { params }) {
  return handler(async () => {
    await requireRaceManager();
    await connectDB();
    const entry = await RaceEntry.findById(params.id).populate('category', 'name code').lean();
    if (!entry) throw Object.assign(new Error('Entry not found'), { status: 404 });
    return ok({ entry: toJSON(entry) });
  });
}

// PUT /api/race/entries/:id — edit fields. A race-number change after the race
// leaves draft/configured requires a reason and is recorded in numberHistory
// (plan §4.4, §5.2).
export async function PUT(req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const { entry, race } = await loadEntryAndRace(params.id);
    const raw = await req.json();
    const reason = typeof raw.reason === 'string' ? raw.reason : '';
    const body = parseOrThrow(entryUpdateSchema, raw);

    const changingNumber = body.raceNumber !== undefined && body.raceNumber !== entry.raceNumber;
    if (changingNumber) {
      const lockedLifecycle = !['draft', 'configured'].includes(race.status);
      if (lockedLifecycle && !reason.trim()) {
        throw Object.assign(
          new Error('A reason is required to change a race number after the race is locked.'),
          { status: 400 }
        );
      }
      await assertNumberFree(race, body.raceNumber, body.category ?? entry.category, entry._id);
      entry.numberHistory.push({ from: entry.raceNumber, to: body.raceNumber, reason, by: user._id });
    }

    Object.assign(entry, body);
    entry.updatedBy = user._id;

    try {
      await entry.save();
    } catch (err) {
      if (err.code === 11000) throw Object.assign(new Error('Race number already taken.'), { status: 409 });
      throw err;
    }

    await logRaceAudit({
      actor: user, action: changingNumber ? 'ENTRY_NUMBER_CHANGED' : 'ENTRY_UPDATED',
      event: entry.event, race: entry.race, targetType: 'RaceEntry', targetId: entry._id, reason,
      meta: changingNumber ? { to: entry.raceNumber } : undefined,
    });
    return ok({ entry: toJSON(entry) });
  });
}

// DELETE /api/race/entries/:id — hard delete ONLY for a draft race entry with no
// recorded events. Otherwise callers must withdraw/void via the status route so
// history is preserved (plan §4.4).
export async function DELETE(_req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const { entry, race } = await loadEntryAndRace(params.id);

    const eventCount = await RaceEvent.countDocuments({ entry: entry._id });
    if (eventCount > 0 || race.status !== 'draft') {
      throw Object.assign(
        new Error('Entry has history or race is not draft. Withdraw or void it instead.'),
        { status: 409 }
      );
    }
    await RaceEntry.deleteOne({ _id: entry._id });
    await logRaceAudit({
      actor: user, action: 'ENTRY_DELETED', event: entry.event, race: entry.race,
      targetType: 'RaceEntry', targetId: entry._id,
    });
    return ok({ deleted: true });
  });
}
