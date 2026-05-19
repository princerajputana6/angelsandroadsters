# Email Notification Setup Guide

This application sends automated email notifications for orders and event registrations. Follow this guide to configure email functionality.

## Email Features

### Order Notifications
- **Order Confirmation**: Sent immediately when a user places an order
- **Order Status Updates**: Sent when admin updates order status (confirmed, processing, shipped, delivered, cancelled)

### Event Registration Notifications
- **Registration Confirmation**: Sent when user registers for an event (includes QR code)
- **Registration Status Updates**: Sent when admin updates registration status (confirmed, attended, cancelled)

## Configuration

### 1. Environment Variables

Add the following variables to your `.env.local` file:

```env
# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### 2. Gmail Setup (Recommended)

If using Gmail:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account Settings → Security
   - Under "Signing in to Google", select "App passwords"
   - Generate a new app password for "Mail"
   - Use this password as `EMAIL_PASSWORD`

3. **Configure Environment Variables**:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=youremail@gmail.com
```

### 3. Other Email Providers

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=verified-sender@yourdomain.com
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-smtp-password
EMAIL_FROM=noreply@yourdomain.com
```

#### AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-ses-smtp-username
EMAIL_PASSWORD=your-ses-smtp-password
EMAIL_FROM=verified-email@yourdomain.com
```

## Email Templates

The application includes professionally designed HTML email templates for:

1. **Order Confirmation**
   - Order details with item list
   - Pricing breakdown (items, shipping, tax, total)
   - Shipping address
   - Track order button

2. **Order Status Update**
   - New status with emoji indicator
   - Admin notes (if provided)
   - Order summary
   - View order button

3. **Event Registration Confirmation**
   - Event details (name, date, location)
   - Ticket ID and QR code
   - Participant information
   - Group details (for group registrations)
   - Important instructions

4. **Event Registration Update**
   - New status notification
   - Admin notes (if provided)
   - View registration button

## Testing

### Test Email Sending

1. Create a test order or registration
2. Check your email inbox
3. Verify email formatting and content

### Troubleshooting

If emails are not sending:

1. **Check Environment Variables**: Ensure all EMAIL_* variables are set correctly
2. **Check Console Logs**: Look for error messages in server logs
3. **Verify SMTP Credentials**: Test credentials with your email provider
4. **Check Spam Folder**: Emails might be filtered as spam initially
5. **Firewall/Port Issues**: Ensure port 587 is not blocked

### Common Issues

**Gmail "Less secure app access" error**:
- Use App Passwords instead of your regular password
- Enable 2-Factor Authentication first

**Connection timeout**:
- Check if port 587 is blocked by firewall
- Try port 465 with `EMAIL_SECURE=true`

**Authentication failed**:
- Verify EMAIL_USER and EMAIL_PASSWORD are correct
- For Gmail, ensure you're using App Password, not regular password

## Email Service Recommendations

### Development
- **Gmail**: Free, easy to set up with App Passwords
- **Mailtrap**: Email testing service (catches all emails)

### Production
- **SendGrid**: 100 emails/day free tier
- **Mailgun**: 5,000 emails/month free tier
- **AWS SES**: $0.10 per 1,000 emails
- **Postmark**: Reliable transactional email service

## Security Best Practices

1. **Never commit** `.env.local` to version control
2. **Use App Passwords** instead of main account passwords
3. **Rotate credentials** regularly
4. **Use verified sender domains** in production
5. **Monitor email sending** for abuse

## API Endpoints That Send Emails

- `POST /api/orders` - Sends order confirmation
- `PUT /api/orders/[id]` - Sends order status update
- `POST /api/registrations` - Sends registration confirmation
- `PUT /api/registrations/[id]` - Sends registration status update
- `DELETE /api/registrations/[id]` - Sends cancellation notification

## Customization

Email templates are located in `/src/lib/email.js`. You can customize:
- Email subject lines
- HTML templates
- Company name and branding
- Email content and styling

## Support

For issues or questions about email configuration, contact your system administrator or check the documentation of your email service provider.
