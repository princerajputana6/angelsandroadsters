import { connectDB } from '@/lib/db';
import RaceConflict from '@/lib/models/RaceConflict';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { recomputeRaceResults } from '@/lib/raceProjection';

/**
 * Resolve or waive a conflict (plan §10.2, §4.4). A reason is required for the
 * audit trail. The underlying source events are never deleted — resolving only
 * closes the review item. Results are recomputed so the entry's
 * hasOpenConflicts flag updates.
 * body: { action: 'resolve' | 'waive', reason, resolutionEventId? }
 */
export async function POST(req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const { action, reason, resolutionEventId } = await req.json();
    if (!['resolve', 'waive'].includes(action)) {
      throw Object.assign(new Error('action must be resolve or waive'), { status: 400 });
    }
    if (!String(reason || '').trim()) {
      throw Object.assign(new Error('A reason is required'), { status: 400 });
    }

    const conflict = await RaceConflict.findById(params.id);
    if (!conflict) throw Object.assign(new Error('Conflict not found'), { status: 404 });

    conflict.status = action === 'waive' ? 'waived' : 'resolved';
    conflict.reason = reason;
    conflict.resolvedBy = user._id;
    conflict.resolvedAt = new Date();
    if (resolutionEventId) conflict.resolutionEventId = resolutionEventId;
    await conflict.save();

    await logRaceAudit({
      actor: user, action: `CONFLICT_${conflict.status.toUpperCase()}`, event: conflict.event, race: conflict.race,
      targetType: 'RaceConflict', targetId: conflict._id, reason, meta: { type: conflict.type },
    });

    // Reflect the change in projections (hasOpenConflicts).
    try { await recomputeRaceResults(conflict.race); } catch (e) { console.error('[conflict resolve] recompute failed', e.message); }

    return ok({ conflict: toJSON(conflict) });
  });
}
