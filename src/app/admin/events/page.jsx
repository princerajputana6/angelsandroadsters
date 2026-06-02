'use client';
import Link from 'next/link';
import { useListEventsQuery, useDeleteEventMutation } from '@/store/api';
import toast from 'react-hot-toast';

export default function AdminEvents() {
  const { data, isLoading } = useListEventsQuery();
  const [del] = useDeleteEventMutation();
  const events = data?.events || [];

  const remove = async (slug) => {
    if (!confirm('Delete event?')) return;
    try { await del(slug).unwrap(); toast.success('Deleted'); } catch (e) { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">ADVENTURES</p>
          <h1 className="text-3xl sm:text-4xl font-display">Events</h1>
        </div>
        <Link href="/admin/events/new" className="btn btn-gold w-full sm:w-auto">+ New Event</Link>
      </div>

      {isLoading ? <p>Loading...</p> : (
        <>
          {/* Desktop */}
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Event</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Start</th>
                  <th className="text-left p-3">Location</th>
                  <th className="text-left p-3">Price</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {events.map((e) => (
                  <tr key={e._id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-semibold">{e.title}</td>
                    <td className="p-3"><span className="badge bg-terra-500/20 text-terra-400 uppercase">{e.eventType}</span></td>
                    <td className="p-3 text-xs">{new Date(e.startDate).toLocaleDateString()}</td>
                    <td className="p-3 text-charcoal-300">{e.location?.city}</td>
                    <td className="p-3 text-terra-400 font-bold">₹{e.pricing?.individual || 0}</td>
                    <td className="p-3 text-right space-x-3">
                      <Link href={`/events/${e.slug}`} target="_blank" className="text-xs text-charcoal-400 hover:text-terra-400">View</Link>
                      <Link href={`/admin/events/${e.slug}`} className="text-xs text-terra-400 hover:text-terra-300">Gallery</Link>
                      <button onClick={() => remove(e.slug)} className="text-xs text-red-400">Delete</button>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-charcoal-400">No events. <Link href="/admin/events/new" className="text-terra-400">Add one</Link>.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {events.map((e) => (
              <div key={e._id} className="card overflow-hidden">
                <div className="relative h-24 bg-charcoal-800">
                  {e.coverImage && <img src={e.coverImage} alt="" className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 to-transparent" />
                  <span className="absolute top-2 left-2 badge bg-terra-500/90 text-white uppercase">{e.eventType}</span>
                </div>
                <div className="p-3">
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-xs text-charcoal-400 mt-0.5">📍 {e.location?.city}, {e.location?.state}</div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span>{new Date(e.startDate).toLocaleDateString()}</span>
                    <span className="text-terra-400 font-bold">₹{e.pricing?.individual || 0}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-charcoal-800">
                    <Link href={`/events/${e.slug}`} target="_blank" className="text-xs text-charcoal-400">View →</Link>
                    <Link href={`/admin/events/${e.slug}`} className="text-xs text-terra-400">Gallery</Link>
                    <button onClick={() => remove(e.slug)} className="text-xs text-red-400">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && <div className="card p-8 text-center text-charcoal-400">No events. <Link href="/admin/events/new" className="text-terra-400">Add one</Link>.</div>}
          </div>
        </>
      )}
    </div>
  );
}
