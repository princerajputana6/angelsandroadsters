import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { requireUser, requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';
import { sendOrderConfirmation } from '@/lib/email';
import { computeOrderTotals } from '@/lib/pricing';
import { findActiveAffiliateByCode, affiliateDiscount, recordConversion } from '@/lib/affiliate';

export async function POST(req) {
  return handler(async () => {
    const user = await requireUser();
    await connectDB();
    const { items, shippingAddress, paymentMethod = 'cod', couponCode, ref } = await req.json();
    if (!items?.length) return fail('No items in order', 400);

    const orderItems = [];
    const pricingLines = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return fail(`Product ${item.product} missing`, 400);
      const price = product.discountedPrice || product.price;
      const qty = Number(item.quantity) || 1;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.thumbnail || product.images?.[0],
        price,
        quantity: qty,
        size: item.size,
        color: item.color,
      });
      pricingLines.push({
        price,
        quantity: qty,
        delivery: product.delivery || {},
        tax: product.tax || {},
      });
    }

    const { itemsPrice, shippingPrice, taxPrice, totalPrice } = computeOrderTotals(pricingLines);

    // Affiliate referral (?ref=CODE): apply the affiliate's discount to the
    // order total and stamp the sale for commission tracking.
    let affiliate = null;
    let discount = 0;
    if (ref) {
      affiliate = await findActiveAffiliateByCode(ref);
      if (affiliate) discount = affiliateDiscount(affiliate, totalPrice);
    }
    const finalTotal = Math.max(0, totalPrice - discount);

    const order = await Order.create({
      user: user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      discount,
      totalPrice: finalTotal,
      couponCode,
      affiliate: affiliate?._id || null,
      affiliateCode: affiliate?.code || null,
      statusHistory: [{ status: 'placed', note: 'Order placed' }],
    });

    // COD orders never pass through payment verification, so record the
    // affiliate conversion now. Razorpay orders are recorded on verify.
    if (affiliate && paymentMethod === 'cod') {
      await recordConversion({
        affiliate,
        kind: 'order',
        refId: order._id,
        buyerUser: user._id,
        buyerName: user.name,
        buyerEmail: user.email,
        saleAmount: finalTotal,
        discountAmount: discount,
      }).catch((err) => console.error('[Order] Affiliate conversion failed:', err.message));
    }

    sendOrderConfirmation({
      order: toJSON(order),
      userEmail: user.email,
      userName: user.name,
    }).catch(err => console.error('[Order] Email send failed:', err.message));

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
