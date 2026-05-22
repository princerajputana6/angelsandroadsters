import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
  },
});

const FROM_EMAIL = process.env.EMAIL_FROM || process.env.EMAIL_USER;
const COMPANY_NAME = 'Angels & Roadsters';
const COMPANY_WEBSITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://angelsandroadsters.com';

export async function sendEmail({ to, subject, html, text }) {
  try {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
      console.warn('[Email] Email not configured. Skipping email send.');
      return { success: false, message: 'Email not configured' };
    }

    const info = await transporter.sendMail({
      from: `"${COMPANY_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    console.log('[Email] Sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function sendOrderConfirmation({ order, userEmail, userName }) {
  const subject = `Order Confirmation #${order.orderId || order._id}`;
  
  const itemsList = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong><br>
        <small>Qty: ${item.quantity} ${item.size ? `| Size: ${item.size}` : ''} ${item.color ? `| Color: ${item.color}` : ''}</small>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ₹${(item.price * item.quantity).toLocaleString()}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your order, ${userName}!</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #d97706;">Order Details</h2>
          <p><strong>Order ID:</strong> ${order.orderId || order._id}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod?.toUpperCase() || 'COD'}</p>
          <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">${order.status || 'Placed'}</span></p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #d97706;">Items Ordered</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsList}
            <tr>
              <td style="padding: 10px; padding-top: 15px;"><strong>Items Total:</strong></td>
              <td style="padding: 10px; padding-top: 15px; text-align: right;"><strong>₹${order.itemsPrice?.toLocaleString()}</strong></td>
            </tr>
            <tr>
              <td style="padding: 10px;">Shipping:</td>
              <td style="padding: 10px; text-align: right;">₹${order.shippingPrice?.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px;">Tax (GST):</td>
              <td style="padding: 10px; text-align: right;">₹${order.taxPrice?.toLocaleString()}</td>
            </tr>
            <tr style="border-top: 2px solid #d97706;">
              <td style="padding: 15px 10px;"><strong style="font-size: 18px;">Total:</strong></td>
              <td style="padding: 15px 10px; text-align: right;"><strong style="font-size: 18px; color: #d97706;">₹${order.totalPrice?.toLocaleString()}</strong></td>
            </tr>
          </table>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #d97706;">Shipping Address</h2>
          <p style="margin: 5px 0;">${order.shippingAddress?.fullName || userName}</p>
          <p style="margin: 5px 0;">${order.shippingAddress?.address}</p>
          <p style="margin: 5px 0;">${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.pincode}</p>
          <p style="margin: 5px 0;">Phone: ${order.shippingAddress?.phone}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${COMPANY_WEBSITE}/dashboard/orders" style="display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Track Your Order</a>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 14px;">
          <p>Need help? Contact us at <a href="mailto:info@angelsandroadsters.com" style="color: #d97706;">info@angelsandroadsters.com</a></p>
          <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: userEmail, subject, html });
}

export async function sendOrderStatusUpdate({ order, userEmail, userName, newStatus, note }) {
  const statusEmojis = {
    placed: '📦',
    confirmed: '✅',
    processing: '⚙️',
    shipped: '🚚',
    delivered: '🎉',
    cancelled: '❌',
  };

  const subject = `Order ${statusEmojis[newStatus] || '📦'} ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} - #${order.orderId || order._id}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Order Update ${statusEmojis[newStatus] || '📦'}</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Hi ${userName}, your order status has been updated!</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #d97706;">Order #${order.orderId || order._id}</h2>
          <p style="font-size: 18px;"><strong>New Status:</strong> <span style="color: #059669; font-weight: bold;">${newStatus.toUpperCase()}</span></p>
          ${note ? `<p style="background: #fef3c7; padding: 15px; border-left: 4px solid #d97706; border-radius: 4px; margin-top: 15px;"><strong>Note:</strong> ${note}</p>` : ''}
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #d97706;">Order Summary</h3>
          <p><strong>Total Amount:</strong> ₹${order.totalPrice?.toLocaleString()}</p>
          <p><strong>Items:</strong> ${order.items?.length || 0} item(s)</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${COMPANY_WEBSITE}/dashboard/orders" style="display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Order Details</a>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 14px;">
          <p>Need help? Contact us at <a href="mailto:info@angelsandroadsters.com" style="color: #d97706;">info@angelsandroadsters.com</a></p>
          <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: userEmail, subject, html });
}

export async function sendEventRegistrationConfirmation({ registration, event, userEmail, userName }) {
  const eventName = event.title || event.name;
  const eventNameWithDesert = eventName.replace('Edition', 'Desert Edition');
  const subject = `Event Registration Confirmed - ${eventNameWithDesert}`;

  // Build participant details list
  let participantsList = '';
  if (registration.registrationType === 'group' && registration.members?.length > 0) {
    participantsList = registration.members.map((member, index) => `
      <div style="padding: 10px; border-bottom: 1px solid #f0f0f0;">
        <p style="margin: 5px 0;"><strong>Participant ${index + 1}:</strong> ${member.name || 'N/A'}</p>
        ${member.email ? `<p style="margin: 5px 0; font-size: 13px; color: #666;">Email: ${member.email}</p>` : ''}
        ${member.phone ? `<p style="margin: 5px 0; font-size: 13px; color: #666;">Phone: ${member.phone}</p>` : ''}
        ${member.bikeDetails ? `<p style="margin: 5px 0; font-size: 13px; color: #666;">Bike: ${member.bikeDetails}</p>` : ''}
      </div>
    `).join('');
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Registration Confirmed!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">You're all set for ${eventNameWithDesert}!</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #d97706;">Event Details</h2>
          <p><strong>Event:</strong> ${eventNameWithDesert}</p>
          <p><strong>Ticket ID:</strong> ${registration.ticketId}</p>
          <p><strong>Registration Type:</strong> ${registration.registrationType?.toUpperCase()}</p>
          <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })} - ${new Date(event.endDate).toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p><strong>Location:</strong> ${event.location?.city}, ${event.location?.state}</p>
          ${registration.amount > 0 ? `<p><strong>Amount:</strong> ₹${registration.amount?.toLocaleString()}</p>` : ''}
          <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">${registration.status?.toUpperCase()}</span></p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h3 style="margin-top: 0; color: #d97706;">Your Event Pass</h3>
          <p style="color: #666; font-size: 14px;">Complete your profile to view your QR code</p>
          <div style="margin: 20px 0;">
            <a href="${COMPANY_WEBSITE}/booking/${registration.ticketId}" style="display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Complete Profile to View QR</a>
          </div>
          <p style="font-size: 12px; color: #999;">Ticket ID: ${registration.ticketId}</p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #d97706;">Participant Information</h3>
          ${registration.registrationType === 'group' && registration.groupName ? `
            <p><strong>Group Name:</strong> ${registration.groupName}</p>
            <p><strong>Total Members:</strong> ${registration.members?.length || 0}</p>
            <div style="margin-top: 15px;">
              ${participantsList}
            </div>
          ` : `
            <p><strong>Name:</strong> ${registration.name}</p>
            <p><strong>Email:</strong> ${registration.email}</p>
            <p><strong>Phone:</strong> ${registration.phone}</p>
            ${registration.age ? `<p><strong>Age:</strong> ${registration.age}</p>` : ''}
            ${registration.bikeDetails ? `<p><strong>Bike:</strong> ${registration.bikeDetails}</p>` : ''}
            ${registration.experienceLevel ? `<p><strong>Experience:</strong> ${registration.experienceLevel}</p>` : ''}
            ${registration.emergencyContact ? `<p><strong>Emergency Contact:</strong> ${registration.emergencyContact}</p>` : ''}
            ${registration.visitorCount ? `<p><strong>Tickets:</strong> ${registration.visitorCount}</p>` : ''}
            ${registration.visitDays?.length ? `<p><strong>Pass:</strong> ${registration.visitDays.map(d => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })).join(', ')}</p>` : ''}
          `}
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${COMPANY_WEBSITE}/dashboard/registrations" style="display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px;">View Registration Details</a>
          <a href="${COMPANY_WEBSITE}/booking/${registration.ticketId}" style="display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px;">Complete Profile</a>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #d97706; border-radius: 4px; margin-top: 20px;">
          <p style="margin: 0; font-size: 14px;"><strong>Important:</strong> Please save this email and bring a printed or digital copy of your QR code to the event.</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 10px 0; font-size: 15px;"><strong>For any enquiry, feel free to reach us:</strong></p>
          <p style="margin: 5px 0;">
            <a href="mailto:info@angelsandroadsters.com" style="color: #d97706; text-decoration: none;">info@angelsandroadsters.com</a>
          </p>
          <p style="margin: 5px 0;">
            <a href="tel:+918384099474" style="color: #d97706; text-decoration: none;">+91 8384099474</a>
          </p>
          <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: userEmail, subject, html });
}

export async function sendEventRegistrationUpdate({ registration, event, userEmail, userName, newStatus, note }) {
  const eventName = event.title || event.name;
  const statusEmojis = {
    pending: '⏳',
    confirmed: '✅',
    attended: '🎉',
    cancelled: '❌',
  };

  const subject = `Event Registration ${statusEmojis[newStatus] || '📋'} ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} - ${eventName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Registration Update ${statusEmojis[newStatus] || '📋'}</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Hi ${userName}, your registration status has been updated!</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #d97706;">${eventName}</h2>
          <p><strong>Ticket ID:</strong> ${registration.ticketId}</p>
          <p style="font-size: 18px;"><strong>New Status:</strong> <span style="color: #059669; font-weight: bold;">${newStatus.toUpperCase()}</span></p>
          ${note ? `<p style="background: #fef3c7; padding: 15px; border-left: 4px solid #d97706; border-radius: 4px; margin-top: 15px;"><strong>Note:</strong> ${note}</p>` : ''}
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${COMPANY_WEBSITE}/dashboard/registrations" style="display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Registration Details</a>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 14px;">
          <p>Need help? Contact us at <a href="mailto:info@angelsandroadsters.com" style="color: #d97706;">info@angelsandroadsters.com</a></p>
          <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: userEmail, subject, html });
}
