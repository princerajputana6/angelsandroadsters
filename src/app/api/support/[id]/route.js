import { connectDB } from '@/lib/db';
import SupportTicket from '@/lib/models/SupportTicket';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';
import { sendEmail } from '@/lib/email';

// Add a reply to a ticket (user or admin)
export async function POST(req, { params }) {
  return handler(async () => {
    await connectDB();
    const user = await getCurrentUser();
    const { id } = params;
    const { message } = await req.json();

    if (!message?.trim()) return fail('Message is required', 400);

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return fail('Ticket not found', 404);

    const isAdmin = user?.role === 'admin';

    // Only the ticket owner or admin can reply
    if (!isAdmin && ticket.user?.toString() !== user?._id?.toString()) {
      return fail('Access denied', 403);
    }

    const reply = {
      message: message.trim(),
      isAdmin,
      authorName: isAdmin ? 'Angels & Roadsters Support' : (user?.name || ticket.name),
    };
    ticket.replies.push(reply);

    // Update status when admin replies
    if (isAdmin && ticket.status === 'open') {
      ticket.status = 'in-progress';
    }

    await ticket.save();

    // Notify the other party
    if (isAdmin) {
      sendEmail({
        to: ticket.email,
        subject: `[${ticket.ticketRef}] Reply from support — ${ticket.subject}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:linear-gradient(135deg,#d97706,#f59e0b);color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center">
              <h2 style="margin:0">Support Reply 💬</h2>
            </div>
            <div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px">
              <p>Hi <strong>${ticket.name}</strong>, we've replied to your support ticket.</p>
              <div style="background:white;padding:16px;border-left:4px solid #d97706;border-radius:4px;margin:16px 0">
                <p style="margin:0">${message}</p>
              </div>
              <p style="font-size:13px;color:#666">Ticket: <code>${ticket.ticketRef}</code> | Log in to continue the conversation.</p>
            </div>
          </div>
        `,
      }).catch(() => {});
    }

    return ok({ ticket: toJSON(ticket) });
  });
}

// Update ticket (admin: change status/priority)
export async function PUT(req, { params }) {
  return handler(async () => {
    await connectDB();
    const user = await getCurrentUser();
    if (user?.role !== 'admin') return fail('Admin only', 403);

    const { id } = params;
    const updates = await req.json();
    const allowed = ['status', 'priority'];
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

    const ticket = await SupportTicket.findByIdAndUpdate(id, filtered, { new: true });
    if (!ticket) return fail('Ticket not found', 404);
    return ok({ ticket: toJSON(ticket) });
  });
}
