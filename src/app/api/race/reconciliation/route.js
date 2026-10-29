import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import RaceEvent from '@/lib/models/RaceEvent';
import RaceDevice from '@/lib/models/RaceDevice';
import CheckpointSession from '@/lib/models/CheckpointSession';
import SyncReceipt from '@/lib/models/SyncReceipt';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager } from '@/lib/raceAuth';

/**
 * Reconciliation report (plan §12): per-device expected vs observed device
 * sequences, gaps, pending counts and receipts, so an operator can confirm the
 * server received everything a device recorded. NOTE: a server cannot inspect
 * an offline device's CURRENT local queue — `lastReportedPending` is only what
 * the device last told us, which may be stale (plan §12).
 */
export async function GET(req) {
  return handler(async () => {
    await requireRaceManager();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const raceId = searchParams.get('race');
    if (!raceId) throw Object.assign(new Error('race query param required'), { status: 400 });

    const race = await Race.findById(raceId).select('name').lean();
    if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

    const [sessions, events, receipts] = await Promise.all([
      CheckpointSession.find({ race: raceId }).populate('official', 'name email').populate('device', 'label deviceId lastSeenAt lastSyncAt lastReportedPending').sort({ createdAt: -1 }).lean(),
      RaceEvent.find({ race: raceId }).select('deviceId deviceSequence').lean(),
      SyncReceipt.find({ race: raceId }).sort({ receivedAt: -1 }).limit(50).lean(),
    ]);

    // Group observed sequences per device, compute min/max/count/gaps.
    const perDevice = new Map();
    for (const e of events) {
      if (!perDevice.has(e.deviceId)) perDevice.set(e.deviceId, []);
      perDevice.get(e.deviceId).push(e.deviceSequence);
    }
    const devices = [];
    for (const [deviceId, seqs] of perDevice.entries()) {
      const uniq = [...new Set(seqs)].sort((a, b) => a - b);
      const gaps = [];
      for (let i = 1; i < uniq.length; i++) if (uniq[i] - uniq[i - 1] > 1) gaps.push(`${uniq[i - 1]}→${uniq[i]}`);
      const deviceDoc = await RaceDevice.findOne({ deviceId }).select('label lastSyncAt lastReportedPending').lean();
      devices.push({
        deviceId,
        label: deviceDoc?.label || '',
        observedCount: uniq.length,
        minSeq: uniq[0],
        maxSeq: uniq[uniq.length - 1],
        gaps,
        lastReportedPending: deviceDoc?.lastReportedPending ?? null,
        lastSyncAt: deviceDoc?.lastSyncAt || null,
      });
    }

    return ok({
      race: toJSON(race),
      sessions: toJSON(sessions),
      devices,
      receipts: toJSON(receipts),
    });
  });
}
