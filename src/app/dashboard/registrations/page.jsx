'use client';
import { useMyRegistrationsQuery } from '@/store/api';

export default function MyRegistrationsPage() {
  const { data, isLoading } = useMyRegistrationsQuery();
  const regs = data?.registrations || [];

  if (isLoading) return <p className="text-charcoal-400">Loading...</p>;
  if (regs.length === 0) return <p className="text-charcoal-400">No event registrations yet.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-display">My Event Tickets</h1>
      {regs.map((r) => (
        <div key={r._id} className="card p-5 flex flex-wrap items-center gap-5">
          <div className="flex-1 min-w-[220px]">
            <p className="text-xs text-terra-400 uppercase">{r.registrationType} · {r.status}</p>
            <h3 className="font-display text-2xl">{r.event?.title}</h3>
            <p className="text-sm text-charcoal-300 mt-1">
              📅 {r.event?.startDate ? new Date(r.event.startDate).toDateString() : ''}
            </p>
            <p className="text-sm text-charcoal-300">📍 {r.event?.location?.city}, {r.event?.location?.state}</p>
            <p className="mt-2 font-mono text-sm text-terra-400">Ticket: {r.ticketId}</p>
          </div>
          {r.qrCode && (
            <div className="bg-white p-2 rounded">
              <img src={r.qrCode} alt="QR" className="w-32 h-32" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
