import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/auth';
import { ok, handler, toJSON } from '@/lib/apiUtils';

export async function GET() {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const users = await User.find().sort('-createdAt').lean();
    return ok({ users: toJSON(users) });
  });
}
