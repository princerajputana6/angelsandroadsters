import { requireAdmin } from '@/lib/auth';
import { ok, handler } from '@/lib/apiUtils';
import { backfillParticipantNumbers, reseedParticipantNumbers } from '@/lib/raceParticipants';

/**
 * POST — assign permanent participant numbers.
 *
 * Body { start: <number> } → RE-SEED: links race-only participants into the
 * pool, then renumbers EVERY participant contiguously from `start`
 * (e.g. start:4 → 004, 005…) with no duplicates. Overwrites existing numbers.
 *
 * No body (or no `start`) → gap-fill only: number riders that have none yet,
 * leaving existing numbers untouched. Both are safe to re-run.
 */
export async function POST(req) {
  return handler(async () => {
    const user = await requireAdmin();
    let body = {};
    try { body = (await req.json()) || {}; } catch { body = {}; }

    if (body.start != null) {
      const start = Number(body.start);
      if (!Number.isFinite(start) || start < 0) {
        throw Object.assign(new Error('start must be a number ≥ 0'), { status: 400 });
      }
      const result = await reseedParticipantNumbers(start, user._id);
      return ok(result);
    }

    const result = await backfillParticipantNumbers();
    return ok(result);
  });
}
