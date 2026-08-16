import { connectDB } from '@/lib/db';
import Resort, { MAX_BOOKING_NIGHTS } from '@/lib/models/Resort';
import ResortBooking from '@/lib/models/ResortBooking';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';
import { remainingRooms } from '@/lib/resortAvailability';
import { lookupRegistration } from '@/lib/registrationLookup';

const VALID_TYPES = ['individual', 'group', 'visitor', 'staff', 'volunteer', 'organizer'];

// POST /api/resort-bookings → create a pending booking (logged-in users only).
// One registration ID per guest; rooms are auto-derived from guest count and
// the room's capacity. Availability is validated here; the room is only *held*
// once payment is verified and the booking flips to confirmed/paid.
export async function POST(req) {
  return handler(async () => {
    const user = await requireUser();
    await connectDB();
    const body = await req.json();

    const { resortId, roomTypeId, nights, notes } = body;
    const registrationType = body.registrationType || 'individual';
    const guestRegistrations = Array.isArray(body.guestRegistrations) ? body.guestRegistrations : [];

    if (!resortId || !roomTypeId) return fail('resortId and roomTypeId are required', 400);
    if (!VALID_TYPES.includes(registrationType)) return fail('Invalid registration type', 400);
    if (guestRegistrations.length === 0) return fail('At least one guest with a registration ID is required', 400);

    const resort = await Resort.findById(resortId);
    if (!resort || !resort.isPublished) return fail('Resort not available', 404);

    const roomType = resort.roomTypes.id(roomTypeId);
    if (!roomType) return fail('Room type not found', 404);

    // Validate every guest's registration ID and resolve their details.
    const resolved = [];
    const groupKeys = new Set();
    for (const g of guestRegistrations) {
      const regId = String(g?.registrationId || '').trim();
      if (!regId) return fail('Every guest needs a registration ID', 400);
      const found = await lookupRegistration(regId);
      if (!found) return fail(`Registration ID "${regId}" was not found`, 404, { invalidId: regId });
      if (found.status === 'cancelled') return fail(`Registration "${regId}" is cancelled`, 409, { invalidId: regId });
      if (found.type !== registrationType) {
        return fail(`Registration "${regId}" is a ${found.type} registration, not ${registrationType}`, 409, { invalidId: regId });
      }
      groupKeys.add(found.groupKey);
      resolved.push({
        registrationId: found.registrationId,
        name: found.person.name,
        email: found.person.email,
        phone: found.person.phone,
      });
    }

    // Group bookings: everyone must belong to the same group.
    if (registrationType === 'group' && groupKeys.size > 1) {
      return fail('All group guests must belong to the same group', 409);
    }
    // No duplicate registration IDs within one booking.
    const uniqueIds = new Set(resolved.map((r) => r.registrationId.toUpperCase()));
    if (uniqueIds.size !== resolved.length) return fail('Each guest must have a different registration ID', 400);

    const guestCount = resolved.length;
    const capacity = Math.max(1, roomType.capacity || 1);
    const roomsNeeded = Math.ceil(guestCount / capacity); // up to `capacity` share a room

    const remaining = await remainingRooms(resort._id, roomTypeId, roomType.totalRooms);
    if (roomsNeeded > remaining) {
      return fail(
        remaining <= 0 ? 'This room is fully booked' : `Only ${remaining} room(s) left — reduce guests`,
        409,
        { soldOut: true, remaining }
      );
    }

    // Guest picks 1..MAX_BOOKING_NIGHTS nights, capped by the resort window.
    const maxNights = Math.min(MAX_BOOKING_NIGHTS, resort.nights);
    const nightCount = Math.min(Math.max(1, Number(nights) || 1), maxNights);

    // Check-out derived from the resort's fixed check-in + chosen nights.
    const checkOut = new Date(resort.checkIn);
    checkOut.setDate(checkOut.getDate() + nightCount);

    const totalAmount = roomType.pricePerNight * nightCount * roomsNeeded;

    const primary = resolved[0];
    const booking = await ResortBooking.create({
      user: user._id,
      resort: resort._id,
      resortName: resort.name,
      roomTypeId: String(roomTypeId),
      roomTypeName: roomType.name,
      checkIn: resort.checkIn,
      checkOut,
      nights: nightCount,
      rooms: roomsNeeded,
      guests: guestCount,
      registrationType,
      guestRegistrations: resolved,
      pricePerNight: roomType.pricePerNight,
      totalAmount,
      guestName: primary.name || user.name,
      guestEmail: primary.email || user.email,
      guestPhone: primary.phone || user.phone || '',
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
