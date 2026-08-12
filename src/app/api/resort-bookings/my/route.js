import { connectDB } from '@/lib/db';
import ResortBooking from '@/lib/models/ResortBooking';
import { requireUser } from '@/lib/auth';
import { ok, handler, toJSON } from '@/lib/apiUtils';

// GET /api/resort-bookings/my → current user's resort bookings
export async function GET() {
  return handler(async () => {
    const user = await requireUser();
    await connectDB();
    const bookings = await ResortBooking.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();
    return ok({ bookings: toJSON(bookings) });
  });
}
