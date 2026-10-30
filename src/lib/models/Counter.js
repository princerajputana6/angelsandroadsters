import mongoose from 'mongoose';

/**
 * Atomic named sequence counters. Each document is one named counter whose
 * `seq` is bumped with a single findOneAndUpdate($inc) so concurrent requests
 * can never receive the same value — the guarantee behind permanent,
 * never-reused IDs like the rider pool's participant number.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String }, // counter name, e.g. 'riderParticipantNo'
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

/**
 * Return the next value for a named counter, atomically. Creates the counter
 * on first use. The returned number is yours alone — never handed out twice.
 */
export async function nextSequence(name) {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc.seq;
}

export default Counter;
