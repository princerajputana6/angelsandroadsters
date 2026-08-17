import { connectDB } from '@/lib/db';
import Affiliate from '@/lib/models/Affiliate';
import AffiliateConversion from '@/lib/models/AffiliateConversion';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

// Full affiliate detail incl. its conversions — powers the admin drawer.
export async function GET(_req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const affiliate = await Affiliate.findById(params.id).populate('user', 'name email phone').lean();
    if (!affiliate) return fail('Affiliate not found', 404);
    const conversions = await AffiliateConversion.find({ affiliate: params.id }).sort('-createdAt').lean();
    return ok({ affiliate: toJSON(affiliate), conversions: toJSON(conversions) });
  });
}

// Admin configures the buyer discount %, commission %, and status.
export async function PUT(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();
    const update = {};
    if ('discountPercent' in body) update.discountPercent = Math.max(0, Math.min(100, Number(body.discountPercent) || 0));
    if ('commissionPercent' in body) update.commissionPercent = Math.max(0, Math.min(100, Number(body.commissionPercent) || 0));
    if ('status' in body && ['active', 'suspended'].includes(body.status)) update.status = body.status;
    const affiliate = await Affiliate.findByIdAndUpdate(params.id, update, { new: true });
    if (!affiliate) return fail('Affiliate not found', 404);
    return ok({ affiliate: toJSON(affiliate) });
  });
}
