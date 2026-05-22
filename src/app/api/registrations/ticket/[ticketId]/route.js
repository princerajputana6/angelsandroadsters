import { connectDB } from '@/lib/db';
import Registration from '@/lib/models/Registration';
import Event from '@/lib/models/Event';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function GET(req, { params }) {
  return handler(async () => {
    await connectDB();
    const { ticketId } = params;

    const registration = await Registration.findOne({ ticketId })
      .populate('event', 'title location startDate endDate')
      .lean();

    if (!registration) {
      return fail('Registration not found', 404);
    }

    return ok({ registration: toJSON(registration) });
  });
}
