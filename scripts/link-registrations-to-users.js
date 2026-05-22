/**
 * Link Registrations to User Accounts
 * 
 * This script links existing registrations to user accounts based on email
 * Run with: node scripts/link-registrations-to-users.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Import the actual models
const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
};

async function linkRegistrations() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Use actual models
    const Registration = (await import('../src/lib/models/Registration.js')).default;
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    console.log('\n📝 Finding all registrations...');
    
    // Find ALL registrations
    const allRegs = await Registration.find({});

    console.log(`Found ${allRegs.length} total registrations`);

    let linkedCount = 0;
    let alreadyLinkedCount = 0;
    let notFoundCount = 0;

    for (const reg of allRegs) {
      let userEmail = null;
      let foundUser = null;

      // Get email based on registration type
      if (reg.registrationType === 'individual' || reg.registrationType === 'visitor') {
        userEmail = reg.email;
        if (userEmail) {
          foundUser = await User.findOne({ email: userEmail });
        }
      } else if (reg.registrationType === 'group' && reg.members && reg.members.length > 0) {
        // For groups, try to find a user matching any member email
        for (const member of reg.members) {
          if (member.email) {
            const user = await User.findOne({ email: member.email });
            if (user) {
              foundUser = user;
              userEmail = member.email;
              break;
            }
          }
        }
      }

      if (foundUser) {
        if (reg.user && reg.user.toString() === foundUser._id.toString()) {
          alreadyLinkedCount++;
          console.log(`✓ Already linked: ${reg.ticketId} → ${foundUser.email}`);
        } else {
          reg.user = foundUser._id;
          await reg.save();
          linkedCount++;
          console.log(`✅ Linked: ${reg.ticketId} → ${foundUser.email}`);
        }
      } else {
        notFoundCount++;
        console.log(`✗ No user found for: ${reg.ticketId} (${userEmail || 'no email'})`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Newly linked: ${linkedCount} registrations`);
    console.log(`✓  Already linked: ${alreadyLinkedCount} registrations`);
    console.log(`⚠️  Not linked: ${notFoundCount} registrations`);
    console.log(`📈 Total with user link: ${linkedCount + alreadyLinkedCount} / ${allRegs.length}`);
    console.log('\n✨ Linking completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Linking failed:', error);
    process.exit(1);
  }
}

linkRegistrations();
