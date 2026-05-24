import mongoose from 'mongoose';
import slugify from 'slugify';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  featuredImage: { type: String, required: true },
  images: [String],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['Adventure', 'Gear', 'Travel', 'Community', 'Events', 'Tips'], default: 'Adventure' },
  tags: [String],
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  publishedAt: Date,
  views: { type: Number, default: 0 },
  readTime: { type: Number, default: 5 },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
  },
  isAIGenerated: { type: Boolean, default: false },
}, { timestamps: true });

blogSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  if (this.isModified('content')) {
    const words = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(words / 200);
  }
  next();
});

blogSchema.index({ title: 'text', excerpt: 'text', content: 'text', tags: 'text' });

export default mongoose.models.Blog || mongoose.model('Blog', blogSchema);
