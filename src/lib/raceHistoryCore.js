/**
 * Pure effective-history reduction (no DB) so it is directly unit-testable
 * (plan §13.4). Given the full append-only event list for a race, returns the
 * effective timing events after applying VOID removals and CORRECTION overrides.
 * History is never mutated — this only derives a view.
 *
 * Event shape (plain objects): { _id, type, occurredAt, deviceSequence, entry,
 * deviceId, voidsEventId?, correctionOf?, payload?, clockUncertaintyMs? }.
 */
export function reduceEffective(all) {
  const voidedIds = new Set();
  const corrections = new Map(); // targetId -> correction event
  for (const e of all) {
    if (e.type === 'VOID' && e.voidsEventId) voidedIds.add(String(e.voidsEventId));
    if (e.type === 'CORRECTION' && e.correctionOf) corrections.set(String(e.correctionOf), e);
  }

  const effective = [];
  for (const e of all) {
    if (e.type === 'VOID' || e.type === 'CORRECTION') continue; // meta events
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

  return { effective, byEntry, voidedIds, corrections };
}
