import mongoose from 'mongoose';
import crypto from 'crypto';

const memberSchema = new mongoose.Schema({
  // Every group member gets their own unique registration ID (not just the
  // group). Used for resort-booking validation and per-person entry.
  registrationId: { type: String, index: true },
  name: String,
  email: String,
  phone: String,

  // Basic Details
  nickname: String,
  dateOfBirth: Date,
  age: Number,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodGroup: String,
  whatsappNumber: String,
  city: String,
  state: String,
  instagramProfile: String,
  youtubeChannel: String,
  
  // Identity Verification
  governmentIdProof: String, // URL to uploaded file
  riderPhoto: String, // URL to uploaded photo
  
  // Motorcycle Details
  bikeDetails: String,
  motorcycleBrand: String,
  motorcycleModel: String,
  engineCC: String,
  registrationNumber: String,
  experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
  
  // Riding Information
  previousOffRoadEvents: Boolean,
  previousEventsDetails: String,
  ridingClubName: String,
  emergencyContact: String,
  emergencyContactNumber: String,
  
  // Medical & Safety
  medicalConditions: String,
  allergies: String,
  physicallyFit: Boolean,
  hasHelmet: Boolean,
  hasRidingJacket: Boolean,
  hasGloves: Boolean,
  hasKneeGuards: Boolean,
  hasRidingBoots: Boolean,
  hasHydrationPack: Boolean,
  
  // Consent
  agreeToRules: Boolean,
  understandsRisk: Boolean,
  acceptsLiability: Boolean,
  allowsMediaUsage: Boolean,
  
  // Additional Fields
  address: String,
  pincode: String,
  
  profileCompleted: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'confirmed'], default: 'pending' },
}, { _id: true });

const registrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  registrationType: {
    type: String,
    enum: ['individual', 'group', 'visitor', 'staff', 'volunteer', 'organizer'],
    required: true,
  },

  name: String,
  email: String,
  phone: String,
  
  // Basic Details
  nickname: String,
  dateOfBirth: Date,
  age: Number,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodGroup: String,
  whatsappNumber: String,
  city: String,
  state: String,
  instagramProfile: String,
  youtubeChannel: String,
  
  // Identity Verification
  governmentIdProof: String,
  riderPhoto: String,
  
  // Motorcycle Details
  bikeDetails: String,
  motorcycleBrand: String,
  motorcycleModel: String,
  engineCC: String,
  registrationNumber: String,
  experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
  
  // Riding Information
  previousOffRoadEvents: Boolean,
  previousEventsDetails: String,
  ridingClubName: String,
  emergencyContact: String,
  emergencyContactNumber: String,
  
  // Medical & Safety
  medicalConditions: String,
  allergies: String,
  physicallyFit: Boolean,
  hasHelmet: Boolean,
  hasRidingJacket: Boolean,
  hasGloves: Boolean,
  hasKneeGuards: Boolean,
  hasRidingBoots: Boolean,
  hasHydrationPack: Boolean,
  
  // Consent
  agreeToRules: Boolean,
  understandsRisk: Boolean,
  acceptsLiability: Boolean,
  allowsMediaUsage: Boolean,
  
  // Additional
  address: String,
  pincode: String,
  
  profileCompleted: { type: Boolean, default: false },
  visitDate: Date,
  visitDays: [Date],
  visitorCount: { type: Number, default: 1 },

  groupName: String,
  groupLeader: { name: String, email: String, phone: String },
  teamMotto: String,
  teamCity: String,
  teamState: String,
  teamCaptainName: String,
  teamCaptainMobile: String,
  teamCaptainEmail: String,
  teamInstagram: String,
  teamPhoto: String, // URL to uploaded team photo
  teamLogo: String,  // URL to uploaded team/club logo
  teamAgreeToRules: Boolean,
  teamAgreeToSafety: Boolean,
  teamAgreeToDecisions: Boolean,
  teamAgreeToMedia: Boolean,
  teamAgreeToLiability: Boolean,
  members: [memberSchema],
  groupSize: Number,

  couponCode: { type: String, default: null },
  discountAmount: { type: Number, default: 0 },

  paymentStatus: { type: String, enum: ['pending', 'paid', 'free', 'refunded'], default: 'pending' },
  paymentId: String,
  amount: { type: Number, default: 0 },
  ticketId: { type: String, unique: true, index: true },
  qrCode: String,
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'attended'], default: 'pending' },
  notes: String,
}, { timestamps: true });

const genRegId = () => 'TR-' + crypto.randomBytes(6).toString('hex').toUpperCase();

registrationSchema.pre('save', function (next) {
  // The registration itself always carries a unique ID (this covers
  // individual, visitor, staff, volunteer, organizer — and the group as a
  // whole). Group members each get their own ID below.
  if (!this.ticketId) this.ticketId = genRegId();

  if (Array.isArray(this.members)) {
    for (const m of this.members) {
      if (!m.registrationId) m.registrationId = genRegId();
    }
  }
  next();
});

export default mongoose.models.Registration || mongoose.model('Registration', registrationSchema);
