import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function GET() {
  return handler(async () => {
    const me = await requireUser();
    await connectDB();
    const user = await User.findById(me._id).select('addresses').lean();
    return ok({ addresses: toJSON(user?.addresses || []) });
  });
}

export async function POST(req) {
  return handler(async () => {
    const me = await requireUser();
    await connectDB();
    const body = await req.json();
    if (!body?.line1 || !body?.city || !body?.state || !body?.postalCode || !body?.phone) {
      return fail('Missing required address fields', 400);
    }

    const user = await User.findById(me._id);
    if (!user) return fail('User not found', 404);

    // If this is the first address OR caller asked to make default, mark as default
    const willBeDefault = body.isDefault === true || (user.addresses || []).length === 0;
    if (willBeDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
    }

    user.addresses.push({
      label: body.label || '',
      line1: body.line1,
      line2: body.line2 || '',
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
      country: body.country || 'India',
      phone: body.phone,
      isDefault: willBeDefault,
    });

    await user.save();
    return ok({ addresses: toJSON(user.addresses) }, 201);
  });
}
