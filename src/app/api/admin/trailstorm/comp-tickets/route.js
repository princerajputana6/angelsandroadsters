import { connectDB } from '@/lib/db';
import CompTicket from '@/lib/models/CompTicket';
import Event from '@/lib/models/Event';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';
import crypto from 'crypto';

function makeTicketId(category) {
  const prefix = category === 'vip' ? 'VIP'
    : category === 'club_champion' ? 'CHAMP'
    : 'COMP';
  return `${prefix}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

export async function GET(req) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const filter = {};
    if (searchParams.get('event')) filter.event = searchParams.get('event');
    if (searchParams.get('category')) filter.category = searchParams.get('category');
    if (searchParams.get('status')) filter.status = searchParams.get('status');

    const tickets = await CompTicket.find(filter)
      .populate('event', 'title slug')
      .populate('createdBy', 'name email')
      .populate('clubReg', 'ticketId groupName teamCaptainName')
      .sort('-createdAt')
      .lean();
    return ok({ compTickets: toJSON(tickets) });
  });
}

export async function POST(req) {
  return handler(async () => {
    const admin = await requireAdmin();
    await connectDB();
    const body = await req.json();

    if (!body.event) return fail('event is required', 400);
    if (!body.category || !CompTicket.CATEGORIES.includes(body.category)) {
      return fail('Invalid category', 400);
    }
    const eventExists = await Event.exists({ _id: body.event });
    if (!eventExists) return fail('Event not found', 404);

    // Club Champion shortcut: when 4 champions are submitted together, create
    // 4 docs in one call so the admin doesn't have to repeat club fields.
    if (body.category === 'club_champion' && Array.isArray(body.champions)) {
      const docs = body.champions
        .map((c, i) => c?.name?.trim()
          ? {
              event: body.event,
              category: 'club_champion',
              ticketId: makeTicketId('club_champion'),  // pre-save hook skipped by insertMany
              name: c.name.trim(),
              mobile: c.mobile || '',
              email: c.email || '',
              motorcycle: c.motorcycle || '',
              clubName: body.clubName || '',
              clubId: body.clubId || '',
              clubReg: body.clubReg || null,
              slot: i + 1,
              issuedBy: body.issuedBy || admin.name || '',
              remarks: body.remarks || '',
              createdBy: admin._id,
            }
          : null)
        .filter(Boolean);
      if (docs.length === 0) return fail('Add at least one champion name', 400);
      const created = await CompTicket.insertMany(docs);
      return ok({ compTickets: toJSON(created) }, 201);
    }

    if (!body.name?.trim()) return fail('name is required', 400);

    const doc = {
      event: body.event,
      category: body.category,
      name: body.name.trim(),
      mobile: body.mobile || '',
      email: body.email || '',
      remarks: body.remarks || '',
      issuedBy: body.issuedBy || admin.name || '',
      createdBy: admin._id,
    };

    if (body.category === 'vip') {
      if (!body.vipType || !CompTicket.VIP_TYPES.includes(body.vipType)) {
        return fail('Pick a VIP type', 400);
      }
      doc.vipType = body.vipType;
      doc.numPasses = Math.max(1, Number(body.numPasses) || 1);
    } else if (body.category === 'individual_competitor') {
      if (!body.riderCategory || !CompTicket.COMPETITOR_TYPES.includes(body.riderCategory)) {
        return fail('Pick a competitor category', 400);
      }
      doc.riderCategory = body.riderCategory;
      doc.motorcycle = body.motorcycle || '';
      doc.reasonForFOC = body.reasonForFOC || '';
      doc.approvedBy = body.approvedBy || '';
    } else if (body.category === 'club_champion') {
      doc.clubName = body.clubName || '';
      doc.clubId = body.clubId || '';
      doc.clubReg = body.clubReg || null;
      doc.slot = body.slot || undefined;
      doc.motorcycle = body.motorcycle || '';
    }

    const created = await CompTicket.create(doc);
    return ok({ compTicket: toJSON(created) }, 201);
  });
}
