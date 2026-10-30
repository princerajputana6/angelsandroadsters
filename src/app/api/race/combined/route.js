import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import Event from '@/lib/models/Event';
import RaceResult from '@/lib/models/RaceResult';
import RaceEntry from '@/lib/models/RaceEntry'; // registers ref for populate
import Rider from '@/lib/models/Rider';         // registers ref for populate
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager } from '@/lib/raceAuth';

/**
 * GET /api/race/combined — championship standings across a chosen set of races.
 *   ?races=id1,id2,...  → combine exactly these races (any event)
 *   ?event=<id>         → combine every race in this event (convenience)
 *
 * Each rider's championship total is the sum of the points they scored in each
 * selected race (the points come from that race's ranking + its scoring table,
 * as assigned on the Results page). Riders are matched across races by their
 * global pool-rider identity, falling back to name. The response includes a
 * per-race breakdown (points + finishing position) and how many of the selected
 * rounds each rider actually competed in, so the UI can single out the riders
 * who raced every round.
 */
export async function GET(req) {
  return handler(async () => {
    await requireRaceManager();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const racesParam = searchParams.get('races');
    const eventId = searchParams.get('event');

    let raceDocs;
    if (racesParam) {
      const ids = racesParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (!ids.length) throw Object.assign(new Error('no races selected'), { status: 400 });
      raceDocs = await Race.find({ _id: { $in: ids } })
        .select('name slug status event createdAt').populate('event', 'title').sort({ createdAt: 1 }).lean();
    } else if (eventId) {
      raceDocs = await Race.find({ event: eventId })
        .select('name slug status event createdAt').populate('event', 'title').sort({ createdAt: 1 }).lean();
    } else {
      throw Object.assign(new Error('races or event query param required'), { status: 400 });
    }
    if (!raceDocs.length) throw Object.assign(new Error('No races found'), { status: 404 });

    const raceIds = raceDocs.map((r) => r._id);

    const results = await RaceResult.find({ race: { $in: raceIds } })
      .populate({
        path: 'entry',
        select: 'raceNumber riderName displayName poolRider',
        populate: { path: 'poolRider', select: 'participantNo name' },
      })
      .lean();

    const effTime = (r) => (r.adjustedTimeMs != null ? r.adjustedTimeMs : (r.totalTimeMs ?? Infinity));
    const effStatus = (r) => r.manualStatus || r.status;

    // Finishing position per race (points first, then effective time) — mirrors
    // the per-race Results page so the champion page shows the same ranking.
    const rankByRaceEntry = new Map(); // `${race}:${entry}` -> position
    for (const race of raceDocs) {
      const rows = results
        .filter((r) => String(r.race) === String(race._id) && r.entry && effStatus(r) === 'finished')
        .sort((a, b) => ((b.manualPoints || 0) - (a.manualPoints || 0)) || (effTime(a) - effTime(b))
          || ((a.entry?.raceNumber ?? 1e9) - (b.entry?.raceNumber ?? 1e9)));
      rows.forEach((r, i) => rankByRaceEntry.set(`${race._id}:${r.entry._id}`, i + 1));
    }

    // Group per participant (pool-rider id, else name).
    const byRider = new Map();
    for (const r of results) {
      const entry = r.entry;
      if (!entry) continue;
      const pool = entry.poolRider;
      const name = entry.displayName || entry.riderName || pool?.name || `#${entry.raceNumber}`;
      const key = pool?._id ? `pool:${pool._id}` : `name:${name.trim().toLowerCase()}`;
      const points = Number(r.manualPoints) || 0;
      const status = effStatus(r);

      let row = byRider.get(key);
      if (!row) {
        row = { key, name, participantNo: pool?.participantNo ?? null, total: 0, rounds: 0, perRace: {} };
        byRider.set(key, row);
      }
      if (pool?.participantNo != null) row.participantNo = pool.participantNo;
      row.perRace[String(r.race)] = { points, status, position: rankByRaceEntry.get(`${r.race}:${entry._id}`) ?? null };
      row.total += points;
      row.rounds += 1;
    }

    const standings = [...byRider.values()].sort(
      (a, b) => (b.total - a.total) || ((a.participantNo ?? 1e9) - (b.participantNo ?? 1e9)) || a.name.localeCompare(b.name)
    );
    let rank = 0;
    for (const s of standings) { rank += 1; s.rank = rank; }

    return ok({
      races: toJSON(raceDocs.map((r) => ({ _id: r._id, name: r.name, status: r.status, event: r.event?.title || '' }))),
      totalRaces: raceDocs.length,
      standings: toJSON(standings),
    });
  });
}
