import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import RaceEntry from '@/lib/models/RaceEntry';
import RaceResult from '@/lib/models/RaceResult';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';

const STATUS_VALUES = ['dns', 'running', 'finished', 'dnf', 'disqualified'];

/**
 * PUT /api/race/races/:id/results/adjust — official manual adjustment to a
 * rider's result after a race. body:
 *   { entry, points?, timeMs?, timeDeltaMs?, clearTime?, status?, clearStatus?, note? }
 *   - points     : set the manual points tally (assign / deduct). Optional.
 *   - timeMs     : override the total time (ms) to an absolute value. Optional.
 *   - timeDeltaMs: add a penalty/bonus (ms, may be negative) to the rider's
 *                  current effective time; result stored as the override. This
 *                  is the usual "+30s / −5s" path. Clamped at 0.
 *   - clearTime  : true → drop the time override, fall back to the computed time.
 *   - status     : override the computed status (e.g. 'disqualified'). Optional.
 *   - clearStatus: true → drop the status override, fall back to the computed one.
 *   - note       : reason, kept on the result and in the audit log.
 *
 * Stored on RaceResult in fields recompute never overwrites, so adjustments
 * survive a ↻ Recompute.
 */
export async function PUT(req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();

    const race = await Race.findById(params.id).select('_id event').lean();
    if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

    const body = await req.json().catch(() => ({}));
    const { entry, points, timeMs, timeDeltaMs, clearTime, status, clearStatus, note } = body || {};
    if (!entry) throw Object.assign(new Error('entry is required'), { status: 400 });

    const entryDoc = await RaceEntry.findOne({ _id: entry, race: race._id }).select('_id').lean();
    if (!entryDoc) throw Object.assign(new Error('Entry not in this race'), { status: 404 });

    // Current row — needed to apply a time delta on top of the live time.
    const current = await RaceResult.findOne({ race: race._id, entry: entryDoc._id })
      .select('adjustedTimeMs totalTimeMs').lean();

    const set = { event: race.event, adjustedBy: user._id, adjustedAt: new Date() };

    if (points !== undefined) {
      const p = Number(points);
      if (!Number.isFinite(p)) throw Object.assign(new Error('points must be a number'), { status: 400 });
      set.manualPoints = p;
    }

    // Time: a delta (penalty/bonus) wins if given, else an absolute override.
    if (clearTime) {
      set.adjustedTimeMs = null;
    } else if (timeDeltaMs !== undefined && timeDeltaMs !== null && timeDeltaMs !== '') {
      const d = Number(timeDeltaMs);
      if (!Number.isFinite(d)) throw Object.assign(new Error('timeDeltaMs must be a number'), { status: 400 });
      const base = current?.adjustedTimeMs != null ? current.adjustedTimeMs : current?.totalTimeMs;
      if (base == null) throw Object.assign(new Error('No base time to adjust — set an exact time instead.'), { status: 400 });
      set.adjustedTimeMs = Math.max(0, Math.round(base + d));
    } else if (timeMs !== undefined && timeMs !== null && timeMs !== '') {
      const t = Number(timeMs);
      if (!Number.isFinite(t) || t < 0) throw Object.assign(new Error('timeMs must be a number ≥ 0'), { status: 400 });
      set.adjustedTimeMs = Math.round(t);
    }

    // Status override (e.g. disqualify).
    if (clearStatus) {
      set.manualStatus = null;
    } else if (status !== undefined && status !== null && status !== '') {
      if (!STATUS_VALUES.includes(status)) throw Object.assign(new Error('invalid status'), { status: 400 });
      set.manualStatus = status;
    }

    if (note !== undefined) set.adjustNote = String(note || '');

    const result = await RaceResult.findOneAndUpdate(
      { race: race._id, entry: entryDoc._id },
      { $set: set },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    await logRaceAudit({
      actor: user, action: 'RESULT_ADJUSTED', event: race.event, race: race._id,
      targetType: 'RaceEntry', targetId: entryDoc._id,
      reason: note || '',
      meta: { manualPoints: set.manualPoints, adjustedTimeMs: set.adjustedTimeMs, manualStatus: set.manualStatus, clearedTime: !!clearTime, clearedStatus: !!clearStatus },
    });

    return ok({ result: toJSON(result) });
  });
}
