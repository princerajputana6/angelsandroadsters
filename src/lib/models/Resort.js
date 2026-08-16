import mongoose from 'mongoose';
import slugify from 'slugify';
export { MAX_BOOKING_NIGHTS } from '@/lib/bookingConstants';

// A single bookable room category within a resort. `totalRooms` is the
// inventory; live availability is `totalRooms` minus confirmed/paid bookings
// (computed at read-time — see the availability route). Booking dates are
// fixed at the resort level (the Trailstorm window), so a room type only
// needs a per-night price, not its own calendar.
const roomTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  images: [String],
  pricePerNight: { type: Number, required: true, min: 0 },
  capacity: { type: Number, default: 2, min: 1 }, // guests per room
  totalRooms: { type: Number, required: true, min: 0 }, // inventory
  bedType: { type: String, default: '' },
  amenities: [String],
});

const resortSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  tagline: { type: String, default: '' },
  description: { type: String, default: '' },
  coverImage: String,
  images: [String],
  location: {
    address: String,
    city: String,
    state: String,
    coordinates: { lat: Number, lng: Number },
  },
  amenities: [String],

  // Fixed Trailstorm stay window — every booking uses these dates.
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  checkInTime: { type: String, default: '14:00' },
  checkOutTime: { type: String, default: '11:00' },

  policies: { type: String, default: '' },
  roomTypes: [roomTypeSchema],

  isPublished: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

resortSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }
  next();
});

// Number of nights in the fixed stay window (min 1).
resortSchema.virtual('nights').get(function () {
  if (!this.checkIn || !this.checkOut) return 1;
  const ms = new Date(this.checkOut) - new Date(this.checkIn);
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
});

resortSchema.set('toJSON', { virtuals: true });
resortSchema.set('toObject', { virtuals: true });

export default mongoose.models.Resort || mongoose.model('Resort', resortSchema);
