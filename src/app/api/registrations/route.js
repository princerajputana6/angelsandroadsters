import { connectDB } from '@/lib/db';
import Registration from '@/lib/models/Registration';
import Event from '@/lib/models/Event';
import { getCurrentUser } from '@/lib/auth';
import { generateQRDataUrl } from '@/lib/qr';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function POST(req) {
  return handler(async () => {
    await connectDB();
    const user = await getCurrentUser();
    const body = await req.json();
    const { eventId, registrationType } = body;
    if (!eventId || !registrationType) return fail('eventId and registrationType required', 400);

    const event = await Event.findById(eventId);
    if (!event) return fail('Event not found', 404);

    let amount = 0;
    if (registrationType === 'individual') amount = event.pricing.individual || 0;
    if (registrationType === 'visitor') amount = event.pricing.visitor || 0;
    if (registrationType === 'group') {
      const size = Number(body.groupSize || (body.members?.length || 1));
      amount = (event.pricing.groupBase || 0) + (event.pricing.groupPerHead || 0) * size;
    }

    const reg = new Registration({
      event: event._id,
      user: user?._id,
      registrationType,
      name: body.name,
      email: body.email,
      phone: body.phone,
      age: body.age,
      emergencyContact: body.emergencyContact,
      experienceLevel: body.experienceLevel,
      bikeDetails: body.bikeDetails,
      visitDate: body.visitDate,
      groupName: body.groupName,
      groupLeader: body.groupLeader,
      members: body.members,
      groupSize: body.groupSize || (body.members?.length || undefined),
      amount,
      paymentStatus: amount === 0 ? 'free' : 'pending',
      status: amount === 0 ? 'confirmed' : 'pending',
    });
    await reg.save();
    reg.qrCode = await generateQRDataUrl({ ticketId: reg.ticketId, eventId: event._id.toString() });
    await reg.save();

    return ok({ registration: toJSON(reg) }, 201);
  });
}

export async function GET(req) {
  return handler(async () => {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    if (!eventId) return fail('eventId required', 400);
    const regs = await Registration.find({ event: eventId }).lean();
    return ok({ registrations: toJSON(regs) });
  });
}
