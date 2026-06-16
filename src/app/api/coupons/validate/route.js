import { connectDB } from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import { ok, fail, handler } from '@/lib/apiUtils';

export async function POST(req) {
  return handler(async () => {
    await connectDB();
    const { code, amount, registrationType, eventId } = await req.json();

    if (!code || amount == null) return fail('code and amount are required', 400);

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon || !coupon.isActive) return fail('Invalid or inactive coupon code', 404);

    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return fail('This coupon has expired', 400);
    }
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return fail('This coupon has reached its usage limit', 400);
    }
    if (coupon.applicableTo?.length && registrationType && !coupon.applicableTo.includes(registrationType)) {
      return fail(`This coupon is not valid for ${registrationType} registrations`, 400);
    }
    if (coupon.eventId && eventId && String(coupon.eventId) !== String(eventId)) {
      return fail('This coupon is not valid for this event', 400);
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = Math.round((amount * coupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(coupon.discountValue, amount);
    }
    const finalAmount = Math.max(0, amount - discountAmount);

    return ok({
      valid: true,
      coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue },
      discountAmount,
      finalAmount,
    });
  });
}
