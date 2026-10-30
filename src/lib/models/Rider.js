import mongoose from 'mongoose';

/**
 * A reusable rider in the global rider pool — NOT tied to any event or race.
 * Admins build this master list once, then onboard riders into any race by
 * multi-selecting from it (each selection creates a RaceEntry linked back here
 * via RaceEntry.poolRider). Optionally linked to a User account.
 */
const assetRefSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    assetId: { type: String, default: '' },
    contentHash: { type: String, default: '' },
    status: { type: String, enum: ['none', 'pending', 'uploaded', 'verified'], default: 'none' },
  },
  { _id: false }
);

const riderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    displayName: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional account link

    bike: {
      make: { type: String, default: '' },
      model: { type: String, default: '' },
      cc: { type: String, default: '' },
      description: { type: String, default: '' },
    },
    photo: { type: assetRefSchema, default: () => ({}) },

    notes: { type: String, default: '' },
    active: { type: Boolean, default: true, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

riderSchema.index({ name: 1 });

export default mongoose.models.Rider || mongoose.model('Rider', riderSchema);
