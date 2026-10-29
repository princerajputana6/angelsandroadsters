import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { persistRaceSnapshot } from '@/lib/raceConfig';

/**
 * Race lifecycle transitions (plan §4.4). Allowed moves only; sensitive moves
 * require a reason. Locking persists the versioned offline config bundle.
 */
const ALLOWED = {
  draft: ['configured', 'archived'],
  configured: ['locked', 'draft', 'archived'],
  locked: ['active', 'configured', 'archived'], // back to configured = re-open config for edits
  active: ['paused', 'completed'],
  paused: ['active', 'completed'],
  completed: ['active', 'archived'], // active = reopen results (policy-gated)
  archived: [],
};

// Transitions that must carry a reason for the audit trail.
const REASON_REQUIRED = new Set(['locked', 'archived', 'completed', 'active']);

export async function POST(req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();

    const { status: next, reason } = await req.json();
    if (!next) throw Object.assign(new Error('Target status required'), { status: 400 });

    const race = await Race.findById(params.id);
    if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

    const from = race.status;
    if (from === next) return ok({ race: toJSON(race) }); // no-op

    if (!ALLOWED[from]?.includes(next)) {
      throw Object.assign(new Error(`Cannot move race from "${from}" to "${next}"`), { status: 409 });
    }
    if (REASON_REQUIRED.has(next) && !String(reason || '').trim()) {
      throw Object.assign(new Error(`A reason is required to mark the race "${next}"`), { status: 400 });
    }

    race.status = next;
    race.updatedBy = user._id;
    if (next === 'completed') race.resultsState = race.resultsState === 'final' ? 'final' : 'provisional';
    // Reopening a completed race for corrections drops results back to provisional.
    if (next === 'active' && from === 'completed') race.resultsState = 'provisional';
    await race.save();

    // Persist the immutable offline bundle for this config version on lock.
    let configuration = null;
    if (next === 'locked') {
      configuration = await persistRaceSnapshot(race._id, user._id);
    }

    await logRaceAudit({
      actor: user, action: `RACE_STATUS_${next.toUpperCase()}`, event: race.event, race: race._id,
      targetType: 'Race', targetId: race._id, reason,
      meta: { from, to: next, configVersion: race.configVersion },
    });

    return ok({ race: toJSON(race), configuration: configuration ? toJSON(configuration) : null });
  });
}
