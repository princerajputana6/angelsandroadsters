import { randomUUID } from 'crypto';
import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import User from '@/lib/models/User';
import RaceDevice from '@/lib/models/RaceDevice'; // registers ref for populate
import CheckpointSession from '@/lib/models/CheckpointSession';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';

// GET /api/race/sessions?race=<id> — manager view of all sessions for a race.
export async function GET(req) {
  return handler(async () => {
    await requireRaceManager();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const race = searchParams.get('race');
    if (!race) throw Object.assign(new Error('race query param required'), { status: 400 });
    const sessions = await CheckpointSession.find({ race })
      .populate('official', 'name email')
      .populate('device', 'label deviceId lastSeenAt lastSyncAt')
      .sort({ createdAt: -1 })
      .lean();
    return ok({ sessions: toJSON(sessions) });
  });
}

// POST /api/race/sessions — manager assigns an official to a checkpoint.
// body: { race, checkpointType, checkpointId, officialId, expiresInHours }
export async function POST(req) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const { race: raceId, checkpointType, checkpointId, officialId, expiresInHours = 12 } = await req.json();

    if (!raceId || !checkpointType || !checkpointId || !officialId) {
      throw Object.assign(new Error('race, checkpointType, checkpointId and officialId are required'), { status: 400 });
    }
    if (!['start', 'lap', 'finish'].includes(checkpointType)) {
      throw Object.assign(new Error('Invalid checkpointType'), { status: 400 });
    }

    const race = await Race.findById(raceId).lean();
    if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });
    const official = await User.findById(officialId).lean();
    if (!official) throw Object.assign(new Error('Official (user) not found'), { status: 404 });

    const hours = Math.min(Math.max(Number(expiresInHours) || 12, 1), 72);
    const session = await CheckpointSession.create({
      sessionId: randomUUID(),
      event: race.event,
      race: race._id,
      official: official._id,
      checkpointType,
      checkpointId: String(checkpointId),
      status: 'open',
      configVersion: race.configVersion,
      expiresAt: new Date(Date.now() + hours * 3600 * 1000),
      createdBy: user._id,
    });

    await logRaceAudit({
      actor: user, action: 'SESSION_CREATED', event: race.event, race: race._id,
      targetType: 'CheckpointSession', targetId: session.sessionId,
      meta: { checkpointType, checkpointId, official: official.email },
    });
    return ok({ session: toJSON(session) }, 201);
  });
}
