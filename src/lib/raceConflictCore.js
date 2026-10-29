import { reduceEffective } from './raceHistoryCore';

/** Clock-uncertainty above this (ms) is flagged as uncertain timing (plan §10.3). */
export const CLOCK_UNCERTAINTY_THRESHOLD_MS = 2000;

/**
 * Pure cross-device conflict detection (no DB) — unit-testable (plan §10.2,
 * §13.4). Returns an array of findings:
 *   { type, entry, ids, detail, keyExtra? }
 * Persistence + dedup happen in raceConflictDetect (the DB wrapper).
 *
 * @param {object} race       { minLapDurationMs }
 * @param {Array}  allEvents  full append-only event list
 */
export function findConflicts(race, allEvents) {
  const { effective, byEntry } = reduceEffective(allEvents);
  const findings = [];
  const minLap = race.minLapDurationMs || 0;

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
          findings.push({ type: 'FINISH_BEFORE_START', entry: entryKey, ids: [starts[0]._id, e._id], detail: `A ${e.type} precedes the start.` });
          break;
        }
      }
    }

    if (minLap > 0) {
      const crossings = [
        ...(startTime != null ? [{ _id: starts[0]._id, t: startTime }] : []),
        ...laps.map((e) => ({ _id: e._id, t: new Date(e.occurredAt).getTime() })),
      ];
      for (let i = 1; i < crossings.length; i++) {
        const gap = crossings[i].t - crossings[i - 1].t;
        if (gap >= 0 && gap < minLap) {
          findings.push({ type: gap === 0 ? 'DUPLICATE_LAP' : 'SUSPICIOUS_INTERVAL', entry: entryKey, ids: [crossings[i - 1]._id, crossings[i]._id], detail: `Interval ${gap}ms is below the ${minLap}ms minimum lap.` });
        }
      }
    }
  }

  for (const e of effective) {
    if (typeof e.clockUncertaintyMs === 'number' && e.clockUncertaintyMs > CLOCK_UNCERTAINTY_THRESHOLD_MS) {
      findings.push({ type: 'CLOCK_UNCERTAINTY', entry: e.entry ? String(e.entry) : null, ids: [e._id], detail: `Event recorded with ±${e.clockUncertaintyMs}ms clock uncertainty.` });
    }
  }

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

  return findings;
}

export function conflictKey(type, entryId, ids = [], keyExtra) {
  if (keyExtra) return `${type}:${keyExtra}`;
  return `${type}:${entryId || '-'}:${[...ids].map(String).sort().join('+')}`;
}
