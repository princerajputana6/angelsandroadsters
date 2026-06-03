import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { requireUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

// Customer-initiated cancellation. Used by:
//  - the Razorpay client when the user dismisses the payment modal
//  - the dashboard "Cancel order" button (allowed only before the parcel ships)
//
// Two paths:
//   1. payment-failure cleanup (?reason=payment_cancelled): the order was just
//      created and never reached a happy state — we delete it outright so the
//      customer doesn't see a phantom order. Only the owner can do this.
//   2. regular customer cancellation: keep the order, flip status to
//      'cancelled', record reason in statusHistory.

export async function POST(req, { params }) {
  return handler(async () => {
    const user = await requireUser();
    await connectDB();

    const order = await Order.findById(params.id);
    if (!order) return fail('Order not found', 404);
    if (String(order.user) !== String(user._id) && user.role !== 'admin') {
      return fail('Forbidden', 403);
    }

    const { searchParams } = new URL(req.url);
    const reason = searchParams.get('reason') || (await req.json().catch(() => ({})))?.reason || '';

    // Already in a final state — refuse
    if (['delivered', 'returned'].includes(order.status)) {
      return fail(`Cannot cancel a ${order.status} order.`, 400);
    }
    // Once a courier has the parcel, the customer can't cancel themselves
    if (['shipped', 'out_for_delivery'].includes(order.status) && user.role !== 'admin') {
      return fail('Order is already on the way. Contact support for help.', 400);
    }

    // Phantom-order cleanup after a cancelled payment
    if (reason === 'payment_cancelled' && order.status === 'placed' && !order.paidAt) {
      await Order.findByIdAndDelete(order._id);
      return ok({ message: 'Order discarded after payment cancellation' });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.statusHistory.push({ status: 'cancelled', note: reason || 'Cancelled by customer' });
    await order.save();
    return ok({ order: toJSON(order) });
  });
}
