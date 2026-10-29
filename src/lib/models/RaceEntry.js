import mongoose from 'mongoose';

/**
 * A rider's entry into a race/category with a unique race number.
 * Links to the existing User and Registration models where available so we
 * do not duplicate rider identity/medical data (plan §1.1.12, §5.1).
 *
 * Uniqueness of `raceNumber` is enforced by a partial compound unique index
 * declared below AND verified in the deployed environment via the
 * ensure-indexes script (plan §5.2, §8.3) — never relied on from the schema
 * declaration alone.
 */
const assetRefSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    assetId: { type: String, default: '' }, // stable id for retries/dedupe
    contentHash: { type: String, default: '' },
    status: { type: String, enum: ['none', 'pending', 'uploaded', 'verified'], default: 'none' },
  },
  { _id: false }
);

const raceEntrySchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    race: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'RaceCategory', index: true },

    // Optional links to existing identity records.
    rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    registration: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration' },

    riderName: { type: String, required: true, trim: true },
    displayName: { type: String, trim: true, default: '' }, // permitted public name for plate

    // Numeric race number within the configured uniqueness scope.
    raceNumber: { type: Number, required: true, min: 0 },

    bike: {
      make: { type: String, default: '' },
      model: { type: String, default: '' },
      cc: { type: String, default: '' },
      description: { type: String, default: '' },
    },

    photos: {
      rider: { type: assetRefSchema, default: () => ({}) },
      bike: { type: assetRefSchema, default: () => ({}) },
      plate: { type: assetRefSchema, default: () => ({}) },
    },

    checkInStatus: { type: String, enum: ['registered', 'checked-in', 'no-show'], default: 'registered' },
    consentStatus: { type: String, enum: ['n/a', 'pending', 'given'], default: 'n/a' },
    platePrinted: { type: Boolean, default: false },

    // Entries with recorded race events must never be hard-deleted (plan §4.4).
    status: { type: String, enum: ['active', 'withdrawn', 'void'], default: 'active', index: true },

    // Audit trail for authorized number reassignments (plan §5.2).
    numberHistory: [
      {
        from: Number,
        to: Number,
        reason: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
      },
    ],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Query index
raceEntrySchema.index({ event: 1, race: 1 });

/**
 * Uniqueness of the race number, scoped per-race by default. The index is
 * partial so only active entries are constrained — withdrawn/void entries
 * free their number. This also serves {race, raceNumber} lookups for active
 * entries. Verified in the deployed environment by the ensure-indexes script;
 * never relied on from the schema declaration alone (plan §8.3).
 */
raceEntrySchema.index(
  { race: 1, raceNumber: 1 },
  { unique: true, partialFilterExpression: { status: 'active' }, name: 'uniq_active_race_number' }
);

export default mongoose.models.RaceEntry || mongoose.model('RaceEntry', raceEntrySchema);
