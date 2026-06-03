import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function GET(req) {
  return handler(async () => {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(60, Number(searchParams.get('limit')) || 12);
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const section = searchParams.get('section');
    const brand = searchParams.get('brand');
    const minPrice = Number(searchParams.get('minPrice'));
    const maxPrice = Number(searchParams.get('maxPrice'));
    const featured = searchParams.get('featured');
    const sort = searchParams.get('sort') || '-createdAt';

    const filter = { isActive: true };
    if (q) filter.$text = { $search: q };
    if (category) {
      // Accept either a single id or a comma-separated list of ids
      const list = category.split(',').map((s) => s.trim()).filter(Boolean);
      filter.category = list.length > 1 ? { $in: list } : list[0];
    } else if (section) {
      // Filter by section name → resolve to all category ids in that section
      const cats = await Category.find({ parent: section.toLowerCase() }).select('_id').lean();
      filter.category = { $in: cats.map((c) => c._id) };
    }
    if (brand) filter.brand = brand;
    if (!Number.isNaN(minPrice) && minPrice) filter.price = { ...(filter.price || {}), $gte: minPrice };
    if (!Number.isNaN(maxPrice) && maxPrice) filter.price = { ...(filter.price || {}), $lte: maxPrice };
    if (featured === 'true') filter.isFeatured = true;

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name slug parent')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return ok({ products: toJSON(products), page, limit, total, pages: Math.ceil(total / limit) });
  });
}

export async function POST(req) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();
    const product = await Product.create(body);
    return ok({ product: toJSON(product) }, 201);
  });
}
