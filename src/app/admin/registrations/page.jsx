'use client';
import { useEffect, useState } from 'react';
import { useListEventsQuery } from '@/store/api';

export default function AdminRegistrationsPage() {
  const { data } = useListEventsQuery();
  const [selected, setSelected] = useState('');
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(false);
  const events = data?.events || [];

  // Auto-select first event
  useEffect(() => {
    if (!selected && events.length) setSelected(events[0]._id);
  }, [events, selected]);

  useEffect(() => {
    if (!selected) { setRegs([]); return; }
    setLoading(true);
    fetch(`/api/registrations?eventId=${selected}`)
      .then((r) => r.json())
      .then((j) => setRegs(j.registrations || []))
      .finally(() => setLoading(false));
  }, [selected]);

  const event = events.find((e) => e._id === selected);
  const totals = regs.reduce((acc, r) => {
    acc[r.registrationType] = (acc[r.registrationType] || 0) + 1;
    acc.revenue += r.amount || 0;
    return acc;
  }, { revenue: 0 });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">BOOKINGS</p>
          <h1 className="text-3xl sm:text-4xl font-display">Registrations</h1>
        </div>
        <select className="input w-full sm:w-80" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Select event...</option>
          {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
        </select>
      </div>

      {event && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card p-4"><div className="text-[10px] text-charcoal-400 uppercase">Total</div><div className="text-2xl font-display text-terra-400">{regs.length}</div></div>
          <div className="card p-4"><div className="text-[10px] text-charcoal-400 uppercase">Individual</div><div className="text-2xl font-display">{totals.individual || 0}</div></div>
          <div className="card p-4"><div className="text-[10px] text-charcoal-400 uppercase">Groups</div><div className="text-2xl font-display">{totals.group || 0}</div></div>
          <div className="card p-4"><div className="text-[10px] text-charcoal-400 uppercase">Revenue</div><div className="text-lg font-bold text-terra-400">₹{totals.revenue.toLocaleString()}</div></div>
        </div>
      )}

      {loading ? <p className="text-charcoal-400">Loading...</p> : selected && (
        <>
          {/* Desktop */}
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Ticket</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Name / Group</th>
                  <th className="text-left p-3">Contact</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {regs.map((r) => (
                  <tr key={r._id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-mono text-xs text-terra-400">{r.ticketId}</td>
                    <td className="p-3 capitalize">{r.registrationType}</td>
                    <td className="p-3">
                      <div className="font-semibold">{r.groupName || r.name}</div>
                      {r.groupSize && <div className="text-xs text-charcoal-500">{r.groupSize} members</div>}
                    </td>
                    <td className="p-3 text-xs">
                      <div>{r.email || r.groupLeader?.email}</div>
                      <div className="text-charcoal-500">{r.phone || r.groupLeader?.phone}</div>
                    </td>
                    <td className="p-3 text-terra-400 font-bold">₹{r.amount}</td>
                    <td className="p-3">
                      <span className={`badge ${
                        r.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        r.status === 'attended' ? 'bg-blue-500/20 text-blue-400' :
                        r.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
                {regs.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-charcoal-400">No registrations yet.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {regs.map((r) => (
              <div key={r._id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-terra-400">{r.ticketId}</span>
                  <span className="badge bg-terra-500/20 text-terra-400 capitalize">{r.registrationType}</span>
                </div>
                <div className="font-semibold mt-2">{r.groupName || r.name}</div>
                <div className="text-xs text-charcoal-500">{r.email || r.groupLeader?.email}</div>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="text-terra-400 font-bold">₹{r.amount}</span>
                  <span className="capitalize text-charcoal-300">{r.status}</span>
                </div>
              </div>
            ))}
            {regs.length === 0 && <div className="card p-8 text-center text-charcoal-400">No registrations yet.</div>}
          </div>
        </>
      )}
    </div>
  );
}
