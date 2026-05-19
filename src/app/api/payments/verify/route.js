import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Registration from '@/lib/models/Registration';
import { verifySignature } from '@/lib/razorpay';
import { ok, fail, handler } from '@/lib/apiUtils';

export async function POST(req) {
  return handler(async () => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      kind,           // 'order' | 'registration'
      referenceId,    // _id of Order or Registration to mark paid
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return fail('Missing payment fields', 400);
    }

    const valid = verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) return fail('Signature mismatch', 400);

    if (kind === 'order' && referenceId) {
      await connectDB();
      const order = await Order.findById(referenceId);
      if (!order) return fail('Order not found', 404);
      order.status = 'paid';
      order.paidAt = new Date();
      order.paymentResult = {
        id: razorpay_payment_id,
        status: 'paid',
        update_time: new Date().toISOString(),
      };
      order.statusHistory.push({ status: 'paid', note: 'Razorpay payment verified' });
      await order.save();
    }

    if (kind === 'registration' && referenceId) {
      await connectDB();
      const reg = await Registration.findById(referenceId);
      if (!reg) return fail('Registration not found', 404);
      reg.paymentStatus = 'paid';
      reg.status = 'confirmed';
      reg.paymentId = razorpay_payment_id;
      await reg.save();
    }

    return ok({ verified: true });
  });
}
