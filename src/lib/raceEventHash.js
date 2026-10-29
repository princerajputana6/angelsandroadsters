import { createHash } from 'crypto';

/**
 * Deterministic canonical hash of an event's identifying content. Used by the
 * sync endpoint to tell a true retry (same clientEventId, same content → ack)
 * from an integrity conflict (same id, different content → flag), per plan
 * §9.1.7–9.1.8. Must be stable across retries, so it is computed only from the
 * immutable identifying fields the device sends — never server timestamps.
 */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
}

export function eventPayloadHash(evt) {
  const identifying = {
    type: evt.type,
    raceId: String(evt.raceId ?? ''),
    entryId: evt.entryId ? String(evt.entryId) : '',
    deviceId: String(evt.deviceId ?? ''),
    deviceSequence: evt.deviceSequence,
    occurredAt: evt.occurredAt,
    payload: evt.payload ?? {},
  };
  return createHash('sha256').update(canonical(identifying)).digest('hex');
}
