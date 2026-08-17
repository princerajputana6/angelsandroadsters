import mongoose from 'mongoose';

// One record per sale attributed to an affiliate. Created when a sale is
// confirmed (payment verified, or COD order placed). Commission becomes
// payable after a 7-day hold (eligibleAt); an admin marks it paid after the
// manual UPI transfer.
const conversionSchema = new mongoose.Schema({
  affiliate: { type: mongoose.Schema.Types.ObjectId, ref: 'Affiliate', required: true, index: true },
  code: { type: String, index: true },
  kind: { type: String, enum: ['registration', 'order'], required: true },

  // Exactly one of these is set depending on `kind`. Unique (sparse) so a
  // given sale can only ever produce one conversion.
  registration: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', unique: true, sparse: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', unique: true, sparse: true },

  buyerUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  buyerName: String,
  buyerEmail: String,

  saleAmount: { type: Number, default: 0 },       // net amount the buyer paid
  discountAmount: { type: Number, default: 0 },   // discount the affiliate link gave
  commissionPercent: { type: Number, default: 0 },
  commissionAmount: { type: Number, default: 0 },

  status: { type: String, enum: ['pending', 'paid', 'reversed'], default: 'pending', index: true },
  eligibleAt: { type: Date },   // createdAt + 7 days
  paidAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.AffiliateConversion || mongoose.model('AffiliateConversion', conversionSchema);
