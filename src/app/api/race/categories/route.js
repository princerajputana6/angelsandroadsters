import { connectDB } from '@/lib/db';
import Race from '@/lib/models/Race';
import RaceCategory from '@/lib/models/RaceCategory';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { parseOrThrow, categoryCreateSchema } from '@/lib/raceValidation';

// GET /api/race/categories?race=<id>
export async function GET(req) {
  return handler(async () => {
    await requireRaceManager();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const race = searchParams.get('race');
    if (!race) throw Object.assign(new Error('race query param required'), { status: 400 });
    const categories = await RaceCategory.find({ race }).sort({ sortOrder: 1, name: 1 }).lean();
    return ok({ categories: toJSON(categories) });
  });
}

// POST /api/race/categories
export async function POST(req) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const body = parseOrThrow(categoryCreateSchema, await req.json());

    const race = await Race.findById(body.race).lean();
    if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });

    if (body.numberRangeEnd && body.numberRangeStart && body.numberRangeEnd < body.numberRangeStart) {
      throw Object.assign(new Error('numberRangeEnd must be >= numberRangeStart'), { status: 400 });
    }

    const category = await RaceCategory.create({ ...body, event: race.event, createdBy: user._id });
    await logRaceAudit({
      actor: user, action: 'CATEGORY_CREATED', event: race.event, race: race._id,
      targetType: 'RaceCategory', targetId: category._id,
    });
    return ok({ category: toJSON(category) }, 201);
  });
}
