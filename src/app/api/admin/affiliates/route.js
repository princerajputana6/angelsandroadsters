import { connectDB } from '@/lib/db';
import Affiliate from '@/lib/models/Affiliate';
import { requireAdmin } from '@/lib/auth';
import { ok, handler, toJSON } from '@/lib/apiUtils';

// List every affiliate with the linked user's basic details. Stats live on the
// affiliate record (denormalized counters), so no aggregation needed here.
export async function GET() {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const affiliates = await Affiliate.find()
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .lean();
    return ok({ affiliates: toJSON(affiliates) });
  });
}
