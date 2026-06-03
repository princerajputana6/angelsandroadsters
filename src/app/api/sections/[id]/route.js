import { connectDB } from '@/lib/db';
import Section from '@/lib/models/Section';
import Category from '@/lib/models/Category';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';
import slugify from 'slugify';

export async function PUT(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();

    const section = await Section.findById(params.id);
    if (!section) return fail('Section not found', 404);

    // Renaming a section needs to cascade to all Category.parent values that
    // reference the old name (categories store parent as a string).
    let renamedFrom = null;
    if (typeof body.name === 'string' && body.name.trim()) {
      const newName = body.name.trim().toLowerCase();
      if (newName !== section.name) {
        // Make sure no other section already uses that name
        const clash = await Section.findOne({ name: newName, _id: { $ne: section._id } });
        if (clash) return fail('Another section already uses that name', 409);
        renamedFrom = section.name;
        section.name = newName;
        section.slug = slugify(newName, { lower: true, strict: true });
      }
    }
    if (typeof body.title === 'string') section.title = body.title.slice(0, 80);
    if (typeof body.image === 'string') section.image = body.image;
    if (typeof body.order === 'number') section.order = body.order;

    await section.save();

    if (renamedFrom) {
      await Category.updateMany({ parent: renamedFrom }, { $set: { parent: section.name } });
    }

    return ok({ section: toJSON(section) });
  });
}

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
