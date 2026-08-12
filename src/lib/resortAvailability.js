import ResortBooking from '@/lib/models/ResortBooking';

// Rooms are held once a booking is paid (or manually confirmed by an admin).
// Pending/unpaid bookings do NOT hold inventory — an abandoned checkout must
// not block a room forever. This mirrors how event slots count only
// confirmed registrations.
const HELD_STATUSES = ['confirmed'];
const HELD_PAYMENT = ['paid'];

/**
 * Rooms already held for one room type of a resort.
 * @returns {Promise<number>}
 */
export async function bookedRoomCount(resortId, roomTypeId, { excludeBookingId } = {}) {
  const match = {
    resort: resortId,
    roomTypeId: String(roomTypeId),
    $or: [{ status: { $in: HELD_STATUSES } }, { paymentStatus: { $in: HELD_PAYMENT } }],
  };
  if (excludeBookingId) match._id = { $ne: excludeBookingId };

  const rows = await ResortBooking.aggregate([
    { $match: match },
    { $group: { _id: null, rooms: { $sum: '$rooms' } } },
  ]);
  return rows[0]?.rooms || 0;
}

/**
 * Remaining rooms for one room type.
 * @param {number} totalRooms inventory configured on the room type
 */
export async function remainingRooms(resortId, roomTypeId, totalRooms, opts = {}) {
  const booked = await bookedRoomCount(resortId, roomTypeId, opts);
  return Math.max(0, Number(totalRooms || 0) - booked);
}

/**
 * Build a { roomTypeId: remaining } map for every room type on a resort doc.
 */
export async function availabilityMap(resort) {
  const out = {};
  for (const rt of resort.roomTypes || []) {
    const id = String(rt._id);
    out[id] = await remainingRooms(resort._id, id, rt.totalRooms);
  }
  return out;
}
