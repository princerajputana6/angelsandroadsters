import { connectDB } from '@/lib/db';
import RaceEntry from '@/lib/models/RaceEntry';
import Race from '@/lib/models/Race';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';

const ALLOWED = ['active', 'withdrawn', 'void'];

/**
 * Change an entry's status (plan §4.4): withdraw (rider pulled out) or void
 * (erroneous entry). Both free the race number because the unique index only
 * constrains active entries. Reactivating re-checks number availability.
 */
export async function POST(req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const { status: next, reason } = await req.json();
    if (!ALLOWED.includes(next)) throw Object.assign(new Error('Invalid status'), { status: 400 });

    const entry = await RaceEntry.findById(params.id);
    if (!entry) throw Object.assign(new Error('Entry not found'), { status: 404 });
    if (entry.status === next) return ok({ entry: toJSON(entry) });

    if ((next === 'withdrawn' || next === 'void') && !String(reason || '').trim()) {
      throw Object.assign(new Error(`A reason is required to ${next} an entry`), { status: 400 });
    }

    // Reactivation must not collide with a number taken while it was inactive.
    if (next === 'active') {
      const race = await Race.findById(entry.race).lean();
      let scopeFilter;
      if (race?.numberUniquenessScope === 'event') scopeFilter = { event: entry.event };
      else if (race?.numberUniquenessScope === 'category') scopeFilter = { race: entry.race, category: entry.category };
      else scopeFilter = { race: entry.race };
      const clash = await RaceEntry.findOne({
        ...scopeFilter, raceNumber: entry.raceNumber, status: 'active', _id: { $ne: entry._id },
      }).lean();
      if (clash) {
        throw Object.assign(
          new Error(`Cannot reactivate: number ${entry.raceNumber} is now taken. Reassign first.`),
          { status: 409 }
        );
      }
    }

    entry.status = next;
    entry.updatedBy = user._id;
    try {
      await entry.save();
    } catch (err) {
      if (err.code === 11000) throw Object.assign(new Error('Race number already taken.'), { status: 409 });
      throw err;
    }

    await logRaceAudit({
      actor: user, action: `ENTRY_${next.toUpperCase()}`, event: entry.event, race: entry.race,
      targetType: 'RaceEntry', targetId: entry._id, reason,
    });
    return ok({ entry: toJSON(entry) });
  });
}
