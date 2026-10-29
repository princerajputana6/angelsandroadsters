import { connectDB } from './db';
import RaceEvent from './models/RaceEvent';

/**
 * Derive the "effective" timing history of a race from its append-only events
 * (plan §6, §8.1). History is never mutated — instead:
 *   - a VOID event (voidsEventId) removes its target from the effective set;
 *   - a CORRECTION event (correctionOf) overrides fields on its target via its
 *     payload: { setType, setOccurredAt, setEntry }.
 * VOID/CORRECTION are meta events and are themselves excluded from timing.
 *
 * Returns { all, effective, byEntry, voidedIds, corrections } where `effective`
 * is sorted by occurredAt then deviceSequence, and `byEntry` groups effective
 * timing events by entryId string.
 */
export async function loadEffectiveEvents(raceId) {
  await connectDB();
  const all = await RaceEvent.find({ race: raceId }).sort({ occurredAt: 1, deviceSequence: 1 }).lean();

  const voidedIds = new Set();
  const corrections = new Map(); // targetId -> correction event
  for (const e of all) {
    if (e.type === 'VOID' && e.voidsEventId) voidedIds.add(String(e.voidsEventId));
    if (e.type === 'CORRECTION' && e.correctionOf) corrections.set(String(e.correctionOf), e);
  }

  const effective = [];
  for (const e of all) {
    if (e.type === 'VOID' || e.type === 'CORRECTION') continue; // meta
    if (voidedIds.has(String(e._id))) continue; // removed by a void
    const corr = corrections.get(String(e._id));
    if (corr) {
      const p = corr.payload || {};
      effective.push({
        ...e,
        type: p.setType || e.type,
        occurredAt: p.setOccurredAt ? new Date(p.setOccurredAt) : e.occurredAt,
        entry: p.setEntry || e.entry,
        _correctedBy: corr._id,
      });
    } else {
      effective.push(e);
    }
  }

  effective.sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt) || (a.deviceSequence - b.deviceSequence));

  const byEntry = new Map();
  for (const e of effective) {
    if (!e.entry) continue;
    const k = String(e.entry);
    if (!byEntry.has(k)) byEntry.set(k, []);
    byEntry.get(k).push(e);
  }

  return { all, effective, byEntry, voidedIds, corrections };
}
