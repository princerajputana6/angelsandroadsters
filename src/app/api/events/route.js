import { connectDB } from '@/lib/db';
import Event from '@/lib/models/Event';
import { requireAdmin } from '@/lib/auth';
import { ok, handler, toJSON } from '@/lib/apiUtils';

export async function GET(req) {
  return handler(async () => {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    const upcoming = searchParams.get('upcoming');
    const filter = { isPublished: true };
    if (type) filter.eventType = type;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (upcoming === 'true') filter.startDate = { $gte: new Date() };
    const events = await Event.find(filter).sort({ startDate: 1 }).lean();
    return ok({ events: toJSON(events) });
  });
}

export async function POST(req) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();
    const event = await Event.create(body);
    return ok({ event: toJSON(event) }, 201);
  });
}
