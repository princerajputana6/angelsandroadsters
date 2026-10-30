import { connectDB } from '@/lib/db';
import Rider from '@/lib/models/Rider';
import User from '@/lib/models/User'; // registers ref for populate
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { parseOrThrow, riderCreateSchema } from '@/lib/raceValidation';

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/race/riders?q=&active=1 — the global rider pool (optionally searched).
export async function GET(req) {
  return handler(async () => {
    await requireRaceManager();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const filter = {};
    if (searchParams.get('active') !== 'all') filter.active = true;
    if (q) {
      const rx = new RegExp(escapeRx(q), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { displayName: rx }];
    }
    const riders = await Rider.find(filter).sort({ name: 1 }).limit(1000).lean();
    return ok({ riders: toJSON(riders) });
  });
}

// POST /api/race/riders — add a rider to the pool.
export async function POST(req) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const body = parseOrThrow(riderCreateSchema, await req.json());
    const rider = await Rider.create({ ...body, createdBy: user._id });
    await logRaceAudit({ actor: user, action: 'RIDER_POOL_CREATED', targetType: 'Rider', targetId: rider._id });
    return ok({ rider: toJSON(rider) }, 201);
  });
}
