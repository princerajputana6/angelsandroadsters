import mongoose from 'mongoose';

/**
 * Append-only audit trail for privileged actions (plan §4.4, §11): role
 * changes, roster locks, number reassignment, corrections, voids, result
 * finalization, reopenings. Records actor, timestamp, reason and affected ids.
 * Never log photo contents or secrets.
 */
const raceAuditLogSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', index: true },
    race: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', index: true },

    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorEmail: { type: String, default: '' }, // denormalized for durable history

    action: { type: String, required: true, index: true },
    targetType: { type: String, default: '' },
    targetId: { type: String, default: '' },

    reason: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },

    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export default mongoose.models.RaceAuditLog || mongoose.model('RaceAuditLog', raceAuditLogSchema);
