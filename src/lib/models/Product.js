import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  description: { type: String, required: true },
  richDescription: String,
  brand: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategory: String,
  price: { type: Number, required: true, min: 0 },
  discountedPrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  images: [String],
  thumbnail: String,
  specifications: { type: Map, of: String },
  sizes: [String],
  colors: [String],
  tags: [String],
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  // Tax info (admin-controlled per-product)
  tax: {
    rate: { type: Number, default: 0, min: 0 },         // e.g. 18 = 18%
    included: { type: Boolean, default: true },          // price already includes tax
    note: { type: String, default: '' },                 // e.g. "Inclusive of GST"
  },
  // Return policy
  returnPolicy: {
    available: { type: Boolean, default: true },
    days: { type: Number, default: 30, min: 0 },         // return window
    note: { type: String, default: '' },                 // e.g. "Unused, original tags"
  },
  // Delivery options
  delivery: {
    free: { type: Boolean, default: false },             // free shipping for this product
    fee: { type: Number, default: 0, min: 0 },           // applied when not free
    etaDays: { type: Number, default: 0, min: 0 },       // estimated delivery (days)
    note: { type: String, default: '' },                 // e.g. "Ships from Bangalore"
  },
}, { timestamps: true });

productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }
  next();
});

productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });

export default mongoose.models.Product || mongoose.model('Product', productSchema);
