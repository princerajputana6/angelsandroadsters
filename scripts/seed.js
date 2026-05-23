// Seed script: node scripts/seed.js
// Loads .env.local, connects, and inserts admin/user, categories, products, events.
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI missing in .env.local');
  process.exit(1);
}

// Inline schemas (mirror models/) so this script runs without next-loader
const userSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true, lowercase: true }, password: String,
  phone: String, role: { type: String, default: 'user' }, isVerified: { type: Boolean, default: true },
}, { timestamps: true });
const categorySchema = new mongoose.Schema({
  name: { type: String, unique: true }, slug: { type: String, unique: true },
  parent: String, description: String,
}, { timestamps: true });
const productSchema = new mongoose.Schema({
  name: String, slug: { type: String, unique: true }, description: String,
  brand: String, category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subCategory: String, price: Number, discountedPrice: Number, stock: Number,
  images: [String], thumbnail: String, specifications: { type: Map, of: String },
  sizes: [String], colors: [String], tags: [String],
  ratings: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
  isFeatured: { type: Boolean, default: false }, isActive: { type: Boolean, default: true },
}, { timestamps: true });
const eventSchema = new mongoose.Schema({
  title: String, slug: { type: String, unique: true }, description: String,
  coverImage: String, gallery: [String], eventType: String,
  location: { venue: String, city: String, state: String, coordinates: { lat: Number, lng: Number } },
  startDate: Date, endDate: Date, registrationDeadline: Date,
  capacity: { individual: Number, group: Number, visitor: Number },
  pricing: { individual: Number, groupBase: Number, groupPerHead: Number, visitor: Number },
  schedule: [{ time: String, activity: String, speaker: String }],
  highlights: [String], isPublished: { type: Boolean, default: true }, tags: [String],
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

const slug = (s) => slugify(s, { lower: true, strict: true });

async function main() {
  console.log('Connecting...');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  console.log('✅ Connected:', mongoose.connection.host);

  console.log('Clearing existing seed data...');
  await Promise.all([User.deleteMany({}), Category.deleteMany({}), Product.deleteMany({}), Event.deleteMany({})]);

  // Users
  const adminPwd = await bcrypt.hash('admin123', 10);
  const userPwd = await bcrypt.hash('user12345', 10);
  const [admin, demoUser] = await User.insertMany([
    { name: 'Admin', email: 'admin@trylinqr.com', password: adminPwd, role: 'admin' },
    { name: 'Demo Rider', email: 'rider@trylinqr.com', password: userPwd, role: 'user' },
  ]);
  console.log('✅ Users:', admin.email, '(admin123) /', demoUser.email, '(user12345)');

  // Categories
  const catData = [
    { name: 'Helmets', parent: 'riding' },
    { name: 'Riding Jackets', parent: 'riding' },
    { name: 'Gloves & Boots', parent: 'riding' },
    { name: 'Bike Accessories', parent: 'riding' },
    { name: 'Backpacks & Bags', parent: 'travelling' },
    { name: 'Tents & Camping', parent: 'travelling' },
    { name: 'Navigation', parent: 'travelling' },
    { name: 'Hydration', parent: 'travelling' },
  ];
  const cats = await Category.insertMany(catData.map((c) => ({ ...c, slug: slug(c.name) })));
  const catBy = (n) => cats.find((c) => c.name === n);
  console.log('✅ Categories:', cats.length);

  // Products
  const productSeed = [
    { name: 'AeroShield Full Face Helmet', category: 'Helmets', brand: 'TerraGear', price: 8999, discountedPrice: 7499, stock: 25, isFeatured: true, image: 'https://images.unsplash.com/photo-1591286083881-c156b6c7a5b3?w=800', desc: 'DOT-certified full-face helmet with anti-fog visor and aero ventilation.', sizes: ['S','M','L','XL'] },
    { name: 'Stormrider Riding Jacket', category: 'Riding Jackets', brand: 'TerraGear', price: 12999, stock: 18, isFeatured: true, image: 'https://images.unsplash.com/photo-1591025207163-942350e47db2?w=800', desc: 'Waterproof, CE Level 2 armoured riding jacket built for monsoon tours.', sizes: ['M','L','XL'] },
    { name: 'Vortex Knuckle Gloves', category: 'Gloves & Boots', brand: 'GripCo', price: 2499, discountedPrice: 1999, stock: 50, image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800', desc: 'Knuckle-protected gloves with touchscreen index finger.', sizes: ['S','M','L','XL'] },
    { name: 'Trail50 Adventure Backpack', category: 'Backpacks & Bags', brand: 'TerraPack', price: 5499, stock: 30, isFeatured: true, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', desc: '50L hydration-ready trekking pack with rain cover.' },
    { name: 'Summit2 4-Season Tent', category: 'Tents & Camping', brand: 'BaseCamp', price: 17999, stock: 8, isFeatured: true, image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800', desc: '2-person 4-season tent with reinforced poles for high-altitude camps.' },
    { name: 'PathFinder GPS Tracker', category: 'Navigation', brand: 'NaviX', price: 8499, stock: 15, image: 'https://images.unsplash.com/photo-1535378620166-273708d44e4c?w=800', desc: 'Rugged GPS unit with offline maps and 40hr battery.' },
    { name: 'HydroFlow 3L Hydration Pack', category: 'Hydration', brand: 'HydroX', price: 1899, stock: 100, image: 'https://images.unsplash.com/photo-1574027542338-98e751016b1d?w=800', desc: 'Leak-proof 3L bladder with insulated tube. BPA-free.' },
    { name: 'TitanGuard Knee Armor', category: 'Bike Accessories', brand: 'TerraGear', price: 3499, stock: 40, image: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800', desc: 'CE Level 1 hard-shell knee/shin armor for off-road riders.', sizes: ['M','L','XL'] },
  ];

  const products = await Product.insertMany(productSeed.map((p) => ({
    name: p.name,
    slug: slug(p.name) + '-' + Math.random().toString(36).slice(2, 6),
    description: p.desc,
    brand: p.brand,
    category: catBy(p.category)._id,
    price: p.price,
    discountedPrice: p.discountedPrice,
    stock: p.stock,
    thumbnail: p.image,
    images: [p.image],
    sizes: p.sizes || [],
    tags: [p.category.toLowerCase()],
    isFeatured: !!p.isFeatured,
    ratings: { average: 4 + Math.random(), count: Math.floor(Math.random() * 80) + 5 },
  })));
  console.log('✅ Products:', products.length);

  // Events
  const eventSeed = [
    {
      title: 'Himalayan Sunrise Rally 2026',
      eventType: 'rally',
      desc: 'A 5-day high-altitude motorcycle rally from Manali to Leh — twisting roads, mountain passes, and unforgettable sunsets.',
      cover: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1600',
      city: 'Manali', state: 'Himachal Pradesh',
      start: '2026-06-15', end: '2026-06-19',
      priceIndiv: 4000, priceGroupBase: 10000, priceGroupPerHead: 0, priceVisitor: 800,
      highlights: ['Rohtang Pass crossing', 'Lake Pangong campout', 'Expert ride marshals', 'Mechanical support', 'Daily group dinners'],
    },
    {
      title: 'Western Ghats Monsoon Trek',
      eventType: 'trek',
      desc: 'A 3-day monsoon trek through misty Western Ghats. Waterfalls, valleys, and the kind of green that resets your year.',
      cover: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600',
      city: 'Munnar', state: 'Kerala',
      start: '2026-07-22', end: '2026-07-24',
      priceIndiv: 4000, priceGroupBase: 10000, priceGroupPerHead: 0, priceVisitor: 800,
      highlights: ['Forest stays', 'Local guides', 'All meals included', 'Trekking gear provided'],
    },
    {
      title: 'TerraRider Gear Expo Bangalore',
      eventType: 'expo',
      desc: 'India\'s biggest adventure gear expo — 80+ brands, ride workshops, gear giveaways, and live demos.',
      cover: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600',
      city: 'Bangalore', state: 'Karnataka',
      start: '2026-08-10', end: '2026-08-12',
      priceIndiv: 4000, priceGroupBase: 10000, priceGroupPerHead: 0, priceVisitor: 800,
      highlights: ['80+ brand booths', 'Live gear testing', 'Industry talks', 'Door prizes'],
    },
  ];

  const events = await Event.insertMany(eventSeed.map((e) => ({
    title: e.title,
    slug: slug(e.title) + '-' + Math.random().toString(36).slice(2, 6),
    description: e.desc,
    eventType: e.eventType,
    coverImage: e.cover,
    location: { venue: 'Various', city: e.city, state: e.state },
    startDate: new Date(e.start), endDate: new Date(e.end),
    capacity: { individual: 150, group: 25, visitor: 1000 },
    pricing: {
      individual: e.priceIndiv,
      groupBase: e.priceGroupBase,
      groupPerHead: e.priceGroupPerHead,
      visitor: e.priceVisitor,
    },
    highlights: e.highlights,
    isPublished: true,
  })));
  console.log('✅ Events:', events.length);

  console.log('\n✨ Seed complete!');
  console.log('   Admin: admin@trylinqr.com / admin123');
  console.log('   User:  rider@trylinqr.com / user12345');
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
