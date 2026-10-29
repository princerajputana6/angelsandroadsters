import mongoose from 'mongoose';

/**
 * Binds an official + device + checkpoint type to an event/race for a bounded
 * window (plan §3.1). Short-lived by design so an offline assignment cannot be
 * abused indefinitely. Sync is authorized against an *open*, non-expired
 * session when the server is reachable.
 */
const checkpointSessionSchema = new mongoose.Schema(
  {
    // Stable UUID so an offline device can reference its session before the
    // server round-trip completes.
    sessionId: { type: String, required: true, unique: true, index: true },

    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    race: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true, index: true },
    // Bound when the official's device claims the session during preflight
    // (the deviceId is generated client-side), so optional until then.
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'RaceDevice', index: true },
    deviceId: { type: String, index: true }, // denormalized stable client id once claimed
    official: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    checkpointType: { type: String, enum: ['start', 'lap', 'finish'], required: true },
    checkpointId: { type: String, required: true, trim: true }, // which physical checkpoint

    status: { type: String, enum: ['open', 'closed', 'revoked'], default: 'open', index: true },

    // The config version this session was preflighted against.
    configVersion: { type: Number, default: 1 },

    // Highest device sequence the server has durably accepted for this device,
    // used to detect gaps/duplicates on ingest (plan §9.1).
    lastAcceptedDeviceSequence: { type: Number, default: 0 },

    expiresAt: { type: Date, required: true, index: true },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.CheckpointSession ||
  mongoose.model('CheckpointSession', checkpointSessionSchema);
