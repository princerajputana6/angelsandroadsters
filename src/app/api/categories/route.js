import { connectDB } from '@/lib/db';
import Category from '@/lib/models/Category';
import { requireAdmin } from '@/lib/auth';
import { ok, handler, toJSON } from '@/lib/apiUtils';

export async function GET() {
  return handler(async () => {
    await connectDB();
    const cats = await Category.find().sort({ parent: 1, order: 1, name: 1 }).lean();
    return ok({ categories: toJSON(cats) });
  });
}

export async function POST(req) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();
    const cat = await Category.create(body);
    return ok({ category: toJSON(cat) }, 201);
  });
}
