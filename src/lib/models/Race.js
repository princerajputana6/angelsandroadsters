import mongoose from 'mongoose';
import slugify from 'slugify';

/**
 * A Race is a competitive configuration that lives under an existing Event.
 * It owns the timing rules, checkpoint policy and lifecycle status. Timing
 * events (starts/laps/finishes) are stored separately in `RaceEvent`
 * (append-only) — never embedded here — per plan §8.3.
 */
const raceSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, index: true },

    // --- Timing model (plan §10.1). Chosen defaults documented in plan §10.2.
    startModel: { type: String, enum: ['individual', 'common'], default: 'individual' },
    finishType: { type: String, enum: ['laps', 'time'], default: 'laps' },
    expectedLaps: { type: Number, default: 1, min: 0 },
    durationMinutes: { type: Number, default: 0, min: 0 }, // for time-based races

    // Lap validation policy
    allowedCheckpoints: [{ type: String, trim: true }],
    minLapDurationMs: { type: Number, default: 0, min: 0 },
    maxLapDurationMs: { type: Number, default: 0, min: 0 }, // 0 = no upper bound

    finishRule: { type: String, default: '' },
    penaltyRules: { type: String, default: '' },
    dnfRules: { type: String, default: '' },

    // Correction policy — who may correct and how many approvals are needed
    correctionAllowed: { type: Boolean, default: true },
    correctionApprovals: { type: Number, default: 1, min: 1, max: 2 },

    // Number uniqueness scope (plan §5.2). Default: unique per race.
    numberUniquenessScope: { type: String, enum: ['race', 'category', 'event'], default: 'race' },

    // Lifecycle. Config/roster is only trusted for offline once `locked`.
    status: {
      type: String,
      enum: ['draft', 'configured', 'locked', 'active', 'paused', 'completed', 'archived'],
      default: 'draft',
      index: true,
    },

    // Incremented every time the race config/roster changes after first lock.
    // The offline bundle (RaceConfiguration) is versioned against this.
    configVersion: { type: Number, default: 1, min: 1 },

    resultsState: { type: String, enum: ['none', 'provisional', 'final'], default: 'none' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

raceSchema.index({ event: 1, status: 1 });

raceSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }
  next();
});

export default mongoose.models.Race || mongoose.model('Race', raceSchema);
