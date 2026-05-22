/**
 * Check User Registrations
 * 
 * This script shows all registrations for each user
 * Run with: node scripts/check-user-registrations.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkRegistrations() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Registration = mongoose.model('Registration', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    // Get all users
    const users = await User.find({}).select('email name').lean();
    console.log(`📊 Found ${users.length} users\n`);

    for (const user of users) {
      console.log(`\n👤 User: ${user.email} (${user.name || 'No name'})`);
      console.log('─'.repeat(60));

      // Find registrations by user ID
      const regsByUserId = await Registration.find({ user: user._id }).lean();
      console.log(`  By User ID: ${regsByUserId.length} registrations`);

      // Find registrations by email
      const regsByEmail = await Registration.find({ email: user.email }).lean();
      console.log(`  By Email: ${regsByEmail.length} registrations`);

      // Find registrations by member email (for groups)
      const regsByMemberEmail = await Registration.find({ 'members.email': user.email }).lean();
      console.log(`  By Member Email: ${regsByMemberEmail.length} registrations`);

      // Combined query (what the API uses)
      const regsTotal = await Registration.find({
        $or: [
          { user: user._id },
          { email: user.email },
          { 'members.email': user.email }
        ]
      }).lean();
      console.log(`  ✅ TOTAL (API will show): ${regsTotal.length} registrations`);

      if (regsTotal.length > 0) {
        console.log('\n  Ticket IDs:');
        regsTotal.forEach(reg => {
          console.log(`    - ${reg.ticketId} (${reg.registrationType})`);
        });
      }
    }

    console.log('\n\n📋 All Registrations Summary:');
    console.log('─'.repeat(60));
    const allRegs = await Registration.find({}).lean();
    console.log(`Total registrations: ${allRegs.length}`);
    console.log(`With user link: ${allRegs.filter(r => r.user).length}`);
    console.log(`Without user link: ${allRegs.filter(r => !r.user).length}`);

    console.log('\n✨ Check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

checkRegistrations();
