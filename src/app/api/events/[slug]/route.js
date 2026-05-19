import { connectDB } from '@/lib/db';
import Event from '@/lib/models/Event';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function GET(_req, { params }) {
  return handler(async () => {
    await connectDB();
    const event = await Event.findOne({ slug: params.slug, isPublished: true }).lean();
    if (!event) return fail('Event not found', 404);
    return ok({ event: toJSON(event) });
  });
}

export async function PUT(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();
    const event = await Event.findOneAndUpdate({ slug: params.slug }, body, { new: true });
    if (!event) return fail('Event not found', 404);
    return ok({ event: toJSON(event) });
  });
}

export async function DELETE(_req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const r = await Event.findOneAndDelete({ slug: params.slug });
    if (!r) return fail('Event not found', 404);
    return ok({ message: 'Deleted' });
  });
}
