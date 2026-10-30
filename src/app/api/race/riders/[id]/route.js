import { connectDB } from '@/lib/db';
import Rider from '@/lib/models/Rider';
import RaceEntry from '@/lib/models/RaceEntry';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { parseOrThrow, riderUpdateSchema } from '@/lib/raceValidation';

// PUT /api/race/riders/:id
export async function PUT(req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const rider = await Rider.findById(params.id);
    if (!rider) throw Object.assign(new Error('Rider not found'), { status: 404 });
    const body = parseOrThrow(riderUpdateSchema, await req.json());
    Object.assign(rider, body);
    rider.updatedBy = user._id;
    await rider.save();
    await logRaceAudit({ actor: user, action: 'RIDER_POOL_UPDATED', targetType: 'Rider', targetId: rider._id });
    return ok({ rider: toJSON(rider) });
  });
}

// DELETE /api/race/riders/:id — only if the rider isn't used by any entry;
// otherwise deactivate (keep the link intact for history).
export async function DELETE(_req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const rider = await Rider.findById(params.id);
    if (!rider) throw Object.assign(new Error('Rider not found'), { status: 404 });

    const used = await RaceEntry.countDocuments({ poolRider: rider._id });
    if (used > 0) {
      rider.active = false;
      await rider.save();
      await logRaceAudit({ actor: user, action: 'RIDER_POOL_DEACTIVATED', targetType: 'Rider', targetId: rider._id, meta: { usedInEntries: used } });
      return ok({ deactivated: true, usedInEntries: used });
    }
    await Rider.deleteOne({ _id: rider._id });
    await logRaceAudit({ actor: user, action: 'RIDER_POOL_DELETED', targetType: 'Rider', targetId: rider._id });
    return ok({ deleted: true });
  });
}
