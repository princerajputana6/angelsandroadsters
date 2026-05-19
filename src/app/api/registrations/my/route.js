import { connectDB } from '@/lib/db';
import Registration from '@/lib/models/Registration';
import { requireUser } from '@/lib/auth';
import { ok, handler, toJSON } from '@/lib/apiUtils';

export async function GET() {
  return handler(async () => {
    const user = await requireUser();
    await connectDB();
    const regs = await Registration.find({ user: user._id })
      .populate('event', 'title slug startDate endDate coverImage location')
      .sort('-createdAt')
      .lean();
    return ok({ registrations: toJSON(regs) });
  });
}
