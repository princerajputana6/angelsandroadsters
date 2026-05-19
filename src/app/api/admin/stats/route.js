import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import Event from '@/lib/models/Event';
import Registration from '@/lib/models/Registration';
import { requireAdmin } from '@/lib/auth';
import { ok, handler } from '@/lib/apiUtils';

export async function GET() {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const [users, products, orders, events, registrations, revenueAgg] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Event.countDocuments(),
      Registration.countDocuments(),
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'returned'] } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
    ]);
    const lowStock = await Product.find({ stock: { $lt: 5 } }).select('name stock').limit(10).lean();
    const recentOrders = await Order.find().sort('-createdAt').limit(5).populate('user', 'name').lean();

    return ok({
      stats: {
        users, products, orders, events, registrations,
        revenue: revenueAgg[0]?.total || 0,
      },
      lowStock,
      recentOrders: JSON.parse(JSON.stringify(recentOrders)),
    });
  });
}
