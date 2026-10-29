import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import RaceEntry from '@/lib/models/RaceEntry';
import RaceEvent from '@/lib/models/RaceEvent';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { getBoardState, appendBoardEvent } from '@/lib/raceBoard';
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
        await recomputeRaceResults(race._id); // update timing/ranking as each rider finishes
      }
      return ok(await getBoardState(params.id));
    }

    throw Object.assign(new Error('Unknown action'), { status: 400 });
  });
}
