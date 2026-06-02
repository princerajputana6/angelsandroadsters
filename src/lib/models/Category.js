import mongoose from 'mongoose';
import slugify from 'slugify';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, unique: true, index: true },
  parent: { type: String, enum: ['travelling', 'riding'], required: true },
  // Hierarchical parent — null/absent means this is a top-level category,
  // otherwise this row is a sub-category of the referenced Category.
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  description: String,
  icon: String,
  image: String,
  order: { type: Number, default: 0 },
}, { timestamps: true });

categorySchema.pre('save', function (next) {
  if (this.isModified('name')) this.slug = slugify(this.name, { lower: true, strict: true });
  next();
});

export default mongoose.models.Category || mongoose.model('Category', categorySchema);
