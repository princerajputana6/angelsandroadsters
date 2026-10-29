import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import RaceResult from '@/lib/models/RaceResult';
import RaceEntry from '@/lib/models/RaceEntry'; // registers ref for populate
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager } from '@/lib/raceAuth';

// GET /api/race/results?race=<id> — ranked result projections + race state.
export async function GET(req) {
  return handler(async () => {
    await requireRaceManager();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const raceId = searchParams.get('race');
    if (!raceId) throw Object.assign(new Error('race query param required'), { status: 400 });

    const race = await Race.findById(raceId).select('name status resultsState configVersion expectedLaps finishType').lean();
    if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

    const results = await RaceResult.find({ race: raceId })
      .populate('entry', 'raceNumber riderName displayName category')
      .lean();

    // finished (by rank) first, then running, dnf, dns; stable by number.
    const order = { finished: 0, running: 1, dnf: 2, disqualified: 3, dns: 4 };
    results.sort((a, b) =>
      (order[a.status] - order[b.status]) ||
      ((a.rank ?? 1e9) - (b.rank ?? 1e9)) ||
      ((a.entry?.raceNumber ?? 1e9) - (b.entry?.raceNumber ?? 1e9))
    );

    return ok({ race: toJSON(race), results: toJSON(results) });
  });
}
