import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function PUT(req, { params }) {
  return handler(async () => {
    const me = await requireUser();
    await connectDB();
    const body = await req.json();

    const user = await User.findById(me._id);
    if (!user) return fail('User not found', 404);

    const addr = user.addresses.id(params.id);
    if (!addr) return fail('Address not found', 404);

    const fields = ['label', 'line1', 'line2', 'city', 'state', 'postalCode', 'country', 'phone'];
    for (const f of fields) {
      if (typeof body[f] === 'string') addr[f] = body[f];
    }
    if (body.isDefault === true) {
      user.addresses.forEach((a) => { a.isDefault = false; });
      addr.isDefault = true;
    }

    await user.save();
    return ok({ addresses: toJSON(user.addresses) });
  });
}

export async function DELETE(_req, { params }) {
  return handler(async () => {
    const me = await requireUser();
    await connectDB();

    const user = await User.findById(me._id);
    if (!user) return fail('User not found', 404);

    const addr = user.addresses.id(params.id);
    if (!addr) return fail('Address not found', 404);
    const wasDefault = addr.isDefault;
    user.addresses.pull(params.id);

    // If we removed the default, promote the first remaining one
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return ok({ addresses: toJSON(user.addresses) });
  });
}
