import mongoose from 'mongoose';

// An Affiliate is a user enrolled in the referral program. On apply we create
// this record immediately with a unique share code and a working URL; the
// discount buyers get and the commission the affiliate earns both default to
// 0% until an admin configures them in the Affiliation tab.
const affiliateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },

  // Application details (collected on the join form; contact fields are
  // auto-filled from the user's account and editable).
  displayName: String,
  phone: String,
  instagram: String,
  youtube: String,
  otherSocial: String,
  audienceSize: String,
  promoDescription: String,

  // Payout — manual UPI transfer after the 7-day hold. We intentionally only
  // store a UPI ID + name, not full bank credentials.
  payoutUpiId: String,
  payoutName: String,

  // Admin-configured economics.
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },   // buyer discount
  commissionPercent: { type: Number, default: 0, min: 0, max: 100 }, // affiliate earning

  // Denormalized counters (kept in sync as conversions are recorded / paid).
  clicks: { type: Number, default: 0 },
  totalConversions: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },       // sum of net sale amounts attributed
  totalCommission: { type: Number, default: 0 },  // lifetime commission earned
  paidCommission: { type: Number, default: 0 },   // commission already transferred
}, { timestamps: true });

export default mongoose.models.Affiliate || mongoose.model('Affiliate', affiliateSchema);
