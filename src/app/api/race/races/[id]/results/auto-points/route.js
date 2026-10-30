import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import RaceResult from '@/lib/models/RaceResult';
import { ok, handler } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { getPreset } from '@/lib/raceScoring';

/**
 * POST /api/race/races/:id/results/auto-points — assign points to FINISHED
 * riders by finishing position (ranked by their effective time: a manual time
 * override wins, else the computed total). body (optional):
 *   { preset: 'fury' | 'shadow', table: number[], participation: number }
 * A `preset` picks a named championship table; an explicit `table` /
 * `participation` overrides it. Defaults to the Fury Circuit table. Writes
 * manualPoints, which recompute never overwrites, and the Results view then
 * ranks by points. Manually disqualified riders are skipped.
 */
export async function POST(req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();

    const race = await Race.findById(params.id).select('_id event').lean();
    if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

    const body = await req.json().catch(() => ({}));
    const preset = getPreset(body?.preset);
    const table = Array.isArray(body?.table) && body.table.length ? body.table.map(Number) : preset.table;
    const participation = Number.isFinite(Number(body?.participation)) ? Number(body.participation) : preset.participation;

    // Finished riders, but never a manually disqualified one.
    const results = await RaceResult.find({
      race: race._id,
      status: 'finished',
      manualStatus: { $ne: 'disqualified' },
    })
      .select('_id adjustedTimeMs totalTimeMs')
      .lean();

    results.sort((a, b) => {
      const ta = a.adjustedTimeMs != null ? a.adjustedTimeMs : (a.totalTimeMs ?? Infinity);
      const tb = b.adjustedTimeMs != null ? b.adjustedTimeMs : (b.totalTimeMs ?? Infinity);
      return ta - tb;
    });

    const now = new Date();
    const ops = results.map((r, i) => {
      const points = i < table.length ? table[i] : participation;
      return { updateOne: { filter: { _id: r._id }, update: { $set: { manualPoints: points, adjustedBy: user._id, adjustedAt: now } } } };
    });
    if (ops.length) await RaceResult.collection.bulkWrite(ops, { ordered: false });

    await logRaceAudit({
      actor: user, action: 'RESULTS_AUTO_POINTS', event: race.event, race: race._id,
      targetType: 'Race', targetId: race._id, meta: { assigned: ops.length, preset: preset.key },
    });

    return ok({ assigned: ops.length });
  });
}
