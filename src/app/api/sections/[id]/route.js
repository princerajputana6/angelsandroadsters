import { connectDB } from '@/lib/db';
import Section from '@/lib/models/Section';
import Category from '@/lib/models/Category';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler } from '@/lib/apiUtils';

export async function DELETE(_req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();

    const section = await Section.findById(params.id);
    if (!section) return fail('Section not found', 404);

    const inUse = await Category.countDocuments({ parent: section.name });
    if (inUse > 0) {
      return fail(`Cannot delete — ${inUse} categor${inUse === 1 ? 'y' : 'ies'} still use this section. Move or delete them first.`, 400);
    }

    await Section.findByIdAndDelete(params.id);
    return ok({ message: 'Deleted' });
  });
}
