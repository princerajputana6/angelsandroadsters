import { connectDB } from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') throw Object.assign(new Error('Forbidden'), { status: 403 });
  return user;
}

export async function GET() {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return ok({ coupons: toJSON(coupons) });
  });
}

export async function POST(req) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();
    const { code, discountType, discountValue, maxUses, expiresAt, applicableTo, eventId } = body;

    if (!code || !discountType || discountValue == null) {
      return fail('code, discountType and discountValue are required', 400);
    }
    if (!['percent', 'flat'].includes(discountType)) {
      return fail('discountType must be percent or flat', 400);
    }
    if (discountType === 'percent' && (discountValue <= 0 || discountValue > 100)) {
      return fail('Percent discount must be between 1 and 100', 400);
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: Number(discountValue),
      maxUses: Number(maxUses) || 0,
      expiresAt: expiresAt || undefined,
      applicableTo: applicableTo || [],
      eventId: eventId || null,
      isActive: true,
    });

    return ok({ coupon: toJSON(coupon) }, 201);
  });
}
