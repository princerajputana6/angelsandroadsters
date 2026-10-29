import { connectDB } from '@/lib/db';
import RaceCategory from '@/lib/models/RaceCategory';
import RaceEntry from '@/lib/models/RaceEntry';
import { ok, handler, toJSON } from '@/lib/apiUtils';
import { requireRaceManager, logRaceAudit } from '@/lib/raceAuth';
import { parseOrThrow, categoryUpdateSchema } from '@/lib/raceValidation';

async function getOr404(id) {
  const cat = await RaceCategory.findById(id);
  if (!cat) throw Object.assign(new Error('Category not found'), { status: 404 });
  return cat;
}

// PUT /api/race/categories/:id
export async function PUT(req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const cat = await getOr404(params.id);
    const body = parseOrThrow(categoryUpdateSchema, await req.json());
    Object.assign(cat, body);
    await cat.save();
    await logRaceAudit({
      actor: user, action: 'CATEGORY_UPDATED', event: cat.event, race: cat.race,
      targetType: 'RaceCategory', targetId: cat._id,
    });
    return ok({ category: toJSON(cat) });
  });
}

// DELETE /api/race/categories/:id — refused if any entries reference it.
export async function DELETE(_req, { params }) {
  return handler(async () => {
    const user = await requireRaceManager();
    await connectDB();
    const cat = await getOr404(params.id);
    const entryCount = await RaceEntry.countDocuments({ category: cat._id });
    if (entryCount > 0) {
      throw Object.assign(
        new Error(`Cannot delete: ${entryCount} entr${entryCount === 1 ? 'y uses' : 'ies use'} this category.`),
        { status: 409 }
      );
    }
    await RaceCategory.deleteOne({ _id: cat._id });
    await logRaceAudit({
      actor: user, action: 'CATEGORY_DELETED', event: cat.event, race: cat.race,
      targetType: 'RaceCategory', targetId: cat._id,
    });
    return ok({ deleted: true });
  });
}
