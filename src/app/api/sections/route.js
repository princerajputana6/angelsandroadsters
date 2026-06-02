import { connectDB } from '@/lib/db';
import Section from '@/lib/models/Section';
import Category from '@/lib/models/Category';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

// GET — returns all sections. Backfills any Category.parent values that aren't
// yet stored as Section docs (one-time migration for older data) so the UI
// always lists everything currently in use.
export async function GET() {
  return handler(async () => {
    await connectDB();

    const existing = await Section.find().sort({ name: 1 }).lean();
    const have = new Set(existing.map((s) => s.name));

    const usedInCats = await Category.distinct('parent');
    const missing = usedInCats.filter((p) => p && !have.has(String(p).toLowerCase()));

    if (missing.length > 0) {
      await Section.insertMany(missing.map((name) => ({ name: String(name).toLowerCase() })));
    }

    const sections = await Section.find().sort({ order: 1, name: 1 }).lean();
    return ok({ sections: toJSON(sections) });
  });
}

export async function POST(req) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();
    const name = String(body?.name || '').trim().toLowerCase();
    if (!name) return fail('Section name is required', 400);
    try {
      const section = await Section.create({ name });
      return ok({ section: toJSON(section) }, 201);
    } catch (e) {
      if (e?.code === 11000) return fail('A section with that name already exists', 409);
      throw e;
    }
  });
}
