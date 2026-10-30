import { requireAdmin } from '@/lib/auth';
import { ok, handler } from '@/lib/apiUtils';
import { backfillParticipantNumbers } from '@/lib/raceParticipants';

// POST: assign permanent participant numbers to any pool riders missing one.
// Safe to run repeatedly; only fills gaps and never renumbers existing riders.
export async function POST() {
  return handler(async () => {
    await requireAdmin();
    const result = await backfillParticipantNumbers();
    return ok(result);
  });
}
