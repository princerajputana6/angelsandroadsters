import mongoose from 'mongoose';

/**
 * An immutable, versioned snapshot of a race's rules + roster — the "offline
 * bundle" a device downloads during preflight (plan §4.3.12, §6.1). Later
 * config changes create a NEW version; the bundle is never silently replaced.
 * The checksum lets a device verify it stored the bundle intact.
 */
const raceConfigurationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    race: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true, index: true },

    version: { type: Number, required: true, min: 1 },

    // Full snapshot the device caches: rules, categories, roster (numbers,
    // names, display names, photo urls), allowed actions, timezone, etc.
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },

    // SHA-256 of the canonical serialized snapshot, for integrity verification.
    checksum: { type: String, required: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

raceConfigurationSchema.index({ race: 1, version: 1 }, { unique: true, name: 'uniq_race_config_version' });

export default mongoose.models.RaceConfiguration ||
  mongoose.model('RaceConfiguration', raceConfigurationSchema);
