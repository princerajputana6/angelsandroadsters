import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { requireUser } from '@/lib/auth';
import { ok, handler, toJSON } from '@/lib/apiUtils';

export async function GET() {
  return handler(async () => {
    const user = await requireUser();
    await connectDB();
    const orders = await Order.find({ user: user._id }).sort('-createdAt').lean();
    return ok({ orders: toJSON(orders) });
  });
}
