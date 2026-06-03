import { connectDB } from '@/lib/db';
import Company from '@/lib/models/Company';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function PUT(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();
    const fields = {};
    if (typeof body.name === 'string') fields.name = body.name.trim();
    if (typeof body.logo === 'string') fields.logo = body.logo;
    if (typeof body.link === 'string') fields.link = body.link;
    if (typeof body.order === 'number') fields.order = body.order;
    if (typeof body.isActive === 'boolean') fields.isActive = body.isActive;

    const company = await Company.findByIdAndUpdate(params.id, fields, { new: true });
    if (!company) return fail('Company not found', 404);
    return ok({ company: toJSON(company) });
  });
}

export async function DELETE(_req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const r = await Company.findByIdAndDelete(params.id);
    if (!r) return fail('Company not found', 404);
    return ok({ message: 'Deleted' });
  });
}
