import { connectDB } from '@/lib/db';
import ResortBooking from '@/lib/models/ResortBooking';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') throw Object.assign(new Error('Forbidden'), { status: 403 });
  return user;
}

// GET /api/resort-bookings/[id] → single booking (admin)
export async function GET(_req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const booking = await ResortBooking.findById(params.id).populate('user', 'name email').lean();
    if (!booking) return fail('Booking not found', 404);
    return ok({ booking: toJSON(booking) });
  });
}

// PATCH /api/resort-bookings/[id] → update status / notes (admin)
export async function PATCH(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const booking = await ResortBooking.findById(params.id);
    if (!booking) return fail('Booking not found', 404);

    const body = await req.json();
    if (body.status) {
      if (!['pending', 'confirmed', 'cancelled'].includes(body.status)) {
        return fail('Invalid status', 400);
      }
      booking.status = body.status;
      booking.statusHistory.push({ status: body.status, note: body.note || 'Updated by admin' });
    }
    if (body.paymentStatus) {
      if (!['pending', 'paid', 'failed', 'refunded'].includes(body.paymentStatus)) {
        return fail('Invalid payment status', 400);
      }
      booking.paymentStatus = body.paymentStatus;
    }
    if (body.notes !== undefined) booking.notes = body.notes;

    await booking.save();
    return ok({ booking: toJSON(booking) });
  });
}
