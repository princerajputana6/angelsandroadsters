import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import RaceEntry from '@/lib/models/RaceEntry';
import RaceEvent from '@/lib/models/RaceEvent';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { getBoardState, appendBoardEvent, appendBoardStartAll } from '@/lib/raceBoard';
import { recomputeRaceResults } from '@/lib/raceProjection';

// GET /api/race/races/:id/board — current board state.
export async function GET(_req, { params }) {
  return handler(async () => {
    await requireRaceManager();
    const state = await getBoardState(params.id);
    return ok(state);
  });
}

async function loadRaceEntry(raceId, entryId) {
  const race = await Race.findById(raceId);
  if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });
  const entry = await RaceEntry.findOne({ _id: entryId, race: raceId, status: 'active' });
  if (!entry) throw Object.assign(new Error('Rider not found in this race'), { status: 404 });
  return { race, entry };
}

/**
 * POST /api/race/races/:id/board — drive the simple race flow.
 * body: { action: 'start' | 'out' | 'in' | 'end', entryId? }
 */
export async function POST(req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const { action, entryId } = await req.json();

    if (action === 'start') {
      const race = await Race.findById(params.id);
      if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });
      if (['completed', 'archived'].includes(race.status)) {
        throw Object.assign(new Error(`Race is ${race.status}; reopen it first.`), { status: 409 });
      }
      if (race.status !== 'active') {
        race.status = 'active';
        race.updatedBy = user._id;
        await race.save();
        await logRaceAudit({ actor: user, action: 'RACE_BOARD_STARTED', event: race.event, race: race._id, targetType: 'Race', targetId: race._id });
      }
      return ok(await getBoardState(params.id));
    }

    if (action === 'end') {
      const race = await Race.findById(params.id);
      if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });
      if (!['active', 'paused'].includes(race.status)) {
        throw Object.assign(new Error(`Race is ${race.status}; cannot end.`), { status: 409 });
      }
      race.status = 'completed';
      race.resultsState = race.resultsState === 'final' ? 'final' : 'provisional';
      race.updatedBy = user._id;
      await race.save();
      await recomputeRaceResults(race._id);
      await logRaceAudit({ actor: user, action: 'RACE_BOARD_ENDED', event: race.event, race: race._id, targetType: 'Race', targetId: race._id });
      return ok(await getBoardState(params.id));
    }

    // Reset one rider's timing — clears their OUT/IN so they are idle again.
    if (action === 'reset') {
      if (!entryId) throw Object.assign(new Error('entryId required'), { status: 400 });
      const { race, entry } = await loadRaceEntry(params.id, entryId);
      await RaceEvent.deleteMany({ race: race._id, entry: entry._id, type: { $in: ['RIDER_STARTED', 'RIDER_FINISHED'] } });
      await logRaceAudit({ actor: user, action: 'RACE_BOARD_RESET', event: race.event, race: race._id, targetType: 'RaceEntry', targetId: entry._id, meta: { raceNumber: entry.raceNumber } });
      if (race.status === 'completed') await recomputeRaceResults(race._id);
      return ok(await getBoardState(params.id));
    }

    // Reset the whole board — clears every rider's timing for a clean re-run.
    if (action === 'reset-all') {
      const race = await Race.findById(params.id);
      if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });
      await RaceEvent.deleteMany({ race: race._id, type: { $in: ['RIDER_STARTED', 'RIDER_FINISHED'] } });
      await logRaceAudit({ actor: user, action: 'RACE_BOARD_RESET_ALL', event: race.event, race: race._id, targetType: 'Race', targetId: race._id });
      if (race.status === 'completed') await recomputeRaceResults(race._id);
      return ok(await getBoardState(params.id));
    }

    // Mass start — mark every not-yet-started rider OUT at one shared time.
    if (action === 'out-all') {
      const race = await Race.findById(params.id);
      if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });
      if (race.status !== 'active') {
        throw Object.assign(new Error('Start the race before marking riders out.'), { status: 409 });
      }
      const [entries, started] = await Promise.all([
        RaceEntry.find({ race: race._id, status: 'active' }).select('_id raceNumber').sort({ raceNumber: 1 }).lean(),
        RaceEvent.find({ race: race._id, type: 'RIDER_STARTED' }).select('entry').lean(),
      ]);
      const startedSet = new Set(started.map((e) => String(e.entry)));
      const toStart = entries.filter((e) => !startedSet.has(String(e._id)));
      const n = await appendBoardStartAll(race, toStart, user);
      await logRaceAudit({ actor: user, action: 'RACE_BOARD_START_ALL', event: race.event, race: race._id, targetType: 'Race', targetId: race._id, meta: { started: n } });
      return ok(await getBoardState(params.id));
    }

    // Per-rider OUT / IN
    if (action === 'out' || action === 'in') {
      if (!entryId) throw Object.assign(new Error('entryId required'), { status: 400 });
      const { race, entry } = await loadRaceEntry(params.id, entryId);
      if (race.status !== 'active') {
        throw Object.assign(new Error('Start the race before marking riders out/in.'), { status: 409 });
      }

      const [hasStart, hasFinish] = await Promise.all([
        RaceEvent.exists({ race: race._id, entry: entry._id, type: 'RIDER_STARTED' }),
        RaceEvent.exists({ race: race._id, entry: entry._id, type: 'RIDER_FINISHED' }),
      ]);

      if (action === 'out') {
        if (hasStart) throw Object.assign(new Error('Rider already started.'), { status: 409 });
        await appendBoardEvent(race, entry, 'RIDER_STARTED', user);
      } else {
        if (!hasStart) throw Object.assign(new Error('Rider has not started yet.'), { status: 409 });
        if (hasFinish) throw Object.assign(new Error('Rider already finished.'), { status: 409 });
        await appendBoardEvent(race, entry, 'RIDER_FINISHED', user);
        // Timing shown on the board is derived directly from events (getBoardState),
        // so we do NOT run the heavy full-results recompute on every IN — that
        // happens once on End Race. This keeps each OUT/IN fast.
      }
      return ok(await getBoardState(params.id));
    }

    throw Object.assign(new Error('Unknown action'), { status: 400 });
  });
}
