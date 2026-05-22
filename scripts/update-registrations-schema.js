/**
 * Migration Script: Update Existing Registrations
 * 
 * This script adds profileCompleted field to existing registrations
 * Run with: node scripts/update-registrations-schema.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Registration = mongoose.model('Registration', new mongoose.Schema({}, { strict: false }));

    // Update all existing registrations
    console.log('\n📝 Updating registrations...');
    
    const result = await Registration.updateMany(
      { profileCompleted: { $exists: false } },
      { $set: { profileCompleted: false } }
    );

    console.log(`✅ Updated ${result.modifiedCount} registrations`);

    // Update all existing members in group registrations
    console.log('\n📝 Updating group members...');
    
    const groupRegs = await Registration.find({ 
      registrationType: 'group',
      'members.0': { $exists: true }
    });

    let memberCount = 0;
    for (const reg of groupRegs) {
      let updated = false;
      reg.members.forEach(member => {
        if (member.profileCompleted === undefined) {
          member.profileCompleted = false;
          updated = true;
          memberCount++;
        }
      });
      if (updated) {
        await reg.save();
      }
    }

    console.log(`✅ Updated ${memberCount} group members`);

    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
