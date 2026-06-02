// Idempotent admin seeder.
//   node scripts/seed-admins.js
//
// Creates (or refreshes the password / role of) the three admin accounts.
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI missing in .env.local');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  phone: String,
  role: { type: String, default: 'user' },
  isVerified: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const ADMINS = [
  { name: 'Admin',  email: 'admin@anr.com',  password: 'Admin$#123' },
  { name: 'Teja',   email: 'teja@anr.com',   password: 'Teja$#123'  },
  { name: 'Sneha',  email: 'sneha@anr.com',  password: 'Sneha$#123' },
];

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  console.log('✅ Connected:', mongoose.connection.host);

  for (const a of ADMINS) {
    const hashed = await bcrypt.hash(a.password, 10);
    const result = await User.findOneAndUpdate(
      { email: a.email.toLowerCase() },
      {
        $set: {
          name: a.name,
          email: a.email.toLowerCase(),
          password: hashed,
          role: 'admin',
          isVerified: true,
          isBanned: false,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`✅ ${result.email}  (${a.password})  role=${result.role}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
