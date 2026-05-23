import { connectDB } from '@/lib/db';
import SupportTicket from '@/lib/models/SupportTicket';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function GET(req) {
  return handler(async () => {
    await connectDB();
    const user = await getCurrentUser();
    if (user?.role !== 'admin') return fail('Admin only', 403);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const tickets = await SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return ok({ tickets: toJSON(tickets) });
  });
}
