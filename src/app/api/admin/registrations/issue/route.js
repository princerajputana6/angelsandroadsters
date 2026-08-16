import { connectDB } from '@/lib/db';
import Registration from '@/lib/models/Registration';
import Event from '@/lib/models/Event';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

const TEAM_TYPES = ['staff', 'volunteer', 'organizer'];

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') throw Object.assign(new Error('Forbidden'), { status: 403 });
  return user;
}

// GET /api/admin/registrations/issue?eventId=  → list staff/volunteer/organizer
export async function GET(req) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const filter = { registrationType: { $in: TEAM_TYPES } };
    const eventId = searchParams.get('eventId');
    if (eventId) filter.event = eventId;
    const regs = await Registration.find(filter)
      .populate('event', 'title')
      .sort({ createdAt: -1 })
      .lean();
    return ok({ registrations: toJSON(regs) });
  });
}

// POST /api/admin/registrations/issue  → issue one staff/volunteer/organizer
// registration (admin only). Gets a unique registration ID via the model hook.
export async function POST(req) {
  return handler(async () => {
    const admin = await requireAdmin();
    await connectDB();
    const body = await req.json();
    const { eventId, registrationType, name, email, phone } = body;

    if (!eventId) return fail('eventId is required', 400);
    if (!TEAM_TYPES.includes(registrationType)) {
      return fail(`registrationType must be one of: ${TEAM_TYPES.join(', ')}`, 400);
    }
    if (!name?.trim()) return fail('name is required', 400);

    const event = await Event.findById(eventId).lean();
    if (!event) return fail('Event not found', 404);

    const reg = new Registration({
      event: eventId,
      registrationType,
      name: name.trim(),
      email: email?.trim() || '',
      phone: phone?.trim() || '',
      status: 'confirmed',
      paymentStatus: 'free',
      profileCompleted: true,
      notes: `Issued by ${admin.name || admin.email}`,
    });
    await reg.save();

    return ok({ registration: toJSON(reg) }, 201);
  });
}
