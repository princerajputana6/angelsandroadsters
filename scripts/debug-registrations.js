const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Registration = mongoose.model('Registration', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const user = await User.findOne({ email: 'seller@buildify.com' });
  console.log('User ID:', user._id);
  console.log('User ID type:', typeof user._id);
  
  const reg = await Registration.findOne({ ticketId: 'TR-5F6D1362CE40' });
  console.log('\nRegistration user field:', reg.user);
  console.log('Registration user type:', typeof reg.user);
  console.log('Has user field:', !!reg.user);
  
  if (reg.user) {
    console.log('User IDs match:', reg.user.toString() === user._id.toString());
  }
  
  process.exit(0);
}

debug();
