import { connectDB } from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') throw Object.assign(new Error('Forbidden'), { status: 403 });
}

export async function PATCH(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();
    const coupon = await Coupon.findByIdAndUpdate(params.id, body, { new: true });
    if (!coupon) return fail('Coupon not found', 404);
    return ok({ coupon: toJSON(coupon) });
  });
}

export async function DELETE(_req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    await Coupon.findByIdAndDelete(params.id);
    return ok({ deleted: true });
  });
}
