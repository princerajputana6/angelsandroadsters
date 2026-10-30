import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import Event from '@/lib/models/Event';
import RaceResult from '@/lib/models/RaceResult';
import RaceEntry from '@/lib/models/RaceEntry'; // registers ref for populate
import Rider from '@/lib/models/Rider';         // registers ref for populate
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager } from '@/lib/raceAuth';

/**
 * GET /api/race/combined?event=<id> — championship standings across every race
 * in an event. Each rider's championship points are the sum of their manual
 * points (as assigned on each race's Results page) over all races they entered,
 * grouped by their global pool-rider identity (falling back to name). Returns a
 * per-race breakdown so the table can show each round as a column.
 */
export async function GET(req) {
  return handler(async () => {
    await requireRaceManager();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event');
    if (!eventId) throw Object.assign(new Error('event query param required'), { status: 400 });

    const event = await Event.findById(eventId).select('title slug startDate endDate').lean();
    if (!event) throw Object.assign(new Error('Event not found'), { status: 404 });

    // Rounds in the event, oldest first so columns read in race order.
    const races = await Race.find({ event: eventId }).select('name slug status createdAt').sort({ createdAt: 1 }).lean();
    const raceIds = races.map((r) => r._id);

    const results = await RaceResult.find({ race: { $in: raceIds } })
      .populate({
        path: 'entry',
        select: 'raceNumber riderName displayName poolRider',
        populate: { path: 'poolRider', select: 'participantNo name' },
      })
      .lean();

    // Group per participant. Prefer the stable pool-rider id; else the name.
    const byRider = new Map();
    for (const r of results) {
      const entry = r.entry;
      if (!entry) continue;
      const pool = entry.poolRider;
      const name = entry.displayName || entry.riderName || (pool?.name) || `#${entry.raceNumber}`;
      const key = pool?._id ? `pool:${pool._id}` : `name:${name.trim().toLowerCase()}`;
      const points = Number(r.manualPoints) || 0;
      const effStatus = r.manualStatus || r.status;

      let row = byRider.get(key);
      if (!row) {
        row = {
          key,
          name,
          participantNo: pool?.participantNo ?? null,
          total: 0,
          rounds: 0,
          perRace: {},
        };
        byRider.set(key, row);
      }
      // Keep the best known display name / participant number.
      if (pool?.participantNo != null) row.participantNo = pool.participantNo;
      row.perRace[String(r.race)] = { points, status: effStatus };
      row.total += points;
      row.rounds += 1;
    }

    const standings = [...byRider.values()].sort(
      (a, b) => (b.total - a.total) || ((a.participantNo ?? 1e9) - (b.participantNo ?? 1e9)) || a.name.localeCompare(b.name)
    );
    let rank = 0;
    for (const s of standings) { rank += 1; s.rank = rank; }

    return ok({
      event: toJSON(event),
      races: toJSON(races.map((r) => ({ _id: r._id, name: r.name, status: r.status }))),
      standings: toJSON(standings),
    });
  });
}
