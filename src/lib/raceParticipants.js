/**
 * Participant-pool maintenance: keep the global rider pool complete and give
 * every participant a permanent, non-duplicate number.
 *
 * Numbers are written through the raw driver (Rider.collection) on purpose:
 * participantNo is schema-immutable, which would block a Mongoose save/update
 * from setting or changing it on an existing document.
 */
import { connectDB } from './db';
import Rider from './models/Rider';
import RaceEntry from './models/RaceEntry';
import Counter, { nextSequence } from './models/Counter';

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Find (or create) the pool rider for a would-be entry, de-duped so the same
 * person is never stored twice: by linked user account when present, else by
 * case-insensitive exact name. Returns the pool rider's _id.
 */
export async function findOrCreatePoolRider({ riderName, rider, displayName, bike, photo }, userId) {
  if (rider) {
    const existing = await Rider.findOne({ user: rider }).select('_id').lean();
    if (existing) return existing._id;
  } else {
    const rx = new RegExp(`^${escapeRx(riderName)}$`, 'i');
    const existing = await Rider.findOne({ name: rx }).select('_id').lean();
    if (existing) return existing._id;
  }
  const created = await Rider.create({
    name: riderName,
    displayName: displayName || '',
    user: rider || undefined,
    bike: bike || {},
    photo: photo?.url ? photo : undefined,
    createdBy: userId,
  });
  return created._id;
}

/**
 * Pull every active race entry that predates the pool-mirror into the global
 * pool: create/link a de-duped pool rider so race-only participants also appear
 * in the pool and can receive a participant number. Idempotent.
 */
export async function linkRaceEntriesToPool(userId) {
  await connectDB();
  const orphans = await RaceEntry.find({ status: 'active', poolRider: { $in: [null, undefined] } })
    .select('_id riderName rider displayName bike photos')
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  let linked = 0;
  for (const e of orphans) {
    const poolRiderId = await findOrCreatePoolRider(
      { riderName: e.riderName, rider: e.rider, displayName: e.displayName, bike: e.bike, photo: e.photos?.rider },
      userId
    );
    const res = await RaceEntry.collection.updateOne(
      { _id: e._id, poolRider: { $in: [null, undefined] } },
      { $set: { poolRider: poolRiderId } }
    );
    if (res.modifiedCount) linked += 1;
  }
  return { linked, orphans: orphans.length };
}

/**
 * Gap-fill: assign a permanent number to any pool rider missing one, continuing
 * from the shared atomic Counter so a rider created between deploy and run can
 * never collide. Oldest rider first. Safe to re-run.
 */
export async function backfillParticipantNumbers() {
  await connectDB();
  const pending = await Rider.find({ participantNo: null })
    .sort({ createdAt: 1, _id: 1 })
    .select('_id')
    .lean();

  let assigned = 0;
  for (const r of pending) {
    const seq = await nextSequence('riderParticipantNo');
    const res = await Rider.collection.updateOne(
      { _id: r._id, participantNo: { $in: [null, undefined] } },
      { $set: { participantNo: seq } }
    );
    if (res.modifiedCount) assigned += 1;
  }
  return { assigned, pending: pending.length };
}

/**
 * One-time re-seed: give EVERY participant a fresh, contiguous, duplicate-free
 * number starting at `start` (e.g. 4 → 004, to match plates printed from 004).
 * First links any race-only participants into the pool so they're included.
 *
 * Done in two phases to stay safe under the unique index: clear all numbers,
 * then assign sequentially oldest-first. The Counter is set past the highest
 * number so new participants continue after it. Overwrites existing numbers by
 * design — this is the deliberate alignment to the printed codes.
 */
export async function reseedParticipantNumbers(start, userId) {
  await connectDB();
  const from = Number.isFinite(start) && start >= 0 ? Math.floor(start) : 4;

  // Make sure race-only participants are in the pool before numbering.
  const link = await linkRaceEntriesToPool(userId);

  const riders = await Rider.find({})
    .sort({ createdAt: 1, _id: 1 })
    .select('_id')
    .lean();

  // Phase 1 — clear every number so reassignment can't transiently collide.
  await Rider.collection.updateMany({}, { $unset: { participantNo: '' } });

  // Phase 2 — assign contiguous numbers from `start`.
  let n = from;
  for (const r of riders) {
    await Rider.collection.updateOne({ _id: r._id }, { $set: { participantNo: n } });
    n += 1;
  }

  // Keep the live counter ahead of the highest assigned number.
  const highest = riders.length ? from + riders.length - 1 : from - 1;
  await Counter.collection.updateOne(
    { _id: 'riderParticipantNo' },
    { $set: { seq: Math.max(highest, 0) } },
    { upsert: true }
  );

  return {
    count: riders.length,
    start: from,
    first: riders.length ? from : null,
    last: riders.length ? highest : null,
    linkedFromRaces: link.linked,
  };
}
