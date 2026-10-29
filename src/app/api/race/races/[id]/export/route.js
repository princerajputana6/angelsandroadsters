import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import RaceCategory from '@/lib/models/RaceCategory';
import RaceEntry from '@/lib/models/RaceEntry';
import RaceEvent from '@/lib/models/RaceEvent';
import RaceConflict from '@/lib/models/RaceConflict';
import RaceResult from '@/lib/models/RaceResult';
import RaceAuditLog from '@/lib/models/RaceAuditLog';
import CheckpointSession from '@/lib/models/CheckpointSession';
import SyncReceipt from '@/lib/models/SyncReceipt';
import RaceConfiguration from '@/lib/models/RaceConfiguration';
import { handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';

/**
 * GET /api/race/races/:id/export — full backup of a race's server-side state:
 * config, roster, the append-only event history, conflicts, results, audit log,
 * sessions and sync receipts (plan §4.4 "export backup", §12 export of event +
 * audit history). Downloaded as a JSON attachment. Photos are referenced by URL
 * only — their binaries are not inlined.
 */
export async function GET(_req, { params }) {
  const result = await handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const race = await Race.findById(params.id).lean();
    if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

    const [categories, entries, events, conflicts, results, auditLog, sessions, receipts, configs] = await Promise.all([
      RaceCategory.find({ race: race._id }).lean(),
      RaceEntry.find({ race: race._id }).lean(),
      RaceEvent.find({ race: race._id }).sort({ occurredAt: 1, deviceSequence: 1 }).lean(),
      RaceConflict.find({ race: race._id }).lean(),
      RaceResult.find({ race: race._id }).lean(),
      RaceAuditLog.find({ race: race._id }).sort({ createdAt: 1 }).lean(),
      CheckpointSession.find({ race: race._id }).lean(),
      SyncReceipt.find({ race: race._id }).lean(),
      RaceConfiguration.find({ race: race._id }).lean(),
    ]);

    await logRaceAudit({
      actor: user, action: 'RACE_EXPORTED', event: race.event, race: race._id,
      targetType: 'Race', targetId: race._id, meta: { events: events.length },
    });

    const bundle = {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      exportedBy: user.email || String(user._id),
      race: toJSON(race),
      categories: toJSON(categories),
      entries: toJSON(entries),
      events: toJSON(events),
      conflicts: toJSON(conflicts),
      results: toJSON(results),
      auditLog: toJSON(auditLog),
      sessions: toJSON(sessions),
      receipts: toJSON(receipts),
      configurations: toJSON(configs),
    };

    return NextResponse.json(bundle, {
      headers: { 'Content-Disposition': `attachment; filename="race-${race._id}-export.json"` },
    });
  });
  return result;
}
