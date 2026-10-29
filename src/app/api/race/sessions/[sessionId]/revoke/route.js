import { connectDB } from '@/lib/db';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { loadSession } from '@/lib/raceSession';

/**
 * Revoke a checkpoint session (plan §3.1, §12 lost/damaged device support).
 * Once revoked, the server rejects further sync from that session when it is
 * reachable. An offline device cannot learn of the revocation until it
 * reconnects — this is a documented limitation, mitigated by short expiries.
 * body: { reason }
 */
export async function POST(req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const { reason } = await req.json();
    if (!String(reason || '').trim()) throw Object.assign(new Error('A reason is required to revoke'), { status: 400 });

    const session = await loadSession(params.sessionId);
    session.status = 'revoked';
    session.closedAt = new Date();
    await session.save();

    await logRaceAudit({
      actor: user, action: 'SESSION_REVOKED', event: session.event, race: session.race,
      targetType: 'CheckpointSession', targetId: session.sessionId, reason,
    });
    return ok({ session: toJSON(session) });
  });
}
