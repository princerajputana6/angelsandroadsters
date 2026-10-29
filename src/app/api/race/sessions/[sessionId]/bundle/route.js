import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireUser } from '@/lib/auth';
import { loadSession, assertSessionAccess } from '@/lib/raceSession';
import { getCurrentBundle } from '@/lib/raceConfig';

// GET /api/race/sessions/:sessionId/bundle — re-download the offline bundle for
// an already-claimed session (plan §6.1). Assigned official or a manager.
export async function GET(_req, { params }) {
  return handler(async () => {
    const user = await requireUser();
    await connectDB();
    const session = await loadSession(params.sessionId);
    assertSessionAccess(user, session, { allowManager: true, requireActive: true });

    const race = await Race.findById(session.race).lean();
    if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

    const { bundle, stale } = await getCurrentBundle(race);
    if (!bundle) throw Object.assign(new Error('No offline configuration bundle found.'), { status: 409 });

    return ok({
      session: toJSON(session),
      bundle: { version: bundle.version, snapshot: bundle.snapshot, checksum: bundle.checksum, stale },
    });
  });
}
