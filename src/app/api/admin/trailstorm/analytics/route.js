import { connectDB } from '@/lib/db';
import PageView from '@/lib/models/PageView';
import { requireAdmin } from '@/lib/auth';
import { ok, handler } from '@/lib/apiUtils';

// Visit analytics for the Trailstorm page: total visits, a by-state breakdown
// (for the India heat-map), traffic sources, top cities, and a 30-day trend.
// Optional ?days=N window (default 90).
export async function GET(req) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const days = Math.max(1, Math.min(365, Number(searchParams.get('days')) || 90));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const match = { page: 'trailstorm', createdAt: { $gte: since } };

    const [total, byState, bySource, byCity, byDay] = await Promise.all([
      PageView.countDocuments(match),
      PageView.aggregate([
        { $match: match },
        { $group: { _id: { $ifNull: ['$state', 'Unknown'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      PageView.aggregate([
        { $match: match },
        { $group: { _id: { $ifNull: ['$source', 'Direct'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      PageView.aggregate([
        { $match: { ...match, city: { $nin: [null, ''] } } },
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
      PageView.aggregate([
        { $match: match },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return ok({
      days,
      total,
      byState: byState.map((r) => ({ state: r._id, count: r.count })),
      bySource: bySource.map((r) => ({ source: r._id, count: r.count })),
      byCity: byCity.map((r) => ({ city: r._id, count: r.count })),
      byDay: byDay.map((r) => ({ date: r._id, count: r.count })),
    });
  });
}
