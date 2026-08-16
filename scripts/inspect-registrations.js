/**
 * Read-only diagnostic: shows which DB we connected to and the shape of the
 * registration data (types, group members, whether member IDs exist).
 * Nothing is modified.
 *
 * Run with: node scripts/inspect-registrations.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI missing in .env.local');
  process.exit(1);
}

// Redact credentials before printing the connection string.
const safeUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

async function run() {
  console.log('🔗 URI     :', safeUri);
  await mongoose.connect(MONGODB_URI);
  console.log('✅ DB name :', mongoose.connection.name);

  const Reg = mongoose.model('Registration', new mongoose.Schema({}, { strict: false }));

  const total = await Reg.countDocuments({});
  console.log(`\n📊 Total registrations: ${total}`);

  const byType = await Reg.aggregate([
    { $group: { _id: '$registrationType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  console.log('\nBy registrationType:');
  byType.forEach((t) => console.log(`   ${t._id ?? '(none)'} : ${t.count}`));

  const groups = await Reg.find({ registrationType: 'group' }).lean();
  const withMembers = groups.filter((g) => Array.isArray(g.members) && g.members.length > 0);
  let totalMembers = 0, withId = 0, withoutId = 0;
  for (const g of withMembers) {
    for (const m of g.members) {
      totalMembers++;
      if (m.registrationId) withId++; else withoutId++;
    }
  }
  console.log(`\nGroups: ${groups.length} total · ${withMembers.length} have a members[] array`);
  console.log(`Members: ${totalMembers} total · ${withId} already have an ID · ${withoutId} missing an ID`);

  const sample = withMembers[0] || groups[0];
  if (sample) {
    console.log('\nSample group document keys:', Object.keys(sample).join(', '));
    if (Array.isArray(sample.members)) {
      console.log('First member keys       :', Object.keys(sample.members[0] || {}).join(', ') || '(no members)');
    }
    console.log('groupSize field         :', sample.groupSize);
  } else {
    console.log('\n(No group registrations found at all.)');
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('❌ Inspect failed:', err.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
