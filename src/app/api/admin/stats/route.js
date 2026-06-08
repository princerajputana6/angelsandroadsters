import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import Event from '@/lib/models/Event';
import Registration from '@/lib/models/Registration';
import Blog from '@/lib/models/Blog';
import { requireAdmin } from '@/lib/auth';
import { ok, handler } from '@/lib/apiUtils';

export async function GET() {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const [
      users, products, orders, events, registrations,
      blogs, blogsPublished, blogsDraft,
      orderRevenueAgg, registrationRevenueAgg,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Event.countDocuments(),
      Registration.countDocuments(),
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'published' }),
      Blog.countDocuments({ status: 'draft' }),
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'returned'] } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Registration.aggregate([
        { $match: { paymentStatus: { $in: ['paid', 'free'] }, status: { $nin: ['cancelled'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);
    
    const lowStock = await Product.find({ stock: { $lt: 5 } }).select('name stock').limit(10).lean();
    const recentOrders = await Order.find().sort('-createdAt').limit(5).populate('user', 'name').lean();
    const recentRegistrations = await Registration.find()
      .sort('-createdAt')
      .limit(5)
      .populate('event', 'title')
      .lean();

    const orderRevenue = orderRevenueAgg[0]?.total || 0;
    const registrationRevenue = registrationRevenueAgg[0]?.total || 0;
    const totalRevenue = orderRevenue + registrationRevenue;

    return ok({
      stats: {
        users,
        products,
        orders,
        events,
        registrations,
        blogs,
        blogsPublished,
        blogsDraft,
        revenue: totalRevenue,
        orderRevenue,
        registrationRevenue,
      },
      lowStock,
      recentOrders: JSON.parse(JSON.stringify(recentOrders)),
      recentRegistrations: JSON.parse(JSON.stringify(recentRegistrations)),
    });
  });
}
