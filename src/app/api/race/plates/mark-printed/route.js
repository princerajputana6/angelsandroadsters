import { connectDB } from '@/lib/db';
import RaceEntry from '@/lib/models/RaceEntry';
import { ok, handler } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';

/**
 * Mark plates as printed. This is an ADMINISTRATIVE marker only — it does not
 * imply a plate was physically attached or verified (plan §5.4).
 * POST body: { entryIds: string[] }
 */
export async function POST(req) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const { entryIds } = await req.json();
    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      throw Object.assign(new Error('entryIds array required'), { status: 400 });
    }
    const result = await RaceEntry.updateMany(
      { _id: { $in: entryIds } },
      { $set: { platePrinted: true } }
    );
    await logRaceAudit({
      actor: user, action: 'PLATES_MARKED_PRINTED', targetType: 'RaceEntry',
      meta: { count: result.modifiedCount },
    });
    return ok({ updated: result.modifiedCount });
  });
}
