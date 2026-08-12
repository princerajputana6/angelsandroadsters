import { connectDB } from '@/lib/db';
import Resort, { MAX_BOOKING_NIGHTS } from '@/lib/models/Resort';
import ResortBooking from '@/lib/models/ResortBooking';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';
import { remainingRooms } from '@/lib/resortAvailability';

// POST /api/resort-bookings → create a pending booking (logged-in users only).
// Availability is validated here; the room is only *held* once payment is
// verified and the booking flips to confirmed/paid.
export async function POST(req) {
  return handler(async () => {
    const user = await requireUser();
    await connectDB();
    const body = await req.json();

    const { resortId, roomTypeId, rooms, guests, nights, guestName, guestEmail, guestPhone, notes } = body;
    if (!resortId || !roomTypeId) return fail('resortId and roomTypeId are required', 400);

    const roomCount = Math.max(1, Number(rooms) || 1);

    const resort = await Resort.findById(resortId);
    if (!resort || !resort.isPublished) return fail('Resort not available', 404);

    const roomType = resort.roomTypes.id(roomTypeId);
    if (!roomType) return fail('Room type not found', 404);

    const remaining = await remainingRooms(resort._id, roomTypeId, roomType.totalRooms);
    if (roomCount > remaining) {
      return fail(
        remaining <= 0 ? 'This room is fully booked' : `Only ${remaining} room(s) left`,
        409,
        { soldOut: true, remaining }
      );
    }

    const maxGuests = roomType.capacity * roomCount;
    const guestCount = Math.min(Math.max(1, Number(guests) || 1), maxGuests);

    // Guest picks 1..MAX_BOOKING_NIGHTS nights, capped by the resort window.
    const maxNights = Math.min(MAX_BOOKING_NIGHTS, resort.nights);
    const nightCount = Math.min(Math.max(1, Number(nights) || 1), maxNights);

    // Check-out derived from the resort's fixed check-in + chosen nights.
    const checkOut = new Date(resort.checkIn);
    checkOut.setDate(checkOut.getDate() + nightCount);

    const totalAmount = roomType.pricePerNight * nightCount * roomCount;

    const booking = await ResortBooking.create({
      user: user._id,
      resort: resort._id,
      resortName: resort.name,
      roomTypeId: String(roomTypeId),
      roomTypeName: roomType.name,
      checkIn: resort.checkIn,
      checkOut,
      nights: nightCount,
      rooms: roomCount,
      guests: guestCount,
      pricePerNight: roomType.pricePerNight,
      totalAmount,
      guestName: guestName || user.name,
      guestEmail: guestEmail || user.email,
      guestPhone: guestPhone || user.phone || '',
      notes: notes || '',
      paymentStatus: 'pending',
      status: 'pending',
      statusHistory: [{ status: 'pending', note: 'Booking created' }],
    });

    return ok({ booking: toJSON(booking) }, 201);
  });
}

// GET /api/resort-bookings → admin list (with optional ?status= / ?resort=)
export async function GET(req) {
  return handler(async () => {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') throw Object.assign(new Error('Forbidden'), { status: 403 });
    await connectDB();

    const { searchParams } = new URL(req.url);
    const filter = {};
    const status = searchParams.get('status');
    const resort = searchParams.get('resort');
    if (status) filter.status = status;
    if (resort) filter.resort = resort;

    const bookings = await ResortBooking.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    return ok({ bookings: toJSON(bookings) });
  });
}
