/**
 * One-time backfill: give every group member (and any registration missing a
 * ticketId) a unique registration ID.
 *
 * Group registrations created before per-member IDs existed have members
 * without a `registrationId`. Resort booking needs each member to have their
 * own ID, so this fills the gaps. Safe to re-run (idempotent) — it only
 * touches records that are missing an ID.
 *
 * Run with: node scripts/backfill-member-ids.js
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI missing in .env.local');
  process.exit(1);
}

const genId = () => 'TR-' + crypto.randomBytes(6).toString('hex').toUpperCase();

async function run() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  const Registration = mongoose.model('Registration', new mongoose.Schema({}, { strict: false }));

  // Collect every ID already in use so new ones can't collide.
  const used = new Set();
  const all = await Registration.find({}, { ticketId: 1, 'members.registrationId': 1 }).lean();
  for (const r of all) {
    if (r.ticketId) used.add(String(r.ticketId).toUpperCase());
    for (const m of r.members || []) {
      if (m.registrationId) used.add(String(m.registrationId).toUpperCase());
    }
  }
  const freshId = () => {
    let id = genId();
    while (used.has(id.toUpperCase())) id = genId();
    used.add(id.toUpperCase());
    return id;
  };

  // 1) Any registration missing its own ticketId (should be rare).
  console.log('\n📝 Backfilling registration ticketIds...');
  const missingTicket = await Registration.find({ $or: [{ ticketId: { $exists: false } }, { ticketId: null }, { ticketId: '' }] });
  let ticketFixed = 0;
  for (const reg of missingTicket) {
    await Registration.updateOne({ _id: reg._id }, { $set: { ticketId: freshId() } });
    ticketFixed++;
  }
  console.log(`   ✅ ${ticketFixed} registration(s) given a ticketId`);

  // 2) Group members missing a registrationId.
  console.log('\n📝 Backfilling group member IDs...');
  const groups = await Registration.find({ registrationType: 'group', 'members.0': { $exists: true } });
  let groupsTouched = 0;
  let membersFixed = 0;
  for (const reg of groups) {
    let changed = false;
    for (const member of reg.members) {
      if (!member.registrationId) {
        member.registrationId = freshId();
        membersFixed++;
        changed = true;
      }
    }
    if (changed) {
      reg.markModified('members');
      await reg.save();
      groupsTouched++;
    }
  }
  console.log(`   ✅ ${membersFixed} member(s) across ${groupsTouched} group(s) given a registration ID`);

  console.log('\n🎉 Done.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('❌ Backfill failed:', err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
