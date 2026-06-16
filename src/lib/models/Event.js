import mongoose from 'mongoose';
import slugify from 'slugify';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  description: { type: String, required: true },
  coverImage: String,
  gallery: [String],
  galleryTitle: { type: String, default: '' },
  brands: [String],
  brandsTitle: { type: String, default: '' },
  eventType: { type: String, enum: ['rally', 'trek', 'expedition', 'expo', 'workshop', 'meetup'], required: true },
  location: {
    venue: String,
    city: String,
    state: String,
    coordinates: { lat: Number, lng: Number },
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  registrationDeadline: Date,
  capacity: {
    individual: { type: Number, default: 100 },
    group: { type: Number, default: 20 },
    visitor: { type: Number, default: 500 },
  },
  pricing: {
    individual: { type: Number, default: 0 },
    groupBase: { type: Number, default: 0 },
    groupPerHead: { type: Number, default: 0 },
    visitor: { type: Number, default: 0 },
  },
  schedule: [{ time: String, activity: String, speaker: String }],
  eligibility: String,
  highlights: [String],
  sponsors: [{ name: String, logo: String, link: String }],
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished: { type: Boolean, default: true },
  tags: [String],
}, { timestamps: true });

eventSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }
  next();
});

export default mongoose.models.Event || mongoose.model('Event', eventSchema);
