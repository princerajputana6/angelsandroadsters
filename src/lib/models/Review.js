import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: String,
  comment: String,
  images: [String],
  helpful: { type: Number, default: 0 },
  verifiedPurchase: { type: Boolean, default: false },
}, { timestamps: true });

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model('Review', reviewSchema);
