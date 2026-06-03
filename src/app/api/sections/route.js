import { connectDB } from '@/lib/db';
import Section from '@/lib/models/Section';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

const FAVOURITE_LIMIT = 4;

// GET — returns all sections. Backfills any Category.parent values that aren't
// yet stored as Section docs (one-time migration for older data) so the UI
// always lists everything currently in use.
export async function GET(req) {
  return handler(async () => {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const includeCounts = searchParams.get('includeCounts') === 'true';
    const favouritesOnly = searchParams.get('favouritesOnly') === 'true';

    const existing = await Section.find().sort({ name: 1 }).lean();
    const have = new Set(existing.map((s) => s.name));

    const usedInCats = await Category.distinct('parent');
    const missing = usedInCats.filter((p) => p && !have.has(String(p).toLowerCase()));

    if (missing.length > 0) {
      await Section.insertMany(missing.map((name) => ({ name: String(name).toLowerCase() })));
    }

    const filter = {};
    if (favouritesOnly) filter.isFavourite = true;

    let sections = await Section.find(filter).sort({ order: 1, name: 1 }).lean();

    if (includeCounts && sections.length > 0) {
      sections = await Promise.all(sections.map(async (s) => {
        const cats = await Category.find({ parent: s.name }).select('_id').lean();
        const ids = cats.map((c) => c._id);
        const productCount = ids.length === 0
          ? 0
          : await Product.countDocuments({ category: { $in: ids }, isActive: true });
        return { ...s, productCount };
      }));
    }

    if (favouritesOnly) sections = sections.slice(0, FAVOURITE_LIMIT);

    return ok({ sections: toJSON(sections), favouriteLimit: FAVOURITE_LIMIT });
  });
}

export async function POST(req) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();
    const name = String(body?.name || '').trim().toLowerCase();
    if (!name) return fail('Section name is required', 400);

    const wantsFavourite = body.isFavourite === true;
    if (wantsFavourite) {
      const favCount = await Section.countDocuments({ isFavourite: true });
      if (favCount >= FAVOURITE_LIMIT) {
        return fail(`You can only have ${FAVOURITE_LIMIT} favourite sections. Unfavourite one first.`, 400);
      }
    }

    try {
      const section = await Section.create({
        name,
        title: typeof body.title === 'string' ? body.title.slice(0, 80) : '',
        image: typeof body.image === 'string' ? body.image : '',
        isFavourite: wantsFavourite,
      });
      return ok({ section: toJSON(section) }, 201);
    } catch (e) {
      if (e?.code === 11000) return fail('A section with that name already exists', 409);
      throw e;
    }
  });
}
