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

    // Effective time = manual override when set, else the computed total.
    // Effective status = manual override (e.g. a disqualification) when set,
    // else the computed status.
    for (const r of results) {
      r.effectiveTimeMs = r.adjustedTimeMs != null ? r.adjustedTimeMs : r.totalTimeMs;
      r.effectiveStatus = r.manualStatus || r.status;
    }

    // finished first, ranked by POINTS (more is better), then by effective
    // time, then by number. Points are 0 by default, so without any manual
    // points this stays pure time-based ranking.
    const order = { finished: 0, running: 1, dnf: 2, disqualified: 3, dns: 4 };
    results.sort((a, b) =>
      ((order[a.effectiveStatus] ?? 9) - (order[b.effectiveStatus] ?? 9)) ||
      ((b.manualPoints || 0) - (a.manualPoints || 0)) ||
      ((a.effectiveTimeMs ?? 1e15) - (b.effectiveTimeMs ?? 1e15)) ||
      ((a.entry?.raceNumber ?? 1e9) - (b.entry?.raceNumber ?? 1e9))
    );

    // Display rank over finished riders, reflecting any edited times. A
    // disqualified rider (manual or computed) is excluded from the rank.
    let rank = 0;
    for (const r of results) {
      if (r.effectiveStatus === 'finished') { rank += 1; r.displayRank = rank; }
    }

    return ok({ race: toJSON(race), results: toJSON(results) });
  });
}
