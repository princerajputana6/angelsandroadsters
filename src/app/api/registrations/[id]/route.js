import { connectDB } from '@/lib/db';
import Registration from '@/lib/models/Registration';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';
import { sendEventRegistrationUpdate } from '@/lib/email';

export async function GET(_req, { params }) {
  return handler(async () => {
    await connectDB();
    const reg = await Registration.findById(params.id).populate('event').lean();
    if (!reg) return fail('Registration not found', 404);
    return ok({ registration: toJSON(reg) });
  });
}

export async function PUT(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();
    const oldReg = await Registration.findById(params.id).populate('event');
    const reg = await Registration.findByIdAndUpdate(params.id, body, { new: true }).populate('event');
    if (!reg) return fail('Not found', 404);

    if (body.status && body.status !== oldReg?.status && reg.email) {
      sendEventRegistrationUpdate({
        registration: toJSON(reg),
        event: toJSON(reg.event),
        userEmail: reg.email,
        userName: reg.name,
        newStatus: body.status,
        note: body.note,
      }).catch(err => console.error('[Registration Update] Email send failed:', err.message));
    }

    return ok({ registration: toJSON(reg) });
  });
}

export async function DELETE(_req, { params }) {
  return handler(async () => {
    const user = await getCurrentUser();
    if (!user) return fail('Unauthenticated', 401);
    await connectDB();
    const reg = await Registration.findById(params.id).populate('event');
    if (!reg) return fail('Not found', 404);
    if (user.role !== 'admin' && reg.user?.toString() !== user._id.toString()) {
      return fail('Forbidden', 403);
    }
    reg.status = 'cancelled';
    await reg.save();

    if (reg.email) {
      sendEventRegistrationUpdate({
        registration: toJSON(reg),
        event: toJSON(reg.event),
        userEmail: reg.email,
        userName: reg.name,
        newStatus: 'cancelled',
        note: 'Registration cancelled by user',
      }).catch(err => console.error('[Registration Cancel] Email send failed:', err.message));
    }

    return ok({ message: 'Cancelled' });
  });
}
