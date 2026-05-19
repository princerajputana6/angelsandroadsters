import mongoose from 'mongoose';
import crypto from 'crypto';

const memberSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  status: { type: String, enum: ['pending', 'confirmed'], default: 'pending' },
}, { _id: true });

const registrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  registrationType: { type: String, enum: ['individual', 'group', 'visitor'], required: true },

  name: String,
  email: String,
  phone: String,
  age: Number,
  emergencyContact: String,
  experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
  bikeDetails: String,
  visitDate: Date,

  groupName: String,
  groupLeader: { name: String, email: String, phone: String },
  members: [memberSchema],
  groupSize: Number,

  paymentStatus: { type: String, enum: ['pending', 'paid', 'free', 'refunded'], default: 'pending' },
  paymentId: String,
  amount: { type: Number, default: 0 },
  ticketId: { type: String, unique: true, index: true },
  qrCode: String,
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'attended'], default: 'pending' },
  notes: String,
}, { timestamps: true });

registrationSchema.pre('save', function (next) {
  if (!this.ticketId) {
    this.ticketId = 'TR-' + crypto.randomBytes(6).toString('hex').toUpperCase();
  }
  next();
});

export default mongoose.models.Registration || mongoose.model('Registration', registrationSchema);
