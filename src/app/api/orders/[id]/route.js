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
    const body = await req.json();
    const { status, note, tracking } = body;

    const order = await Order.findById(params.id).populate('user', 'name email');
    if (!order) return fail('Order not found', 404);

    if (status) {
      order.status = status;
      order.statusHistory.push({ status, note: note || '' });
      if (status === 'paid' && !order.paidAt) order.paidAt = new Date();
      if (status === 'delivered' && !order.deliveredAt) order.deliveredAt = new Date();
      if (status === 'cancelled' && !order.cancelledAt) order.cancelledAt = new Date();
      if ((status === 'shipped' || status === 'out_for_delivery') && !order.tracking?.dispatchedAt) {
        order.tracking = order.tracking || {};
        order.tracking.dispatchedAt = new Date();
      }
    }

    if (tracking && typeof tracking === 'object') {
      order.tracking = {
        ...(order.tracking?.toObject?.() || order.tracking || {}),
        ...tracking,
      };
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

// Admin can hard-delete an order (e.g. to clean up Razorpay payments cancelled
// before verification). Customers should use the dedicated /cancel endpoint.
export async function DELETE(_req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const r = await Order.findByIdAndDelete(params.id);
    if (!r) return fail('Order not found', 404);
    return ok({ message: 'Deleted' });
  });
}
