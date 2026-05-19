import { connectDB } from '@/lib/db';
import Registration from '@/lib/models/Registration';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

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
    const reg = await Registration.findByIdAndUpdate(params.id, body, { new: true });
    if (!reg) return fail('Not found', 404);
    return ok({ registration: toJSON(reg) });
  });
}

export async function DELETE(_req, { params }) {
  return handler(async () => {
    const user = await getCurrentUser();
    if (!user) return fail('Unauthenticated', 401);
    await connectDB();
    const reg = await Registration.findById(params.id);
    if (!reg) return fail('Not found', 404);
    if (user.role !== 'admin' && reg.user?.toString() !== user._id.toString()) {
      return fail('Forbidden', 403);
    }
    reg.status = 'cancelled';
    await reg.save();
    return ok({ message: 'Cancelled' });
  });
}
