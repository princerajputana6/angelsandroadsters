import mongoose from 'mongoose';
import slugify from 'slugify';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, unique: true, index: true },
  // Free-form section/group (e.g. 'riding', 'travelling', or any admin-defined section)
  parent: { type: String, required: true, trim: true, lowercase: true },
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
