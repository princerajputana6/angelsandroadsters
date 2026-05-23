import { connectDB } from '@/lib/db';
import SupportTicket from '@/lib/models/SupportTicket';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';
import { sendEmail } from '@/lib/email';

export async function POST(req) {
  return handler(async () => {
    await connectDB();
    const user = await getCurrentUser();
    const body = await req.json();

    const { name, email, phone, subject, category, message, bookingTicketId } = body;
    if (!name || !email || !subject || !message) {
      return fail('name, email, subject and message are required', 400);
    }

    const ticket = await SupportTicket.create({
      name, email, phone, subject, category, message,
      bookingTicketId: bookingTicketId || undefined,
      user: user?._id,
      priority: category === 'payment' ? 'high' : 'medium',
    });

    // Notify user via email
    sendEmail({
      to: email,
      subject: `[${ticket.ticketRef}] Support ticket received — ${subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:linear-gradient(135deg,#d97706,#f59e0b);color:white;padding:24px;border-radius:10px 10px 0 0;text-align:center">
            <h1 style="margin:0;font-size:24px">Support Ticket Received 🎫</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 10px 10px">
            <p>Hi <strong>${name}</strong>,</p>
            <p>We've received your support request and will get back to you within <strong>24–48 hours</strong>.</p>
            <div style="background:white;padding:16px;border-radius:8px;margin:16px 0">
              <p style="margin:4px 0"><strong>Ticket ID:</strong> <code style="color:#d97706">${ticket.ticketRef}</code></p>
              <p style="margin:4px 0"><strong>Subject:</strong> ${subject}</p>
              <p style="margin:4px 0"><strong>Category:</strong> ${category}</p>
              ${bookingTicketId ? `<p style="margin:4px 0"><strong>Booking Ref:</strong> ${bookingTicketId}</p>` : ''}
            </div>
            <p>You can track your ticket status by logging into your account.</p>
            <p style="margin-top:24px;font-size:13px;color:#666">— Angels & Roadsters Support Team<br>info@angelsandroadsters.com | +91 8384099474</p>
          </div>
        </div>
      `,
    }).catch(() => {});

    // Notify admin
    sendEmail({
      to: process.env.EMAIL_USER,
      subject: `[NEW] ${ticket.ticketRef} — ${subject}`,
      html: `<p>New support ticket from <strong>${name}</strong> (${email}).</p>
             <p>Category: ${category} | Booking: ${bookingTicketId || 'N/A'}</p>
             <p>Message: ${message}</p>
             <p>View in admin: ${process.env.NEXT_PUBLIC_APP_URL}/admin/support</p>`,
    }).catch(() => {});

    return ok({ ticket: toJSON(ticket) }, 201);
  });
}

export async function GET(req) {
  return handler(async () => {
    await connectDB();
    const user = await getCurrentUser();
    if (!user) return fail('Authentication required', 401);

    const tickets = await SupportTicket.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return ok({ tickets: toJSON(tickets) });
  });
}
