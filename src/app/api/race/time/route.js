import { ok } from '@/lib/apiUtils';

// GET /api/race/time — authoritative server time for device clock calibration
// (plan §10.3). No auth needed; returns only the current server epoch millis.
export const dynamic = 'force-dynamic';

export async function GET() {
  return ok({ now: Date.now() });
}
