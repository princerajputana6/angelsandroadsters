const { connectDB } = require('./src/lib/db');
const Registration = require('./src/lib/models/Registration');
const Event = require('./src/lib/models/Event');

async function verifyEmail() {
  try {
    await connectDB();
    
    // Get the latest registration
    const registration = await Registration.findOne({ 
      ticketId: 'TR-B6931EA89345' 
    }).lean();
    
    if (!registration) {
      console.log('❌ Registration not found');
      return;
    }
    
    const event = await Event.findById(registration.event).lean();
    
    console.log('✅ Registration Found:');
    console.log('');
    console.log('📋 Basic Info:');
    console.log('- Ticket ID:', registration.ticketId);
    console.log('- Registration Type:', registration.registrationType);
    console.log('- Status:', registration.status);
    console.log('- Amount:', registration.amount);
    console.log('');
    
    console.log('👥 Group Details:');
    console.log('- Group Name:', registration.groupName);
    console.log('- Group Size:', registration.groupSize);
    console.log('- Total Members:', registration.members?.length || 0);
    console.log('');
    
    console.log('📧 Email Recipients:');
    registration.members?.forEach((member, index) => {
      console.log(`  ${index + 1}. ${member.name} - ${member.email}`);
    });
    console.log('');
    
    console.log('🎫 QR Code:');
    if (registration.qrCode) {
      console.log('✓ QR Code Generated');
      console.log('- Length:', registration.qrCode.length, 'characters');
      console.log('- Format:', registration.qrCode.substring(0, 30) + '...');
    } else {
      console.log('✗ QR Code NOT Generated');
    }
    console.log('');
    
    console.log('🎪 Event:');
    console.log('- Name:', event.title);
    console.log('- Location:', event.location.city + ', ' + event.location.state);
    console.log('');
    
    console.log('📬 Email should contain:');
    console.log('✓ QR Code section (always visible)');
    console.log('✓ Group Name:', registration.groupName);
    console.log('✓ Total Members:', registration.members?.length);
    console.log('✓ All participant details listed');
    console.log('✗ NO Group Leader field');
    console.log('✓ Two buttons: "View Registration Details" and "View Ticket"');
    console.log('✓ Contact info: info@angelsandroadsters.com and +91 8384099474');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyEmail();
