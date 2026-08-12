'use client';
import Link from 'next/link';
import { useListResortsQuery, useDeleteResortMutation } from '@/store/api';
import toast from 'react-hot-toast';

export default function AdminResortsPage() {
  const { data, isLoading } = useListResortsQuery({ all: 1 });
  const [deleteResort] = useDeleteResortMutation();
  const resorts = data?.resorts || [];

  const handleDelete = async (slug, name) => {
    if (!confirm(`Delete resort "${name}"? This cannot be undone.`)) return;
    try {
      await deleteResort(slug).unwrap();
      toast.success('Resort deleted');
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  };

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display">Resorts</h1>
          <p className="text-sm text-charcoal-400 mt-1">Configure resorts, room types and inventory for Trailstorm bookings</p>
        </div>
        <Link href="/admin/resorts/new" className="btn btn-gold">+ New resort</Link>
      </div>

      {isLoading ? (
        <div className="text-charcoal-400 text-sm">Loading…</div>
      ) : resorts.length === 0 ? (
        <div className="card p-8 text-center text-charcoal-400">No resorts yet. Create one to get started.</div>
      ) : (
        <div className="space-y-3">
          {resorts.map((r) => {
            const totalRooms = (r.roomTypes || []).reduce((s, rt) => s + (rt.totalRooms || 0), 0);
            const minPrice = Math.min(...(r.roomTypes || []).map((rt) => rt.pricePerNight || 0), Infinity);
            return (
              <div key={r._id} className={`card p-4 flex items-center gap-4 ${!r.isPublished ? 'opacity-60' : ''}`}>
                {r.coverImage ? (
                  <img src={r.coverImage} alt={r.name} className="w-16 h-16 rounded-lg object-cover border border-charcoal-700 shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-charcoal-800 flex items-center justify-center text-2xl shrink-0">🏨</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{r.name}</span>
                    <span className={`badge text-xs ${r.isPublished ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-charcoal-700 text-charcoal-300'}`}>
                      {r.isPublished ? 'Published' : 'Hidden'}
                    </span>
                  </div>
                  <div className="text-sm text-charcoal-400 mt-1">
                    {r.roomTypes?.length || 0} room type(s) · {totalRooms} rooms
                    {minPrice !== Infinity && <> · from {inr(minPrice)}/night</>}
                    {r.location?.city && <> · {r.location.city}</>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/admin/resorts/${r.slug}`} className="btn btn-outline text-xs px-3 py-1.5">Edit</Link>
                  <button onClick={() => handleDelete(r.slug, r.name)} className="btn text-xs px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
