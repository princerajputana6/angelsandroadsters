import mongoose from 'mongoose';
import slugify from 'slugify';

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, lowercase: true },
  slug: { type: String, unique: true, index: true },
  title: { type: String, default: '' },          // pretty display title (admin-controlled)
  image: { type: String, default: '' },          // hero image URL for this section
  order: { type: Number, default: 0 },
}, { timestamps: true });

sectionSchema.pre('save', function (next) {
  if (this.isModified('name')) this.slug = slugify(this.name, { lower: true, strict: true });
  next();
});

export default mongoose.models.Section || mongoose.model('Section', sectionSchema);
