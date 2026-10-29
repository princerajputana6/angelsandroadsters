import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import Event from '@/lib/models/Event';
import RaceEntry from '@/lib/models/RaceEntry';
import RaceCategory from '@/lib/models/RaceCategory';
import RaceConflict from '@/lib/models/RaceConflict';
import RaceDevice from '@/lib/models/RaceDevice';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager } from '@/lib/raceAuth';

// GET /api/race/dashboard — aggregate overview for the admin Race Dashboard.
export async function GET() {
  return handler(async () => {
    await requireRaceManager();
    await connectDB();

    const races = await Race.find({})
      .populate('event', 'title slug startDate')
      .sort({ createdAt: -1 })
      .lean();

    const raceIds = races.map((r) => r._id);

    // Per-race entry / active-entry / category counts in a few grouped queries.
    const [entryAgg, activeEntryAgg, catAgg, openConflictAgg, deviceCount] = await Promise.all([
      RaceEntry.aggregate([{ $match: { race: { $in: raceIds } } }, { $group: { _id: '$race', n: { $sum: 1 } } }]),
      RaceEntry.aggregate([
        { $match: { race: { $in: raceIds }, status: 'active' } },
        { $group: { _id: '$race', n: { $sum: 1 } } },
      ]),
      RaceCategory.aggregate([{ $match: { race: { $in: raceIds } } }, { $group: { _id: '$race', n: { $sum: 1 } } }]),
      RaceConflict.aggregate([
        { $match: { race: { $in: raceIds }, status: 'open' } },
        { $group: { _id: '$race', n: { $sum: 1 } } },
      ]),
      RaceDevice.countDocuments({}),
    ]);

    const byId = (agg) => Object.fromEntries(agg.map((a) => [String(a._id), a.n]));
    const entries = byId(entryAgg);
    const activeEntries = byId(activeEntryAgg);
    const cats = byId(catAgg);
    const conflicts = byId(openConflictAgg);

    const rows = races.map((r) => ({
      ...toJSON(r),
      counts: {
        entries: entries[String(r._id)] || 0,
        activeEntries: activeEntries[String(r._id)] || 0,
        categories: cats[String(r._id)] || 0,
        openConflicts: conflicts[String(r._id)] || 0,
      },
    }));

    const statusCounts = races.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    return ok({
      summary: {
        totalRaces: races.length,
        statusCounts,
        totalEntries: Object.values(entries).reduce((a, b) => a + b, 0),
        totalOpenConflicts: Object.values(conflicts).reduce((a, b) => a + b, 0),
        totalDevices: deviceCount,
      },
      races: rows,
    });
  });
}
