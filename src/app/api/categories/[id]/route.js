import { connectDB } from '@/lib/db';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';
import slugify from 'slugify';

export async function GET(_req, { params }) {
  return handler(async () => {
    await connectDB();
    const cat = await Category.findById(params.id).lean();
    if (!cat) return fail('Category not found', 404);
    return ok({ category: toJSON(cat) });
  });
}

export async function PUT(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();

    // Normalize parentCategory: empty string = top-level
    if (body.parentCategory === '' || body.parentCategory === undefined) {
      body.parentCategory = null;
    }
    // Refresh slug if name changed
    if (body.name) body.slug = slugify(body.name, { lower: true, strict: true });
    // Prevent a category from being its own parent
    if (body.parentCategory && String(body.parentCategory) === String(params.id)) {
      return fail('A category cannot be its own parent', 400);
    }

    const cat = await Category.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    if (!cat) return fail('Category not found', 404);
    return ok({ category: toJSON(cat) });
  });
}

export async function DELETE(_req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();

    // Guard rails: refuse to delete if there are sub-categories or products attached.
    const subCount = await Category.countDocuments({ parentCategory: params.id });
    if (subCount > 0) {
      return fail(`Cannot delete — ${subCount} sub-categor${subCount === 1 ? 'y' : 'ies'} still reference this category. Move or delete them first.`, 400);
    }
    const productCount = await Product.countDocuments({ category: params.id });
    if (productCount > 0) {
      return fail(`Cannot delete — ${productCount} product${productCount === 1 ? '' : 's'} still use this category.`, 400);
    }

    const r = await Category.findByIdAndDelete(params.id);
    if (!r) return fail('Category not found', 404);
    return ok({ message: 'Deleted' });
  });
}
