// Adds (or updates) the flagship Trailstorm event without touching other data.
// Run: node scripts/add-trailstorm.js
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI missing in .env.local');
  process.exit(1);
}

const eventSchema = new mongoose.Schema({
  title: String, slug: { type: String, unique: true }, description: String,
  coverImage: String, gallery: [String], eventType: String,
  location: { venue: String, city: String, state: String, coordinates: { lat: Number, lng: Number } },
  startDate: Date, endDate: Date, registrationDeadline: Date, earlyBirdDeadline: Date,
  capacity: { individual: Number, group: Number, visitor: Number },
  pricing: {
    individual: Number, individualEarlyBird: Number,
    groupBase: Number, groupEarlyBird: Number, groupPerHead: Number,
    visitor: Number, visitorEarlyBird: Number,
  },
  schedule: [{ time: String, activity: String, speaker: String }],
  highlights: [String], eligibility: String,
  sponsors: [{ name: String, logo: String, link: String }],
  isPublished: { type: Boolean, default: true }, tags: [String],
  isFlagship: { type: Boolean, default: false },
}, { timestamps: true });

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

const SLUG = '2026-jaisalmer-trailstorm-event';

const data = {
  title: 'Trailstorm 2026 — Jaisalmer desert Edition',
  slug: SLUG,
  description: `Trailstorm is the flagship Angels & Roadsters event — a 5-day desert riding & adventure festival in the heart of Jaisalmer.

Sand dunes, sunrise rides, camel-trail expeditions, riverbed off-roading, live music nights under a thousand stars, and the largest gathering of riders and travelers in Rajasthan.

Whether you ride in solo, roll deep with your crew, or come as a visitor to soak it all in — Trailstorm is built for stories that outlive the miles.`,
  coverImage: 'https://images.unsplash.com/photo-1542367592-8849eb950fd8?w=1920',
  gallery: [
    'https://images.unsplash.com/photo-1605649461784-8c0c1a04d18d?w=1600',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600',
  ],
  eventType: 'expedition',
  location: {
    venue: 'Sam Sand Dunes Base Camp',
    city: 'Jaisalmer',
    state: 'Rajasthan',
    coordinates: { lat: 26.9157, lng: 70.9083 },
  },
  startDate: new Date('2026-10-30'),
  endDate: new Date('2026-10-31'),
  registrationDeadline: new Date('2026-10-15'),
  earlyBirdDeadline: new Date('2026-06-30T23:59:59'),
  capacity: { individual: 300, group: 40, visitor: 2000 },
  // Real pricing for production
  pricing: {
    individual: 4000,
    individualEarlyBird: 3200,
    groupBase: 10000,
    groupEarlyBird: 8000,
    groupPerHead: 0,
    visitor: 800,          // per day
    visitorEarlyBird: 600, // per day
  },
  schedule: [
    { time: 'Day 1 · 6 AM',  activity: 'Convoy roll-out from Jaisalmer Fort', speaker: 'Lead marshal: Karan' },
    { time: 'Day 1 · 5 PM',  activity: 'Welcome bonfire + opening ceremony', speaker: 'Founders' },
    { time: 'Day 2 · 5 AM',  activity: 'Sunrise dune ride', speaker: 'All groups' },
    { time: 'Day 2 · 8 PM',  activity: 'Live Rajasthani folk + Indie set', speaker: 'Open stage' },
    { time: 'Day 3 · 7 AM',  activity: 'Off-road expedition — Khaba Fort trail', speaker: 'Expert track' },
    { time: 'Day 4 · 10 AM', activity: 'Gear expo + brand booths', speaker: '60+ brands' },
    { time: 'Day 4 · 9 PM',  activity: 'Trailstorm awards night', speaker: 'Crew' },
    { time: 'Day 5 · 7 AM',  activity: 'Sendoff ride to Longewala', speaker: 'Optional' },
  ],
  highlights: [
    '5 days · 4 nights in the Thar Desert',
    'Three ride tracks: Touring, Expert Off-road, Visitor convoy',
    'Live music, bonfires & desert camps',
    '60+ adventure brand booths at the Trailstorm Expo',
    'Daily mechanical support & medical crew',
    'Member-only after-parties under the stars',
    'Exclusive Trailstorm merch drop on arrival',
  ],
  eligibility: 'Open to riders 18+, valid license required for ride tracks. Visitors of all ages welcome.',
  sponsors: [],
  isPublished: true,
  isFlagship: true,
  tags: ['flagship', 'trailstorm', 'jaisalmer', 'desert', 'rally', 'expedition'],
};

(async () => {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  console.log('✅ Connected:', mongoose.connection.host);

  // Clean up the old misspelled slugs if they exist
  const old = await Event.deleteMany({ slug: { $in: ['2026-jaisailmer-trailstorme-event', '2026-jaisailmer-trailstorm-event'] } });
  if (old.deletedCount) console.log(`🧹 Removed ${old.deletedCount} legacy misspelled record(s)`);

  const existing = await Event.findOne({ slug: SLUG });
  if (existing) {
    await Event.updateOne({ slug: SLUG }, { $set: data });
    console.log(`♻️  Updated Trailstorm event (${SLUG})`);
  } else {
    await Event.create(data);
    console.log(`✨ Created Trailstorm event (${SLUG})`);
  }

  console.log(`   URL: /trailstorm/${SLUG}`);
  await mongoose.disconnect();
})().catch((err) => { console.error(err); process.exit(1); });
