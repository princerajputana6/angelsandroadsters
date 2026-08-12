import mongoose from 'mongoose';
import crypto from 'crypto';

// A room booking against a resort. Fields snapshot the resort/room state at
// booking time (name, price, dates) so a later admin edit to the resort never
// rewrites what the guest actually paid for.
const resortBookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true, index: true },

  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  resort: { type: mongoose.Schema.Types.ObjectId, ref: 'Resort', required: true, index: true },
  resortName: String,
  roomTypeId: { type: String, required: true }, // subdoc _id of the chosen room type
  roomTypeName: String,

  checkIn: Date,
  checkOut: Date,
  nights: { type: Number, default: 1 },

  rooms: { type: Number, required: true, min: 1 }, // number of rooms booked
  guests: { type: Number, default: 1, min: 1 },

  pricePerNight: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },

  guestName: String,
  guestEmail: String,
  guestPhone: String,
  notes: { type: String, default: '' },

  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending', index: true },
  paymentId: String,
  razorpayOrderId: String,

  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending', index: true },

  statusHistory: [{
    status: String,
    note: String,
    at: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

resortBookingSchema.pre('validate', function (next) {
  if (!this.bookingId) {
    this.bookingId = 'RB-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  next();
});

export default mongoose.models.ResortBooking || mongoose.model('ResortBooking', resortBookingSchema);
