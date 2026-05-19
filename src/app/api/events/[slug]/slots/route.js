import { connectDB } from '@/lib/db';
import Event from '@/lib/models/Event';
import Registration from '@/lib/models/Registration';
import { ok, fail, handler } from '@/lib/apiUtils';

const ACTIVE = ['confirmed', 'pending', 'attended'];

export async function GET(_req, { params }) {
  return handler(async () => {
    await connectDB();
    const event = await Event.findOne({ slug: params.slug }).lean();
    if (!event) return fail('Event not found', 404);

    const regs = await Registration.find({
      event: event._id,
      status: { $in: ACTIVE },
    }).select('registrationType groupSize').lean();

    let individualUsed = 0;
    let groupUsed = 0;
    let visitorUsed = 0;
    let visitorHeadsUsed = 0;
    let groupHeadsUsed = 0;

    for (const r of regs) {
      if (r.registrationType === 'individual') individualUsed += 1;
      else if (r.registrationType === 'group') {
        groupUsed += 1;
        groupHeadsUsed += Number(r.groupSize) || 1;
      } else if (r.registrationType === 'visitor') {
        visitorUsed += 1;
        visitorHeadsUsed += 1;
      }
    }

    const cap = event.capacity || {};
    const slots = {
      individual: {
        capacity: cap.individual || 0,
        booked: individualUsed,
        remaining: Math.max(0, (cap.individual || 0) - individualUsed),
      },
      group: {
        capacity: cap.group || 0,
        booked: groupUsed,
        remaining: Math.max(0, (cap.group || 0) - groupUsed),
        headsBooked: groupHeadsUsed,
      },
      visitor: {
        capacity: cap.visitor || 0,
        booked: visitorUsed,
        remaining: Math.max(0, (cap.visitor || 0) - visitorUsed),
      },
    };

    return ok({ slots });
  });
}
