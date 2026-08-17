import { connectDB } from '@/lib/db';
import Affiliate from '@/lib/models/Affiliate';
import AffiliateConversion from '@/lib/models/AffiliateConversion';
import { requireUser } from '@/lib/auth';
import { ok, handler, toJSON } from '@/lib/apiUtils';

// Returns the current user's affiliate record (or null if not enrolled) plus
// their recent conversions and a live pending/payable breakdown.
export async function GET() {
  return handler(async () => {
    const user = await requireUser();
    await connectDB();

    const affiliate = await Affiliate.findOne({ user: user._id });
    if (!affiliate) return ok({ affiliate: null });

    const conversions = await AffiliateConversion.find({ affiliate: affiliate._id })
      .sort('-createdAt')
      .limit(100)
      .lean();

    const now = new Date();
    let pendingCommission = 0;   // earned, not yet paid (any status pending)
    let payableCommission = 0;   // pending AND past the 7-day hold
    for (const c of conversions) {
      if (c.status === 'pending') {
        pendingCommission += c.commissionAmount;
        if (c.eligibleAt && new Date(c.eligibleAt) <= now) payableCommission += c.commissionAmount;
      }
    }

    return ok({
      affiliate: toJSON(affiliate),
      conversions: toJSON(conversions),
      summary: { pendingCommission, payableCommission },
    });
  });
}
