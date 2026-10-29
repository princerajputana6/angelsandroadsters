import mongoose from 'mongoose';

/**
 * A race category (e.g. "Pro Men", "Novice", "Up to 250cc"). Belongs to a
 * Race. Optional number range supports offline pre-allocation of
 * non-overlapping ranges per device/category (plan §5.2).
 */
const raceCategorySchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    race: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, default: '' },

    // Eligibility criteria (informational — enforcement is at entry time).
    criteria: {
      gender: { type: String, enum: ['any', 'male', 'female', 'other'], default: 'any' },
      ageMin: { type: Number, default: 0 },
      ageMax: { type: Number, default: 0 }, // 0 = no cap
      engineCcMax: { type: Number, default: 0 }, // 0 = no cap
      experience: { type: String, default: '' },
    },

    // Pre-allocated number range for offline/pre-assigned registration.
    numberRangeStart: { type: Number, default: 0 },
    numberRangeEnd: { type: Number, default: 0 },

    sortOrder: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

raceCategorySchema.index({ race: 1, name: 1 });

export default mongoose.models.RaceCategory || mongoose.model('RaceCategory', raceCategorySchema);
