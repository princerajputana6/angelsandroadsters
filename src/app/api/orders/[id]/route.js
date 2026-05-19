import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';
import { sendOrderStatusUpdate } from '@/lib/email';

export async function GET(_req, { params }) {
  return handler(async () => {
    const user = await getCurrentUser();
    if (!user) return fail('Unauthenticated', 401);
    await connectDB();
    const order = await Order.findById(params.id).populate('user', 'name email').lean();
    if (!order) return fail('Order not found', 404);
    if (user.role !== 'admin' && order.user._id.toString() !== user._id.toString()) {
      return fail('Forbidden', 403);
    }
    return ok({ order: toJSON(order) });
  });
}

export async function PUT(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const { status, note } = await req.json();
    const order = await Order.findById(params.id).populate('user', 'name email');
    if (!order) return fail('Order not found', 404);
    if (status) {
      order.status = status;
      order.statusHistory.push({ status, note: note || '' });
      if (status === 'paid') order.paidAt = new Date();
      if (status === 'delivered') order.deliveredAt = new Date();
    }
    await order.save();

    if (status && order.user?.email) {
      sendOrderStatusUpdate({
        order: toJSON(order),
        userEmail: order.user.email,
        userName: order.user.name,
        newStatus: status,
        note,
      }).catch(err => console.error('[Order Update] Email send failed:', err.message));
    }

    return ok({ order: toJSON(order) });
  });
}
