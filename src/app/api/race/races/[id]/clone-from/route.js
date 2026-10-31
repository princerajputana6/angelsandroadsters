import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import RaceEntry from '@/lib/models/RaceEntry';
import RaceResult from '@/lib/models/RaceResult';
import RaceEvent from '@/lib/models/RaceEvent';
import RaceConflict from '@/lib/models/RaceConflict';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';

/**
 * POST /api/race/races/:id/clone-from — copy the participants (entries) and
 * their results from a SOURCE race into this (TARGET) race. Used to mirror one
 * event's start list and standings onto another (e.g. Shadow Run → Dune Raid).
 *
 * body: { sourceRaceId, replaceExisting? }
 *   - replaceExisting: when the target already has entries, wipe the target's
 *     entries/results/events/conflicts first so it becomes an exact copy.
 *     Otherwise the request is rejected with 409 so nothing is overwritten.
 *
 * Each copied result pins the source's effective time and status into the
 * manual-override fields (adjustedTimeMs / manualStatus) alongside the derived
 * fields, and carries manualPoints across — so the copy shows correctly on the
 * Results page AND survives a later ↻ Recompute on the target race (which would
 * otherwise reset derived fields, since the target has no timing events).
 */
export async function POST(req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();

    const body = await req.json();
    const sourceRaceId = body?.sourceRaceId;
    const replaceExisting = !!body?.replaceExisting;
    if (!sourceRaceId) throw Object.assign(new Error('sourceRaceId is required'), { status: 400 });
    if (String(sourceRaceId) === String(params.id)) {
      throw Object.assign(new Error('Source and target races must be different'), { status: 400 });
    }

    const [target, source] = await Promise.all([
      Race.findById(params.id).lean(),
      Race.findById(sourceRaceId).lean(),
    ]);
    if (!target) throw Object.assign(new Error('Target race not found'), { status: 404 });
    if (!source) throw Object.assign(new Error('Source race not found'), { status: 404 });

    const [srcEntries, srcResults, targetEntryCount] = await Promise.all([
      RaceEntry.find({ race: source._id, status: 'active' }).lean(),
      RaceResult.find({ race: source._id }).lean(),
      RaceEntry.countDocuments({ race: target._id, status: 'active' }),
    ]);
    if (!srcEntries.length) {
      throw Object.assign(new Error('Source race has no participants to copy'), { status: 400 });
    }
    if (targetEntryCount > 0 && !replaceExisting) {
      throw Object.assign(
        new Error(`Target race already has ${targetEntryCount} participant(s). Enable "replace existing" to overwrite.`),
        { status: 409 }
      );
    }

    // Replace: clear the target's data so it becomes an exact copy of the source.
    if (replaceExisting) {
      await Promise.all([
        RaceResult.deleteMany({ race: target._id }),
        RaceConflict.deleteMany({ race: target._id }),
        RaceEvent.deleteMany({ race: target._id }),
        RaceEntry.deleteMany({ race: target._id }),
      ]);
    }

    // Copy entries, keeping each rider's identity + race number. Category is
    // dropped (it references the source race's categories).
    const entryIdMap = new Map(); // sourceEntryId -> newEntryId
    let entriesCreated = 0;
    for (const e of srcEntries) {
      try {
        const created = await RaceEntry.create({
          event: target.event,
          race: target._id,
          poolRider: e.poolRider || undefined,
          rider: e.rider || undefined,
          registration: e.registration || undefined,
          riderName: e.riderName,
          displayName: e.displayName || undefined,
          raceNumber: e.raceNumber,
          bike: e.bike || {},
          photos: e.photos || {},
          checkInStatus: e.checkInStatus,
          status: 'active',
          createdBy: user._id,
        });
        entryIdMap.set(String(e._id), created._id);
        entriesCreated += 1;
      } catch (err) {
        if (err.code === 11000) continue; // race-number clash (non-replace) — skip
        throw err;
      }
    }

    // Copy results onto the newly created entries.
    const resultDocs = [];
    for (const r of srcResults) {
      const newEntryId = entryIdMap.get(String(r.entry));
      if (!newEntryId) continue; // result for a withdrawn/void entry — skip
      const effStatus = r.manualStatus || r.status;
      const effTime = r.adjustedTimeMs != null ? r.adjustedTimeMs : r.totalTimeMs;
      resultDocs.push({
        event: target.event,
        race: target._id,
        entry: newEntryId,
        status: effStatus,
        provisional: r.provisional,
        lapsCompleted: r.lapsCompleted || 0,
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
        totalTimeMs: effTime,
        bestLapMs: r.bestLapMs,
        rank: r.rank,
        manualPoints: r.manualPoints || 0,
        // Pin the source's effective time + status so the copy survives recompute.
        adjustedTimeMs: effTime != null ? effTime : null,
        manualStatus: effStatus || null,
        adjustNote: r.adjustNote || '',
        computedAt: new Date(),
      });
    }
    let resultsCreated = 0;
    if (resultDocs.length) {
      const inserted = await RaceResult.insertMany(resultDocs, { ordered: false });
      resultsCreated = inserted.length;
    }

    await logRaceAudit({
      actor: user, action: 'RACE_DATA_CLONED', event: target.event, race: target._id,
      targetType: 'Race', targetId: target._id,
      meta: { sourceRace: String(source._id), entriesCreated, resultsCreated, replaced: replaceExisting },
    });

    return ok({
      target: toJSON({ _id: target._id, name: target.name }),
      source: toJSON({ _id: source._id, name: source.name }),
      entriesCreated,
      resultsCreated,
      replaced: replaceExisting,
    }, 201);
  });
}
