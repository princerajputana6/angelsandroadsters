import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function GET(_req, { params }) {
  return handler(async () => {
    await connectDB();
    const product = await Product.findOne({ slug: params.slug, isActive: true })
      .populate('category', 'name slug parent')
      .lean();
    if (!product) return fail('Product not found', 404);
    return ok({ product: toJSON(product) });
  });
}

export async function PUT(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();
    const product = await Product.findOneAndUpdate({ slug: params.slug }, body, { new: true });
    if (!product) return fail('Product not found', 404);
    return ok({ product: toJSON(product) });
  });
}

export async function DELETE(_req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const result = await Product.findOneAndDelete({ slug: params.slug });
    if (!result) return fail('Product not found', 404);
    return ok({ message: 'Deleted' });
  });
}
