import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['percent', 'flat'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  maxUses: { type: Number, default: 0 }, // 0 = unlimited
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  // Optional scope — empty means applies to all
  applicableTo: [{ type: String, enum: ['individual', 'group', 'visitor'] }],
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
}, { timestamps: true });

export default mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
