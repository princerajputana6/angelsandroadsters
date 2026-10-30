import { connectDB } from '@/lib/db';
import RaceEntry from '@/lib/models/RaceEntry';
import Rider from '@/lib/models/Rider';
import { ok, handler } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { ensurePoolRiderForEntry } from '@/lib/raceParticipants';

/**
 * PUT /api/race/entries/:id/participant-no — set (or clear) a participant's
 * permanent ID by hand. body: { participantNo: <number> | null | '' }.
 *
 * The number lives on the pool rider; if the entry has no pool link yet we
 * create/link one first (de-duped). Rejects an ID already used by someone else.
 * Writes through the raw driver because participantNo is schema-immutable.
 */
export async function PUT(req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();

    const body = await req.json().catch(() => ({}));
    let participantNo = body?.participantNo;
    if (participantNo === '' || participantNo == null) {
      participantNo = null;
    } else {
      participantNo = Number(participantNo);
      if (!Number.isInteger(participantNo) || participantNo < 0) {
        throw Object.assign(new Error('Participant ID must be a whole number ≥ 0'), { status: 400 });
      }
    }

    const entry = await RaceEntry.findById(params.id).lean();
    if (!entry) throw Object.assign(new Error('Entry not found'), { status: 404 });

    let poolRiderId = entry.poolRider;
    if (!poolRiderId) {
      poolRiderId = await ensurePoolRiderForEntry(entry, user._id);
      await RaceEntry.collection.updateOne({ _id: entry._id }, { $set: { poolRider: poolRiderId } });
    }

    if (participantNo != null) {
      const clash = await Rider.findOne({ participantNo, _id: { $ne: poolRiderId } }).select('name').lean();
      if (clash) {
        throw Object.assign(
          new Error(`ID ${String(participantNo).padStart(3, '0')} is already used by ${clash.name}.`),
          { status: 409 }
        );
      }
    }

    await Rider.collection.updateOne(
      { _id: poolRiderId },
      participantNo == null ? { $unset: { participantNo: '' } } : { $set: { participantNo } }
    );

    await logRaceAudit({
      actor: user, action: 'RIDER_PARTICIPANT_NO_SET', event: entry.event, race: entry.race,
      targetType: 'Rider', targetId: poolRiderId, meta: { participantNo },
    });

    return ok({ participantNo });
  });
}
