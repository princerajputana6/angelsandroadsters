import { razorpay } from '@/lib/razorpay';
import { ok, fail, handler } from '@/lib/apiUtils';

export async function POST(req) {
  return handler(async () => {
    const { amount, currency = 'INR', receipt, notes = {} } = await req.json();
    if (!amount || amount <= 0) return fail('Amount must be > 0', 400);
    const rp = razorpay();
    const order = await rp.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes,
    });
    return ok({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    });
  });
}
