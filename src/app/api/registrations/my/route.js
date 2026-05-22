import { connectDB } from '@/lib/db';
import Registration from '@/lib/models/Registration';
import Event from '@/lib/models/Event';
import { getCurrentUser } from '@/lib/auth';
import { ok, handler, toJSON } from '@/lib/apiUtils';

export async function GET() {
  return handler(async () => {
    const user = await getCurrentUser();
    await connectDB();
    
    if (!user) {
      return ok({ registrations: [] });
    }
    
    // Find registrations by:
    // 1. User ID (if registration was made while logged in)
    // 2. Email in main registration (for individual/visitor)
    // 3. Email in group members array (for group registrations)
    const query = {
      $or: [
        { user: user._id },
        { email: user.email },
        { 'members.email': user.email }
      ]
    };
    
    const regs = await Registration.find(query)
      .populate('event', 'title slug startDate endDate coverImage location')
      .sort('-createdAt')
      .lean();
    
    return ok({ registrations: toJSON(regs) });
  });
}
