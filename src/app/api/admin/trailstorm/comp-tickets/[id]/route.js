import { connectDB } from '@/lib/db';
import CompTicket from '@/lib/models/CompTicket';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function PUT(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();

    const t = await CompTicket.findById(params.id);
    if (!t) return fail('Not found', 404);

    const fields = ['name', 'mobile', 'email', 'remarks', 'issuedBy',
      'vipType', 'numPasses',
      'clubName', 'clubId', 'slot',
      'motorcycle', 'riderCategory', 'reasonForFOC', 'approvedBy',
      'status'];
    for (const f of fields) {
      if (body[f] !== undefined) t[f] = body[f];
    }
    await t.save();
    return ok({ compTicket: toJSON(t) });
  });
}

export async function DELETE(_req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const r = await CompTicket.findByIdAndDelete(params.id);
    if (!r) return fail('Not found', 404);
    return ok({ message: 'Deleted' });
  });
}
