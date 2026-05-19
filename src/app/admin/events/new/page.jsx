'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateEventMutation } from '@/store/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NewEventPage() {
  const router = useRouter();
  const [createEvent, { isLoading }] = useCreateEventMutation();
  const [f, setF] = useState({
    title: '', description: '', eventType: 'rally',
    coverImage: '',
    venue: '', city: '', state: '',
    startDate: '', endDate: '', registrationDeadline: '',
    capIndiv: 100, capGroup: 20, capVisit: 500,
    priceIndiv: 0, priceGroupBase: 0, priceGroupPerHead: 0, priceVisitor: 0,
    highlights: '', tags: '',
  });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createEvent({
        title: f.title,
        description: f.description,
        eventType: f.eventType,
        coverImage: f.coverImage,
        location: { venue: f.venue, city: f.city, state: f.state },
        startDate: f.startDate,
        endDate: f.endDate,
        registrationDeadline: f.registrationDeadline || undefined,
        capacity: { individual: Number(f.capIndiv), group: Number(f.capGroup), visitor: Number(f.capVisit) },
        pricing: {
          individual: Number(f.priceIndiv),
          groupBase: Number(f.priceGroupBase),
          groupPerHead: Number(f.priceGroupPerHead),
          visitor: Number(f.priceVisitor),
        },
        highlights: f.highlights.split('\n').map((s) => s.trim()).filter(Boolean),
        tags: f.tags.split(',').map((s) => s.trim()).filter(Boolean),
        isPublished: true,
      }).unwrap();
      toast.success('Event created');
      router.push('/admin/events');
    } catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <Link href="/admin/events" className="text-xs text-charcoal-400 hover:text-terra-400">← Back to Events</Link>
        <h1 className="text-3xl sm:text-4xl font-display mt-2">New Event</h1>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5 sm:p-6 space-y-4">
          <h3 className="font-display text-xl">Event details</h3>
          <div><label className="label">Title</label><input className="input" required value={f.title} onChange={set('title')} /></div>
          <div><label className="label">Description</label><textarea className="input" rows="5" required value={f.description} onChange={set('description')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={f.eventType} onChange={set('eventType')}>
                {['rally', 'trek', 'expedition', 'expo', 'workshop', 'meetup'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Cover image URL</label><input className="input" value={f.coverImage} onChange={set('coverImage')} placeholder="https://..." /></div>
          </div>
          <div><label className="label">Venue</label><input className="input" value={f.venue} onChange={set('venue')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">City</label><input className="input" required value={f.city} onChange={set('city')} /></div>
            <div><label className="label">State</label><input className="input" value={f.state} onChange={set('state')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start</label><input className="input" type="date" required value={f.startDate} onChange={set('startDate')} /></div>
            <div><label className="label">End</label><input className="input" type="date" required value={f.endDate} onChange={set('endDate')} /></div>
          </div>
          <div><label className="label">Registration deadline</label><input className="input" type="date" value={f.registrationDeadline} onChange={set('registrationDeadline')} /></div>
        </div>

        <div className="card p-5 sm:p-6 space-y-4">
          <h3 className="font-display text-xl">Pricing &amp; capacity</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Individual (₹)</label><input className="input" type="number" value={f.priceIndiv} onChange={set('priceIndiv')} /></div>
            <div><label className="label">Visitor (₹)</label><input className="input" type="number" value={f.priceVisitor} onChange={set('priceVisitor')} /></div>
            <div><label className="label">Group base (₹)</label><input className="input" type="number" value={f.priceGroupBase} onChange={set('priceGroupBase')} /></div>
            <div><label className="label">Group / head (₹)</label><input className="input" type="number" value={f.priceGroupPerHead} onChange={set('priceGroupPerHead')} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Cap: Indiv</label><input className="input" type="number" value={f.capIndiv} onChange={set('capIndiv')} /></div>
            <div><label className="label">Cap: Group</label><input className="input" type="number" value={f.capGroup} onChange={set('capGroup')} /></div>
            <div><label className="label">Cap: Visitor</label><input className="input" type="number" value={f.capVisit} onChange={set('capVisit')} /></div>
          </div>
          <div><label className="label">Highlights (one per line)</label><textarea className="input" rows="4" value={f.highlights} onChange={set('highlights')} /></div>
          <div><label className="label">Tags (comma)</label><input className="input" value={f.tags} onChange={set('tags')} /></div>
          <button type="submit" disabled={isLoading} className="btn btn-gold w-full h-12">{isLoading ? 'Saving...' : 'Create Event'}</button>
        </div>
      </form>
    </div>
  );
}
