import { connectDB } from '@/lib/db';
import Affiliate from '@/lib/models/Affiliate';
import AffiliateConversion from '@/lib/models/AffiliateConversion';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

// Admin updates a conversion's payout status: mark it 'paid' after a manual
// transfer, or 'reversed' if the sale was refunded/cancelled. Affiliate
// counters are kept in sync with the transition.
export async function PATCH(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const { status } = await req.json();
    if (!['pending', 'paid', 'reversed'].includes(status)) return fail('Invalid status', 400);

    const conv = await AffiliateConversion.findById(params.id);
    if (!conv) return fail('Conversion not found', 404);

    const from = conv.status;
    if (from === status) return ok({ conversion: toJSON(conv) });

    // Counter deltas on the affiliate for this transition.
    const inc = {};
    const bump = (k, v) => { inc[k] = (inc[k] || 0) + v; };

    // Leaving 'paid' undoes the recorded payout.
    if (from === 'paid') bump('paidCommission', -conv.commissionAmount);
    // Entering 'paid' records the payout.
    if (status === 'paid') bump('paidCommission', conv.commissionAmount);

    // 'reversed' removes the sale from lifetime totals; leaving it restores them.
    if (from === 'reversed') {
      bump('totalConversions', 1);
      bump('totalSales', conv.saleAmount);
      bump('totalCommission', conv.commissionAmount);
    }
    if (status === 'reversed') {
      bump('totalConversions', -1);
      bump('totalSales', -conv.saleAmount);
      bump('totalCommission', -conv.commissionAmount);
    }

    conv.status = status;
    conv.paidAt = status === 'paid' ? new Date() : null;
    await conv.save();

    if (Object.keys(inc).length) await Affiliate.findByIdAndUpdate(conv.affiliate, { $inc: inc });

    return ok({ conversion: toJSON(conv) });
  });
}
