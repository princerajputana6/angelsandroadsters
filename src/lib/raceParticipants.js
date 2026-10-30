/**
 * One-time (idempotent) backfill: give every pool rider created before the
 * permanent participant number existed its own number. Oldest rider first, so
 * the earliest joiner gets the lowest id. Safe to re-run — it only touches
 * riders that still lack a number, and draws from the SAME atomic Counter the
 * live creation path uses, so a rider created between deploy and backfill can
 * never collide with a backfilled one.
 *
 * Writes through the raw driver (Rider.collection) on purpose: participantNo is
 * schema-immutable, which would block a Mongoose save/update from setting it on
 * an existing document.
 */
import { connectDB } from './db';
import Rider from './models/Rider';
import { nextSequence } from './models/Counter';

export async function backfillParticipantNumbers() {
  await connectDB();
  const pending = await Rider.find({ participantNo: null })
    .sort({ createdAt: 1, _id: 1 })
    .select('_id')
    .lean();

  let assigned = 0;
  for (const r of pending) {
    const seq = await nextSequence('riderParticipantNo');
    // Guard on participantNo:null so a concurrent run can't double-assign.
    const res = await Rider.collection.updateOne(
      { _id: r._id, participantNo: { $in: [null, undefined] } },
      { $set: { participantNo: seq } }
    );
    if (res.modifiedCount) assigned += 1;
  }

  return { assigned, pending: pending.length };
}
