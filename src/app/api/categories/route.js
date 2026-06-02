import { connectDB } from '@/lib/db';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import { requireAdmin } from '@/lib/auth';
import { ok, handler, toJSON } from '@/lib/apiUtils';

export async function GET(req) {
  return handler(async () => {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const topLevel = searchParams.get('topLevel');
    const parentId = searchParams.get('parentId');
    const includeCounts = searchParams.get('includeCounts') === 'true';

    const filter = {};
    if (topLevel === 'true') filter.parentCategory = null;
    if (parentId) filter.parentCategory = parentId;

    let cats = await Category.find(filter)
      .sort({ parent: 1, order: 1, name: 1 })
      .lean();

    if (includeCounts && cats.length > 0) {
      // Pre-fetch all sub-categories so we can roll up product counts
      const topIds = cats.map((c) => c._id);
      const allSubs = await Category.find({ parentCategory: { $in: topIds } })
        .select('_id parentCategory')
        .lean();
      const subsByParent = new Map();
      for (const s of allSubs) {
        const key = String(s.parentCategory);
        if (!subsByParent.has(key)) subsByParent.set(key, []);
        subsByParent.get(key).push(s._id);
      }

      cats = await Promise.all(cats.map(async (c) => {
        const ids = [c._id, ...(subsByParent.get(String(c._id)) || [])];
        const productCount = await Product.countDocuments({ category: { $in: ids }, isActive: true });
        return { ...c, productCount };
      }));
    }

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
