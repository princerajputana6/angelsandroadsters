/**
 * Participant-pool maintenance: keep the global rider pool complete and give
 * every participant a permanent, non-duplicate number.
 *
 * Everything here uses BULK driver operations (a handful of round-trips total)
 * rather than per-document awaits, so it finishes well inside the serverless
 * function limit even for a full field of riders. Numbers are written through
 * the raw driver because participantNo is schema-immutable, which would block a
 * Mongoose save/update from setting or changing it.
 */
import mongoose from 'mongoose';
import { connectDB } from './db';
import Rider from './models/Rider';
import RaceEntry from './models/RaceEntry';
import Counter from './models/Counter';

const norm = (s) => (s || '').trim().toLowerCase();

/**
 * Pull every active race entry that has no pool link into the global pool, so
 * race-only participants (entries created before the pool mirror) also appear
 * in the pool and can be numbered. De-duped by linked user account, else by
 * case-insensitive name — both against existing riders and within this batch —
 * so the same person is never stored twice. Idempotent; bulk-writes.
 */
export async function linkRaceEntriesToPool(userId) {
  await connectDB();
  const orphans = await RaceEntry.find({ status: 'active', poolRider: { $in: [null, undefined] } })
    .select('_id riderName rider displayName bike photos')
    .sort({ raceNumber: 1, createdAt: 1, _id: 1 })
    .lean();
  if (!orphans.length) return { linked: 0, orphans: 0, created: 0 };

  // Load existing riders once for in-memory de-dupe.
  const existing = await Rider.find({}).select('_id name user').lean();
  const byUser = new Map();
  const byName = new Map();
  for (const r of existing) {
    if (r.user) byUser.set(String(r.user), r._id);
    if (!byName.has(norm(r.name))) byName.set(norm(r.name), r._id);
  }

  const now = new Date();
  const riderInserts = [];
  const entryUpdates = [];
  for (const e of orphans) {
    let riderId = null;
    if (e.rider && byUser.has(String(e.rider))) {
      riderId = byUser.get(String(e.rider));
    } else if (!e.rider && byName.has(norm(e.riderName))) {
      riderId = byName.get(norm(e.riderName));
    } else {
      riderId = new mongoose.Types.ObjectId();
      riderInserts.push({
        insertOne: {
          document: {
            _id: riderId,
            name: e.riderName,
            displayName: e.displayName || '',
            ...(e.rider ? { user: e.rider } : {}),
            bike: e.bike || {},
            photo: e.photos?.rider?.url ? e.photos.rider : {},
            active: true,
            createdBy: userId,
            createdAt: now,
            updatedAt: now,
          },
        },
      });
      // Register so later orphans in this batch de-dupe against it.
      byName.set(norm(e.riderName), riderId);
      if (e.rider) byUser.set(String(e.rider), riderId);
    }
    entryUpdates.push({ updateOne: { filter: { _id: e._id }, update: { $set: { poolRider: riderId } } } });
  }

  if (riderInserts.length) await Rider.collection.bulkWrite(riderInserts, { ordered: false });
  if (entryUpdates.length) await RaceEntry.collection.bulkWrite(entryUpdates, { ordered: false });

  return { linked: entryUpdates.length, orphans: orphans.length, created: riderInserts.length };
}

/**
 * Gap-fill: give a permanent number to any pool rider that has none, numbering
 * from the current highest so existing numbers are never disturbed. Bulk-writes.
 */
export async function backfillParticipantNumbers() {
  await connectDB();
  const pending = await Rider.find({ participantNo: null })
    .sort({ createdAt: 1, _id: 1 })
    .select('_id')
    .lean();
  if (!pending.length) return { assigned: 0, pending: 0 };

  const top = await Rider.findOne({ participantNo: { $ne: null } }).sort({ participantNo: -1 }).select('participantNo').lean();
  let next = (top?.participantNo || 0) + 1;

  const ops = pending.map((r) => ({ updateOne: { filter: { _id: r._id }, update: { $set: { participantNo: next++ } } } }));
  await Rider.collection.bulkWrite(ops, { ordered: false });
  await Counter.collection.updateOne({ _id: 'riderParticipantNo' }, { $set: { seq: next - 1 } }, { upsert: true });

  return { assigned: pending.length, pending: pending.length };
}

/**
 * One-time re-seed: give EVERY participant a fresh, contiguous, duplicate-free
 * number starting at `start` (e.g. 4 → 004), in RACE-NUMBER ORDER — the order
 * shown in Riders & Entries. The lowest race number gets `start`, the next
 * start+1, and so on, so a rider added later (higher race number) always gets a
 * later id and none are left blank. Pool-only riders in no race are numbered
 * last, oldest first. Overwrites existing numbers by design. Bulk-writes.
 */
export async function reseedParticipantNumbers(start, userId) {
  await connectDB();
  const from = Number.isFinite(start) && start >= 0 ? Math.floor(start) : 4;

  // Make sure every race participant is in the pool before numbering.
  const link = await linkRaceEntriesToPool(userId);

  // Order each rider by the lowest race number they hold (racers first), then
  // pool-only riders by when they were added.
  const agg = await RaceEntry.aggregate([
    { $match: { poolRider: { $ne: null }, status: 'active' } },
    { $group: { _id: '$poolRider', minNum: { $min: '$raceNumber' } } },
  ]);
  const raceOrder = new Map(agg.map((a) => [String(a._id), a.minNum]));

  const all = await Rider.find({}).select('_id createdAt').lean();
  const orderKey = (r) => {
    const rn = raceOrder.get(String(r._id));
    return rn != null ? rn : Infinity;
  };
  const riders = all.sort((a, b) => {
    const ka = orderKey(a);
    const kb = orderKey(b);
    if (ka !== kb) return ka - kb;
    const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ca - cb || String(a._id).localeCompare(String(b._id));
  });

  // Clear all numbers, then assign contiguous ones — two bulk ops.
  await Rider.collection.updateMany({}, { $unset: { participantNo: '' } });
  const ops = riders.map((r, i) => ({ updateOne: { filter: { _id: r._id }, update: { $set: { participantNo: from + i } } } }));
  if (ops.length) await Rider.collection.bulkWrite(ops, { ordered: false });

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
