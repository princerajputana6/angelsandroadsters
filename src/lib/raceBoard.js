import { randomUUID } from 'crypto';
import { connectDB } from './db';
import Race from './models/Race';
import RaceEntry from './models/RaceEntry';
import RaceEvent from './models/RaceEvent';
import { loadEffectiveEvents } from './raceHistory';
import { eventPayloadHash } from './raceEventHash';

/**
 * Admin "Race Board" flow (online, admin-driven) — the simple start→board→end
 * timing flow. OUT records a RIDER_STARTED, IN records a RIDER_FINISHED; each
 * rider's time = finish − start. These are ordinary append-only RaceEvents, so
 * audit, export, projections and results all work unchanged. The board is
 * attributed to a stable synthetic device id per race (admin-board:<raceId>).
 */
const boardDeviceId = (raceId) => `admin-board:${raceId}`;

/** Append an admin board event for an entry, allocating a unique device sequence. */
export async function appendBoardEvent(race, entry, type, user) {
  await connectDB();
  const deviceId = boardDeviceId(race._id);
  const occurredAt = new Date();

  // Allocate the next per-device sequence; retry on the (rare) unique collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const last = await RaceEvent.findOne({ deviceId }).sort({ deviceSequence: -1 }).select('deviceSequence').lean();
    const deviceSequence = (last?.deviceSequence || 0) + 1 + attempt;
    const clientEventId = randomUUID();
    const payload = { raceNumber: entry.raceNumber, source: 'admin-board' };
    const payloadHash = eventPayloadHash({
      type, raceId: race._id, entryId: entry._id, deviceId, deviceSequence, occurredAt: occurredAt.toISOString(), payload,
    });
    try {
      return await RaceEvent.create({
        clientEventId,
        event: race.event,
        race: race._id,
        entry: entry._id,
        deviceId,
        checkpointSessionId: deviceId, // synthetic session for the admin board
        officialId: user._id,
        deviceSequence,
        type,
        occurredAt,
        payload,
        payloadHash,
        schemaVersion: 1,
      });
    } catch (err) {
      if (err.code === 11000 && attempt < 4) continue; // seq race — retry
      throw err;
    }
  }
  throw Object.assign(new Error('Could not allocate event sequence'), { status: 500 });
}

/** Derive the board view for a race: each active rider's state + timing. */
export async function getBoardState(raceId) {
  await connectDB();
  const race = await Race.findById(raceId).select('name status resultsState event').lean();
  if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

  const [entries, { byEntry }] = await Promise.all([
    RaceEntry.find({ race: raceId, status: 'active' }).select('raceNumber riderName displayName').sort({ raceNumber: 1 }).lean(),
    loadEffectiveEvents(raceId),
  ]);

  const rows = entries.map((e) => {
    const evs = byEntry.get(String(e._id)) || [];
    const startEv = evs.find((x) => x.type === 'RIDER_STARTED');
    const finishEv = evs.find((x) => x.type === 'RIDER_FINISHED');
    const startedAt = startEv ? new Date(startEv.occurredAt).toISOString() : null;
    const finishedAt = finishEv ? new Date(finishEv.occurredAt).toISOString() : null;
    const timeMs = startEv && finishEv ? new Date(finishEv.occurredAt) - new Date(startEv.occurredAt) : null;
    const state = finishEv ? 'done' : startEv ? 'out' : 'idle';
    return {
      entryId: String(e._id),
      raceNumber: e.raceNumber,
      riderName: e.displayName || e.riderName,
      state,
      startedAt,
      finishedAt,
      timeMs,
    };
  });

  const started = rows.filter((r) => r.state !== 'idle');
  const allIn = rows.length > 0 && rows.every((r) => r.state === 'done');
  const anyOut = rows.some((r) => r.state === 'out');

  return {
    race: { id: String(race._id), name: race.name, status: race.status, resultsState: race.resultsState },
    riders: rows,
    counts: { total: rows.length, started: started.length, out: rows.filter((r) => r.state === 'out').length, done: rows.filter((r) => r.state === 'done').length },
    allIn,
    anyOut,
  };
}
