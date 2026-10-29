import { connectDB } from '@/lib/db';
import CheckpointSession from '@/lib/models/CheckpointSession';
import Race from '@/lib/models/Race'; // registers ref for populate
import Event from '@/lib/models/Event';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireUser } from '@/lib/auth';

// GET /api/race/sessions/mine — open, non-expired sessions assigned to the
// signed-in official (plan §6.1). Used to pick a session during preflight.
export async function GET() {
  return handler(async () => {
    const user = await requireUser();
    await connectDB();
    const sessions = await CheckpointSession.find({
      official: user._id,
      status: 'open',
      expiresAt: { $gt: new Date() },
    })
      .populate('race', 'name status configVersion')
      .populate('event', 'title')
      .sort({ createdAt: -1 })
      .lean();
    return ok({ sessions: toJSON(sessions) });
  });
}
