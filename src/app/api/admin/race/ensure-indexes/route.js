import { requireAdmin } from '@/lib/auth';
import { ok, handler } from '@/lib/apiUtils';
import { ensureRaceIndexes, getRaceIndexReport } from '@/lib/raceIndexes';

// GET: read-only report of indexes currently present on race collections.
export async function GET() {
  return handler(async () => {
    await requireAdmin();
    const report = await getRaceIndexReport();
    return ok({ report });
  });
}

// POST: create any missing race indexes (safe to run repeatedly; never drops).
export async function POST() {
  return handler(async () => {
    await requireAdmin();
    const result = await ensureRaceIndexes();
    // 207-ish semantics: 200 if all ok, 409 if any unique index failed to build
    // (usually pre-existing duplicate data the operator must resolve).
    return ok(result, result.ok ? 200 : 409);
  });
}
