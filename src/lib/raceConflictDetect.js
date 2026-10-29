import { connectDB } from './db';
import Race from './models/Race';
import RaceConflict from './models/RaceConflict';
import { loadEffectiveEvents } from './raceHistory';

/**
 * Cross-device conflict / validation detection (plan §10.2). Runs over the
 * effective history and flags anomalies for human review. It NEVER deletes or
 * mutates events — it only records RaceConflict rows. Detection is idempotent:
 * each finding has a deterministic `key`, and we skip creating a row the
 * operator has already resolved/waived (so resolutions stick).
 *
 * A clock-uncertainty threshold above this is flagged as uncertain timing.
 */
const CLOCK_UNCERTAINTY_THRESHOLD_MS = 2000;

function makeKey(type, entryId, ids = []) {
  return `${type}:${entryId || '-'}:${[...ids].map(String).sort().join('+')}`;
}

export async function detectConflicts(raceId) {
  await connectDB();
  const race = await Race.findById(raceId).lean();
  if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

  const { effective, byEntry } = await loadEffectiveEvents(raceId);
  const findings = []; // { type, entry, ids, detail }

  // ---- per-entry rules ----
  for (const [entryKey, evs] of byEntry.entries()) {
    const sorted = [...evs].sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
    const starts = sorted.filter((e) => e.type === 'RIDER_STARTED');
    const laps = sorted.filter((e) => e.type === 'LAP_RECORDED');
    const finishes = sorted.filter((e) => e.type === 'RIDER_FINISHED');
    const dnfs = sorted.filter((e) => e.type === 'DNF');

    if (starts.length > 1) {
      findings.push({ type: 'DOUBLE_START', entry: entryKey, ids: starts.map((e) => e._id), detail: `${starts.length} start events recorded for this rider.` });
    }
    if (finishes.length && dnfs.length) {
      findings.push({ type: 'DNF_FINISH_CONFLICT', entry: entryKey, ids: [...finishes, ...dnfs].map((e) => e._id), detail: 'Rider has both a FINISH and a DNF.' });
    }

    const startTime = starts.length ? new Date(starts[0].occurredAt).getTime() : null;
    if (startTime != null) {
      for (const e of [...laps, ...finishes]) {
        if (new Date(e.occurredAt).getTime() < startTime) {
          findings.push({ type: 'FINISH_BEFORE_START', entry: entryKey, ids: [starts[0]._id, e._id], detail: `A ${e.type} at ${new Date(e.occurredAt).toISOString()} precedes the start.` });
          break;
        }
      }
    }

    // Suspiciously short interval between consecutive laps (or lap after start).
    const minLap = race.minLapDurationMs || 0;
    if (minLap > 0) {
      const crossings = [...(startTime != null ? [{ _id: starts[0]._id, t: startTime }] : []), ...laps.map((e) => ({ _id: e._id, t: new Date(e.occurredAt).getTime() }))];
      for (let i = 1; i < crossings.length; i++) {
        const gap = crossings[i].t - crossings[i - 1].t;
        if (gap >= 0 && gap < minLap) {
          findings.push({ type: gap === 0 ? 'DUPLICATE_LAP' : 'SUSPICIOUS_INTERVAL', entry: entryKey, ids: [crossings[i - 1]._id, crossings[i]._id], detail: `Interval ${gap}ms is below the ${minLap}ms minimum lap.` });
        }
      }
    }
  }

  // ---- timing-quality rule (any event) ----
  for (const e of effective) {
    if (typeof e.clockUncertaintyMs === 'number' && e.clockUncertaintyMs > CLOCK_UNCERTAINTY_THRESHOLD_MS) {
      findings.push({ type: 'CLOCK_UNCERTAINTY', entry: e.entry ? String(e.entry) : null, ids: [e._id], detail: `Event recorded with ±${e.clockUncertaintyMs}ms clock uncertainty.` });
    }
  }

  // ---- per-device sequence gap rule (plan §9.1.9) ----
  const seqByDevice = new Map();
  for (const e of effective) {
    if (!seqByDevice.has(e.deviceId)) seqByDevice.set(e.deviceId, []);
    seqByDevice.get(e.deviceId).push(e.deviceSequence);
  }
  for (const [deviceId, seqs] of seqByDevice.entries()) {
    const uniq = [...new Set(seqs)].sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < uniq.length; i++) if (uniq[i] - uniq[i - 1] > 1) gaps.push(`${uniq[i - 1]}→${uniq[i]}`);
    if (gaps.length) {
      findings.push({ type: 'SEQUENCE_GAP', entry: null, ids: [], detail: `Device ${deviceId} sequence gaps: ${gaps.join(', ')} (investigate — may be interrupted session).`, keyExtra: `${deviceId}:${gaps.join(',')}` });
    }
  }

  // ---- persist findings idempotently ----
  let created = 0;
  for (const f of findings) {
    const key = f.keyExtra ? `${f.type}:${f.keyExtra}` : makeKey(f.type, f.entry, f.ids);
    const existing = await RaceConflict.findOne({ race: race._id, key }).lean();
    if (existing) continue; // open OR already resolved/waived — don't recreate
    await RaceConflict.create({
      event: race.event,
      race: race._id,
      entry: f.entry || undefined,
      type: f.type,
      status: 'open',
      key,
      relatedEventIds: f.ids,
      detail: f.detail,
    });
    created += 1;
  }

  const openCount = await RaceConflict.countDocuments({ race: race._id, status: 'open' });
  return { created, openCount, findings: findings.length };
}
