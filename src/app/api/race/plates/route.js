import { ok, handler } from '@/lib/apiUtils';
import { requireRaceManager } from '@/lib/raceAuth';
import { buildPlates } from '@/lib/racePlate';

// GET /api/race/plates?race=<id>&entryIds=a,b,c
export async function GET(req) {
  return handler(async () => {
    await requireRaceManager();
    const { searchParams } = new URL(req.url);
    const race = searchParams.get('race');
    if (!race) throw Object.assign(new Error('race query param required'), { status: 400 });
    const entryIdsParam = searchParams.get('entryIds');
    const entryIds = entryIdsParam ? entryIdsParam.split(',').filter(Boolean) : null;
    const data = await buildPlates(race, entryIds);
    return ok(data);
  });
}
