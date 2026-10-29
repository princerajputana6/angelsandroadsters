import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import RaceDevice from '@/lib/models/RaceDevice';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireUser } from '@/lib/auth';
import { logRaceAudit } from '@/lib/raceAuth';
import { loadSession, assertSessionAccess } from '@/lib/raceSession';
import { getCurrentBundle } from '@/lib/raceConfig';

/**
 * Claim a checkpoint session for THIS device during preflight (plan §6.1).
 * Binds the client-generated deviceId to the session, registers/updates the
 * device, and returns the checksum-verified offline bundle. Only the assigned
 * official may claim. The race must be locked (so an immutable bundle exists).
 * body: { deviceId, deviceLabel }
 */
export async function POST(req, { params }) {
  return handler(async () => {
    const user = await requireUser();
    await connectDB();
    const { deviceId, deviceLabel } = await req.json();
    if (!deviceId) throw Object.assign(new Error('deviceId required'), { status: 400 });

    const session = await loadSession(params.sessionId);
    const { isOfficial } = assertSessionAccess(user, session, { allowManager: false, requireActive: true });
    if (!isOfficial) throw Object.assign(new Error('Only the assigned official may claim this session'), { status: 403 });

    const race = await Race.findById(session.race).lean();
    if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });
    if (!['locked', 'active', 'paused'].includes(race.status)) {
      throw Object.assign(new Error('Race is not locked yet — no offline bundle to download.'), { status: 409 });
    }

    const { bundle, stale } = await getCurrentBundle(race);
    if (!bundle) throw Object.assign(new Error('No offline configuration bundle found. Lock the race to generate it.'), { status: 409 });

    // Register or update this device (keyed by the stable client deviceId).
    const device = await RaceDevice.findOneAndUpdate(
      { deviceId },
      {
        $set: { event: race.event, label: deviceLabel || `Device ${deviceId.slice(0, 8)}`, assignedOfficial: user._id, lastSeenAt: new Date() },
        $setOnInsert: { createdBy: user._id, active: true },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    session.device = device._id;
    session.deviceId = deviceId;
    session.configVersion = bundle.version;
    await session.save();

    await logRaceAudit({
      actor: user, action: 'SESSION_CLAIMED', event: race.event, race: race._id,
      targetType: 'CheckpointSession', targetId: session.sessionId, meta: { deviceId },
    });

    return ok({
      session: toJSON(session),
      bundle: { version: bundle.version, snapshot: bundle.snapshot, checksum: bundle.checksum, stale },
    });
  });
}
