import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { requireUser, requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function POST(req) {
  return handler(async () => {
    const user = await requireUser();
    await connectDB();
    const { items, shippingAddress, paymentMethod = 'cod', couponCode } = await req.json();
    if (!items?.length) return fail('No items in order', 400);

    let itemsPrice = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return fail(`Product ${item.product} missing`, 400);
      const price = product.discountedPrice || product.price;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.thumbnail || product.images?.[0],
        price,
        quantity: item.quantity || 1,
        size: item.size,
        color: item.color,
      });
      itemsPrice += price * (item.quantity || 1);
    }

    const shippingPrice = itemsPrice > 1500 ? 0 : 99;
    const taxPrice = Math.round(itemsPrice * 0.05);
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    const order = await Order.create({
      user: user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      couponCode,
      statusHistory: [{ status: 'placed', note: 'Order placed' }],
    });
    return ok({ order: toJSON(order) }, 201);
  });
}

export async function GET(req) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const filter = status ? { status } : {};
    const orders = await Order.find(filter).populate('user', 'name email').sort('-createdAt').lean();
    return ok({ orders: toJSON(orders) });
  });
}
