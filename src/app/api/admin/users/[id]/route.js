import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function PUT(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();
    const allowed = ['role', 'isBanned', 'name', 'phone'];
    const update = {};
    for (const k of allowed) if (k in body) update[k] = body[k];
    const user = await User.findByIdAndUpdate(params.id, update, { new: true });
    if (!user) return fail('User not found', 404);
    return ok({ user: toJSON(user) });
  });
}

export async function DELETE(_req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const r = await User.findByIdAndDelete(params.id);
    if (!r) return fail('User not found', 404);
    return ok({ message: 'Deleted' });
  });
}
