'use client';
import { useState } from 'react';
import {
  useListEventsQuery,
  useListTeamRegistrationsQuery,
  useIssueTeamRegistrationMutation,
} from '@/store/api';
import toast from 'react-hot-toast';

const TYPES = ['staff', 'volunteer', 'organizer'];
const TYPE_STYLES = {
  staff: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  volunteer: 'bg-green-500/20 text-green-400 border border-green-500/30',
  organizer: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

const EMPTY = { eventId: '', registrationType: 'staff', name: '', email: '', phone: '' };

export default function TeamPassesPage() {
  const { data: eventsData } = useListEventsQuery();
  const events = eventsData?.events || [];
  const { data, isLoading } = useListTeamRegistrationsQuery();
  const [issue, { isLoading: issuing }] = useIssueTeamRegistrationMutation();
  const [form, setForm] = useState(EMPTY);

  const regs = data?.registrations || [];
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.eventId) return toast.error('Select an event');
    if (!form.name.trim()) return toast.error('Name is required');
    try {
      const res = await issue({
        eventId: form.eventId,
        registrationType: form.registrationType,
        name: form.name,
        email: form.email,
        phone: form.phone,
      }).unwrap();
      toast.success(`Issued · ${res.registration.ticketId}`);
      setForm((f) => ({ ...EMPTY, eventId: f.eventId, registrationType: f.registrationType }));
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to issue');
    }
  };

  const copyId = (id) => {
    navigator.clipboard?.writeText(id);
    toast.success('Registration ID copied');
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-display">Team Passes</h1>
        <p className="text-sm text-charcoal-400 mt-1">
          Issue registration IDs for staff, volunteers and organizers. Each gets a unique ID usable for resort booking.
        </p>
      </div>

      <form onSubmit={submit} className="card p-6 mb-8 space-y-4">
        <h3 className="font-display text-xl">Issue a pass</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Event *</label>
            <select className="input" value={form.eventId} onChange={set('eventId')} required>
              <option value="">Select event…</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>{ev.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Type *</label>
            <select className="input" value={form.registrationType} onChange={set('registrationType')}>
              {TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
          <div><label className="label">Full name *</label><input className="input" value={form.name} onChange={set('name')} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={set('email')} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
        </div>
        <button type="submit" disabled={issuing} className="btn btn-gold">{issuing ? 'Issuing…' : 'Issue pass'}</button>
      </form>

      <h3 className="font-display text-xl mb-3">Issued passes</h3>
      {isLoading ? (
        <div className="text-charcoal-400 text-sm">Loading…</div>
      ) : regs.length === 0 ? (
        <div className="card p-8 text-center text-charcoal-400">No team passes issued yet.</div>
      ) : (
        <div className="space-y-2">
          {regs.map((r) => (
            <div key={r._id} className="card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => copyId(r.ticketId)} title="Copy ID" className="font-mono font-bold text-terra-400 hover:text-terra-300">{r.ticketId}</button>
                  <span className={`badge text-xs capitalize ${TYPE_STYLES[r.registrationType] || ''}`}>{r.registrationType}</span>
                </div>
                <div className="text-sm mt-1">
                  <span className="font-semibold">{r.name}</span>
                  <span className="text-charcoal-400"> · {r.email || 'no email'} · {r.phone || 'no phone'}</span>
                </div>
                {r.event?.title && <div className="text-xs text-charcoal-500 mt-0.5">{r.event.title}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
