import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import Rider from '@/lib/models/Rider';
import RaceEntry from '@/lib/models/RaceEntry';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { parseOrThrow, bulkAddSchema } from '@/lib/raceValidation';

/**
 * POST /api/race/entries/bulk — onboard selected pool riders into a race.
 * Auto-assigns the next available race numbers (from startNumber, else after
 * the current highest), skips riders already in the race, copies name / bike /
 * photo from the pool and links poolRider. body: { race, riderIds, startNumber?, category? }
 */
export async function POST(req) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const body = parseOrThrow(bulkAddSchema, await req.json());

    const race = await Race.findById(body.race).lean();
    if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

    const [riders, existing] = await Promise.all([
      Rider.find({ _id: { $in: body.riderIds } }).lean(),
      RaceEntry.find({ race: race._id, status: 'active' }).select('raceNumber poolRider').lean(),
    ]);
    const ridersById = Object.fromEntries(riders.map((r) => [String(r._id), r]));
    const taken = new Set(existing.map((e) => e.raceNumber));
    const already = new Set(existing.filter((e) => e.poolRider).map((e) => String(e.poolRider)));

    let next = body.startNumber ?? (existing.reduce((m, e) => Math.max(m, e.raceNumber), 0) + 1);
    const nextFree = () => { while (taken.has(next)) next += 1; const n = next; taken.add(n); next += 1; return n; };

    const created = [];
    const skipped = [];
    // Preserve the selection order (riderIds), not the DB order.
    for (const riderId of body.riderIds) {
      const r = ridersById[riderId];
      if (!r) { skipped.push({ riderId, reason: 'not found' }); continue; }
      if (already.has(riderId)) { skipped.push({ riderId, reason: 'already in race' }); continue; }
      const raceNumber = nextFree();
      try {
        const entry = await RaceEntry.create({
          event: race.event,
          race: race._id,
          category: body.category || undefined,
          poolRider: r._id,
          rider: r.user || undefined,
          riderName: r.name,
          displayName: r.displayName || undefined,
          raceNumber,
          bike: r.bike || {},
          photos: { rider: r.photo?.url ? r.photo : {} },
          createdBy: user._id,
        });
        created.push(entry);
        already.add(riderId);
      } catch (err) {
        if (err.code === 11000) { skipped.push({ riderId, reason: `number ${raceNumber} taken` }); }
        else throw err;
      }
    }

    await logRaceAudit({
      actor: user, action: 'ENTRIES_BULK_ADDED', event: race.event, race: race._id,
      targetType: 'Race', targetId: race._id, meta: { created: created.length, skipped: skipped.length },
    });

    return ok({ created: created.length, skipped, entries: toJSON(created) }, 201);
  });
}
