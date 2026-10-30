import mongoose from 'mongoose';

/**
 * Derived result projection for an entry in a race (plan §9.1.11, §10.2).
 * Recomputed idempotently from the append-only RaceEvent history. Always
 * provisional until the race's validation checks pass and review is complete.
 */
const raceResultSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    race: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true, index: true },
    entry: { type: mongoose.Schema.Types.ObjectId, ref: 'RaceEntry', required: true, index: true },

    status: {
      type: String,
      enum: ['dns', 'running', 'finished', 'dnf', 'disqualified'],
      default: 'dns',
    },
    provisional: { type: Boolean, default: true },

    lapsCompleted: { type: Number, default: 0 },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    totalTimeMs: { type: Number },
    bestLapMs: { type: Number },
    rank: { type: Number },

    hasOpenConflicts: { type: Boolean, default: false },

    // Manual, official post-race adjustments. NOT touched by recompute (which
    // only $sets the derived fields), so they survive a re-run. `manualPoints`
    // is an assigned/deducted points tally; `adjustedTimeMs`, when set,
    // overrides the computed total time for display and ranking;
    // `manualStatus`, when set, overrides the computed status (e.g. a
    // disqualification) for display and ranking.
    manualPoints: { type: Number, default: 0 },
    adjustedTimeMs: { type: Number, default: null },
    manualStatus: {
      type: String,
      enum: ['dns', 'running', 'finished', 'dnf', 'disqualified', null],
      default: null,
    },
    adjustNote: { type: String, default: '' },
    adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adjustedAt: { type: Date },

    // Monotonically increasing projection version so stale recomputes can be
    // detected/ignored.
    projectionVersion: { type: Number, default: 0 },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

raceResultSchema.index({ race: 1, entry: 1 }, { unique: true, name: 'uniq_race_result_entry' });
raceResultSchema.index({ race: 1, rank: 1 });

export default mongoose.models.RaceResult || mongoose.model('RaceResult', raceResultSchema);
