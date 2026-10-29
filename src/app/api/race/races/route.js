import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import Event from '@/lib/models/Event'; // registers ref for populate
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { parseOrThrow, raceCreateSchema } from '@/lib/raceValidation';

// GET /api/race/races?event=<id> — list races, optionally filtered by event.
export async function GET(req) {
  return handler(async () => {
    await requireRaceManager();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const event = searchParams.get('event');
    const status = searchParams.get('status');
    const filter = {};
    if (event) filter.event = event;
    if (status) filter.status = status;
    const races = await Race.find(filter)
      .populate('event', 'title slug startDate endDate')
      .sort({ createdAt: -1 })
      .lean();
    return ok({ races: toJSON(races) });
  });
}

// POST /api/race/races — create a race under an event.
export async function POST(req) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const body = parseOrThrow(raceCreateSchema, await req.json());

    // Validate the referenced event exists before creating the race.
    const eventExists = await Event.exists({ _id: body.event });
    if (!eventExists) throw Object.assign(new Error('Event not found'), { status: 404 });

    const race = await Race.create({ ...body, createdBy: user._id });
    await logRaceAudit({
      actor: user,
      action: 'RACE_CREATED',
      event: body.event,
      race: race._id,
      targetType: 'Race',
      targetId: race._id,
    });
    return ok({ race: toJSON(race) }, 201);
  });
}
