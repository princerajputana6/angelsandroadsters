import { connectDB } from '@/lib/db';
import Company from '@/lib/models/Company';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function GET() {
  return handler(async () => {
    await connectDB();
    const companies = await Company.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .lean();
    return ok({ companies: toJSON(companies) });
  });
}

export async function POST(req) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();
    if (!body?.name?.trim()) return fail('Name is required', 400);
    const company = await Company.create({
      name: body.name.trim(),
      logo: body.logo || '',
      link: body.link || '',
      order: Number(body.order) || 0,
      isActive: body.isActive !== false,
    });
    return ok({ company: toJSON(company) }, 201);
  });
}
