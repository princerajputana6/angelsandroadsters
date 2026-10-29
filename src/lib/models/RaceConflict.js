import mongoose from 'mongoose';

/**
 * A detected conflict or validation failure that needs human review (plan §9.2,
 * §10.2). Conflicts NEVER cause a source record to be discarded — the original
 * events are preserved and referenced here.
 */
export const CONFLICT_TYPES = [
  'INTEGRITY_MISMATCH', // same clientEventId, different payload
  'DUPLICATE_LAP',
  'IMPOSSIBLE_SEQUENCE',
  'FINISH_BEFORE_START',
  'DNF_FINISH_CONFLICT',
  'DOUBLE_START',
  'CLOCK_UNCERTAINTY',
  'SUSPICIOUS_INTERVAL',
  'SEQUENCE_GAP',
  'VALIDATION_FAILED',
  'OTHER',
];

const raceConflictSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    race: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true, index: true },
    entry: { type: mongoose.Schema.Types.ObjectId, ref: 'RaceEntry' },

    type: { type: String, enum: CONFLICT_TYPES, required: true, index: true },
    status: { type: String, enum: ['open', 'resolved', 'waived'], default: 'open', index: true },

    // Source events involved — preserved, never deleted.
    relatedEventIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RaceEvent' }],
    relatedClientEventIds: [{ type: String }],

    detail: { type: String, default: '' },
    reason: { type: String, default: '' }, // resolution/waiver reason

    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    resolutionEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'RaceEvent' }, // the correction/void that resolved it
  },
  { timestamps: true }
);

raceConflictSchema.index({ race: 1, status: 1 });

export default mongoose.models.RaceConflict || mongoose.model('RaceConflict', raceConflictSchema);
