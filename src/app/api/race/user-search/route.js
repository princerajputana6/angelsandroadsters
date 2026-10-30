import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager } from '@/lib/raceAuth';

// Escape user input before building a regex (avoid regex injection / ReDoS).
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/race/user-search?q=... — lightweight search over existing users for
 * the rider picker when creating an entry. Race-manager only; returns minimal
 * fields (no addresses/wishlist). Empty for queries under 2 chars.
 */
export async function GET(req) {
  return handler(async () => {
    await requireRaceManager();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (q.length < 2) return ok({ users: [] });

    await connectDB();
    const rx = new RegExp(escapeRx(q), 'i');
    const users = await User.find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] })
      .select('name email phone')
      .limit(15)
      .lean();
    return ok({ users: toJSON(users) });
  });
}
