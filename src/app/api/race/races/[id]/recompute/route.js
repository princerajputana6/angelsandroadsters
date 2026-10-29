import { ok, handler } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { detectConflicts } from '@/lib/raceConflictDetect';
import { recomputeRaceResults } from '@/lib/raceProjection';

// POST /api/race/races/:id/recompute — re-run conflict detection + result
// projection on demand (plan §9.1.11). Idempotent and safe to call anytime.
export async function POST(_req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    const conflicts = await detectConflicts(params.id);
    const projection = await recomputeRaceResults(params.id);
    await logRaceAudit({
      actor: user, action: 'RACE_RECOMPUTED', race: params.id,
      targetType: 'Race', targetId: params.id, meta: { conflicts, projection },
    });
    return ok({ conflicts, projection });
  });
}
