import { connectDB } from '@/lib/db';
import Category from '@/lib/models/Category';
import { requireAdmin } from '@/lib/auth';
import { ok, handler, toJSON } from '@/lib/apiUtils';

export async function GET(req) {
  return handler(async () => {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const topLevel = searchParams.get('topLevel');
    const parentId = searchParams.get('parentId');

    const filter = {};
    if (topLevel === 'true') filter.parentCategory = null;
    if (parentId) filter.parentCategory = parentId;

    const cats = await Category.find(filter)
      .sort({ parent: 1, order: 1, name: 1 })
      .lean();
    return ok({ categories: toJSON(cats) });
  });
}

export async function POST(req) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();
    // Treat empty string as null for parentCategory
    if (body.parentCategory === '' || body.parentCategory === undefined) {
      body.parentCategory = null;
    }
    const cat = await Category.create(body);
    return ok({ category: toJSON(cat) }, 201);
  });
}
