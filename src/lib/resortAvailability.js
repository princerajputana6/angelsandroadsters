import ResortBooking from '@/lib/models/ResortBooking';

// Inventory is tracked in BEDS (allocations), not whole rooms. A room type has
// `totalRooms` rooms, each with an allocation size `capacity` (mandatory beds
// per room), so the sellable inventory is `totalRooms * capacity` beds. Guests
// buy individual beds — a solo guest takes one bed and leaves the rest of that
// room sellable to others. A booking holds `guests` beds.
//
// Beds are held once a booking is paid (or manually confirmed by an admin).
// Pending/unpaid bookings do NOT hold inventory — an abandoned checkout must
// not block a bed forever. This mirrors how event slots count only confirmed
// registrations.
const HELD_STATUSES = ['confirmed'];
const HELD_PAYMENT = ['paid'];

/**
 * Beds already held for one room type of a resort (sum of guests across held
 * bookings — each guest occupies one bed).
 * @returns {Promise<number>}
 */
export async function bookedBedCount(resortId, roomTypeId, { excludeBookingId } = {}) {
  const match = {
    resort: resortId,
    roomTypeId: String(roomTypeId),
    $or: [{ status: { $in: HELD_STATUSES } }, { paymentStatus: { $in: HELD_PAYMENT } }],
  };
  if (excludeBookingId) match._id = { $ne: excludeBookingId };

  const rows = await ResortBooking.aggregate([
    { $match: match },
    { $group: { _id: null, beds: { $sum: '$guests' } } },
  ]);
  return rows[0]?.beds || 0;
}

/**
 * Remaining beds for one room type.
 * @param {number} totalRooms rooms configured on the room type
 * @param {number} capacity   allocation size — beds per room
 */
export async function remainingBeds(resortId, roomTypeId, totalRooms, capacity, opts = {}) {
  const booked = await bookedBedCount(resortId, roomTypeId, opts);
  const totalBeds = Number(totalRooms || 0) * Math.max(1, Number(capacity || 1));
  return Math.max(0, totalBeds - booked);
}

/**
 * Build a { roomTypeId: remainingBeds } map for every room type on a resort doc.
 */
export async function availabilityMap(resort) {
  const out = {};
  for (const rt of resort.roomTypes || []) {
    const id = String(rt._id);
    out[id] = await remainingBeds(resort._id, id, rt.totalRooms, rt.capacity);
  }
  return out;
}
