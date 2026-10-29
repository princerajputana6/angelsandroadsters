import mongoose from 'mongoose';

/**
 * Durable per-batch sync receipt (plan §9, §12). Lets the admin reconcile what
 * each device sent with what the server durably accepted, and makes retried
 * batches idempotent at the batch level too. The `batchId` unique index is the
 * batch-level idempotency key.
 */
const perEventResultSchema = new mongoose.Schema(
  {
    clientEventId: String,
    serverEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'RaceEvent' },
    status: { type: String, enum: ['accepted', 'alreadyAccepted', 'needsReview', 'rejected'] },
    reason: String,
  },
  { _id: false }
);

const syncReceiptSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, unique: true, index: true },

    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', index: true },
    race: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', index: true },
    deviceId: { type: String, index: true },
    checkpointSessionId: { type: String, index: true },

    schemaVersion: { type: Number, default: 1 },
    eventCount: { type: Number, default: 0 },

    acceptedCount: { type: Number, default: 0 },
    alreadyAcceptedCount: { type: Number, default: 0 },
    needsReviewCount: { type: Number, default: 0 },
    rejectedCount: { type: Number, default: 0 },

    results: [perEventResultSchema],
    nextExpectedDeviceSequence: { type: Number },

    receivedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.SyncReceipt || mongoose.model('SyncReceipt', syncReceiptSchema);
