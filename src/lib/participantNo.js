/**
 * Display a permanent participant number zero-padded to at least 3 digits
 * (1 → "001", 42 → "042", 1234 → "1234"). Returns '' when unset so callers can
 * render a placeholder for riders not yet backfilled.
 */
export function fmtParticipantNo(n) {
  if (n == null) return '';
  return String(n).padStart(3, '0');
}
