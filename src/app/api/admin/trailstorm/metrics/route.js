// Trailstorm registration metrics — FOC (complimentary) vs PAID breakdown.
// Used by the admin Trailstorm dashboard. Pass ?event=<id> to scope; without
// it returns the totals across every event.

import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Registration from '@/lib/models/Registration';
import CompTicket from '@/lib/models/CompTicket';
import { requireAdmin } from '@/lib/auth';
import { ok, handler } from '@/lib/apiUtils';

export async function GET(req) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const event = searchParams.get('event');

    // `find` / `countDocuments` cast strings → ObjectId via the schema, but
    // `aggregate` does not — build a parallel filter for $match using ObjectId.
    const eventFilter = event ? { event } : {};
    const eventFilterAgg = event && mongoose.isValidObjectId(event)
      ? { event: new mongoose.Types.ObjectId(event) }
      : {};
    const compFilter = { ...eventFilter, status: 'active' };
    const compFilterAgg = { ...eventFilterAgg, status: 'active' };

    const [
      // Comp tickets
      vipPassAgg,                  // sum of numPasses for VIP entries
      clubChampionDocs,            // count of champion entries
      individualFOCDocs,           // count of individual FOC competitor entries
      focClubsDistinct,            // distinct clubs with champion entries
      // Registrations
      paidGroupRegs,
      paidIndividualRegs,
      paidVisitorRegs,
      paidGroupChampSeatsAgg,      // 4 × paid clubs (group members)
      totalRegs,
    ] = await Promise.all([
      CompTicket.aggregate([
        { $match: { ...compFilterAgg, category: 'vip' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$numPasses', 1] } } } },
      ]),
      CompTicket.countDocuments({ ...compFilter, category: 'club_champion' }),
      CompTicket.countDocuments({ ...compFilter, category: 'individual_competitor' }),
      CompTicket.distinct('clubName', { ...compFilter, category: 'club_champion', clubName: { $ne: '' } }),

      Registration.countDocuments({ ...eventFilter, registrationType: 'group', paymentStatus: 'paid' }),
      Registration.countDocuments({ ...eventFilter, registrationType: 'individual', paymentStatus: 'paid' }),
      Registration.countDocuments({ ...eventFilter, registrationType: 'visitor',   paymentStatus: 'paid' }),
      Registration.aggregate([
        { $match: { ...eventFilterAgg, registrationType: 'group', paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$groupSize', 4] } } } },
      ]),
      Registration.countDocuments(eventFilter),
    ]);

    const vipPassesFoc       = vipPassAgg[0]?.total || 0;
    const clubChampionsFoc   = clubChampionDocs;
    const focCompetitors     = individualFOCDocs;
    const focClubs           = focClubsDistinct.length;
    const paidCompetitors    = paidIndividualRegs;
    const paidTickets        = paidVisitorRegs;
    const clubChampionsPaid  = paidGroupChampSeatsAgg[0]?.total || (paidGroupRegs * 4);

    // Total = every paid registration + every active comp issue (VIP passes
    // counted by N, champions/individuals counted by row)
    const focIssued = vipPassesFoc + clubChampionsFoc + focCompetitors;
    const totalActive = totalRegs + focIssued;

    return ok({
      metrics: {
        vipPassesFoc,
        clubChampionsPaid,
        focCompetitors,
        focClubs,
        paidCompetitors,
        paidTickets,
        clubChampionsFoc,
        paidGroupRegs,
        totalRegistrations: totalRegs,
        totalIncludingFoc: totalActive,
      },
    });
  });
}
