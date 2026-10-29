import { connectDB } from '@/lib/db';
import RaceConflict from '@/lib/models/RaceConflict';
import RaceEntry from '@/lib/models/RaceEntry'; // registers ref for populate
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager } from '@/lib/raceAuth';

// GET /api/race/conflicts?race=<id>&status=open
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
    const conflicts = await RaceConflict.find(filter)
      .populate('entry', 'raceNumber riderName')
      .populate('resolvedBy', 'name email')
      .sort({ status: 1, createdAt: -1 })
      .lean();
    return ok({ conflicts: toJSON(conflicts) });
  });
}
