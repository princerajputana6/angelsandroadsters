import { connectDB } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { ok, fail, handler } from '@/lib/apiUtils';
import { lookupRegistration } from '@/lib/registrationLookup';

// POST /api/registrations/validate  { registrationId }
// Logged-in only (prevents PII enumeration). Returns the person's details and
// a groupKey used to enforce same-group booking.
export async function POST(req) {
  return handler(async () => {
    await requireUser();
    await connectDB();
    const { registrationId } = await req.json();
    if (!registrationId) return fail('registrationId is required', 400);

    const found = await lookupRegistration(registrationId);
    if (!found) return fail('No registration found for this ID', 404, { valid: false });
    if (found.status === 'cancelled') {
      return fail('This registration is cancelled', 409, { valid: false });
    }

    return ok({ valid: true, ...found });
  });
}
