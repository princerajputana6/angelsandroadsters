import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import RaceConflict from '@/lib/models/RaceConflict';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { recomputeRaceResults } from '@/lib/raceProjection';

/**
 * Finalize results (plan §4.4). Blocked while open conflicts remain unless the
 * caller explicitly waives them WITH a reason. Finalizing flips results from
 * provisional to final (recompute clears the provisional flag).
 * body: { reason, waiveOpenConflicts? }
 */
export async function POST(req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const { reason, waiveOpenConflicts } = await req.json();
    if (!String(reason || '').trim()) throw Object.assign(new Error('A reason is required to finalize'), { status: 400 });

    const race = await Race.findById(params.id);
    if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });
    if (!['active', 'paused', 'completed'].includes(race.status)) {
      throw Object.assign(new Error(`Cannot finalize results while race is "${race.status}"`), { status: 409 });
    }

    const openCount = await RaceConflict.countDocuments({ race: race._id, status: 'open' });
    if (openCount > 0 && !waiveOpenConflicts) {
      throw Object.assign(new Error(`${openCount} open conflict(s) must be resolved or explicitly waived first.`), { status: 409 });
    }

    race.resultsState = 'final';
    race.updatedBy = user._id;
    await race.save();
    await recomputeRaceResults(race._id); // sets provisional=false

    await logRaceAudit({
      actor: user, action: 'RESULTS_FINALIZED', event: race.event, race: race._id,
      targetType: 'Race', targetId: race._id, reason, meta: { waivedOpenConflicts: openCount && !!waiveOpenConflicts, openCount },
    });

    return ok({ race: toJSON(race), waivedOpenConflicts: openCount });
  });
}
