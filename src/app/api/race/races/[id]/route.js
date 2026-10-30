import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import Event from '@/lib/models/Event';
import RaceEvent from '@/lib/models/RaceEvent';
import RaceCategory from '@/lib/models/RaceCategory';
import RaceEntry from '@/lib/models/RaceEntry';
import RaceResult from '@/lib/models/RaceResult';
import RaceConflict from '@/lib/models/RaceConflict';
import RaceConfiguration from '@/lib/models/RaceConfiguration';
import CheckpointSession from '@/lib/models/CheckpointSession';
import SyncReceipt from '@/lib/models/SyncReceipt';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { parseOrThrow, raceUpdateSchema } from '@/lib/raceValidation';
import { persistRaceSnapshot } from '@/lib/raceConfig';

// Config fields whose change after lock must bump the offline bundle version.
const CONFIG_FIELDS = [
  'startModel', 'finishType', 'expectedLaps', 'durationMinutes', 'allowedCheckpoints',
  'minLapDurationMs', 'maxLapDurationMs', 'finishRule', 'penaltyRules', 'dnfRules',
  'correctionAllowed', 'correctionApprovals', 'numberUniquenessScope', 'name',
];

async function getRaceOr404(id) {
  const race = await Race.findById(id);
  if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });
  return race;
}

// GET /api/race/races/:id
export async function GET(_req, { params }) {
  return handler(async () => {
    await requireRaceManager();
    await connectDB();
    const race = await Race.findById(params.id)
      .populate('event', 'title slug startDate endDate')
      .lean();
    if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });
    return ok({ race: toJSON(race) });
  });
}

// PUT /api/race/races/:id — update config. Bumps configVersion once per edit
// after the race is locked, so the offline bundle is re-versioned, never
// silently replaced (plan §4.3.12).
export async function PUT(req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const race = await getRaceOr404(params.id);
    const body = parseOrThrow(raceUpdateSchema, await req.json());

    const changedConfig = CONFIG_FIELDS.some(
      (f) => body[f] !== undefined && JSON.stringify(body[f]) !== JSON.stringify(race[f])
    );

    Object.assign(race, body);
    race.updatedBy = user._id;
    const bumped = changedConfig && race.status !== 'draft';
    if (bumped) {
      race.configVersion += 1;
    }
    await race.save();

    // Re-snapshot the immutable offline bundle for the new version so claimed
    // devices can pull a fresh, checksummed bundle (plan §4.3.12).
    if (bumped && ['locked', 'active', 'paused'].includes(race.status)) {
      await persistRaceSnapshot(race._id, user._id);
    }

    await logRaceAudit({
      actor: user, action: 'RACE_UPDATED', event: race.event, race: race._id,
      targetType: 'Race', targetId: race._id,
      meta: { changedConfig, configVersion: race.configVersion },
    });
    return ok({ race: toJSON(race) });
  });
}

// DELETE /api/race/races/:id — only safe for an empty draft race. Otherwise the
// caller must archive via the status route (plan §4.4 — never destroy history).
export async function DELETE(req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const race = await getRaceOr404(params.id);
    const force = new URL(req.url).searchParams.get('force') === '1';

    const eventCount = await RaceEvent.countDocuments({ race: race._id });
    const blocked = eventCount > 0 || race.status !== 'draft';
    if (blocked && !force) {
      throw Object.assign(
        new Error('Cannot delete a race with recorded events or past draft. Delete with force, or archive it.'),
        { status: 409 }
      );
    }

    if (force) {
      await Promise.all([
        RaceEvent.deleteMany({ race: race._id }),
        RaceResult.deleteMany({ race: race._id }),
        RaceConflict.deleteMany({ race: race._id }),
        RaceConfiguration.deleteMany({ race: race._id }),
        CheckpointSession.deleteMany({ race: race._id }),
        SyncReceipt.deleteMany({ race: race._id }),
      ]);
    }
    await RaceCategory.deleteMany({ race: race._id });
    await RaceEntry.deleteMany({ race: race._id });
    await Race.deleteOne({ _id: race._id });

    await logRaceAudit({
      actor: user, action: force && blocked ? 'RACE_FORCE_DELETED' : 'RACE_DELETED',
      event: race.event, race: race._id,
      targetType: 'Race', targetId: race._id,
      meta: { eventsRemoved: force ? eventCount : 0 },
    });
    return ok({ deleted: true });
  });
}
