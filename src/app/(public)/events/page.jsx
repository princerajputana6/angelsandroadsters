'use client';
import { useState } from 'react';
import { useListEventsQuery } from '@/store/api';
import EventCard from '@/components/events/EventCard';

export default function EventsPage() {
  const [type, setType] = useState('');
  const { data, isLoading } = useListEventsQuery({ type });
  const events = data?.events || [];

  const types = [
    { value: '', label: 'All' },
    { value: 'rally', label: 'Rallies' },
    { value: 'trek', label: 'Treks' },
    { value: 'expedition', label: 'Expeditions' },
    { value: 'expo', label: 'Expos' },
    { value: 'workshop', label: 'Workshops' },
    { value: 'meetup', label: 'Meetups' },
  ];

  return (
    <div className="container-x pt-28 sm:pt-32 pb-16">
      <p className="eyebrow mb-2">EVENTS</p>
      <h1 className="section-title mb-2">ADVENTURES AWAIT</h1>
      <p className="text-charcoal-400 mb-8 max-w-xl">Curated rallies, treks, expos, and meetups for the Angels & Roadsters crew.</p>

      <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
        {types.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition ${
              type === t.value ? 'bg-terra-500 text-white border-terra-500' : 'bg-charcoal-900/60 text-charcoal-300 border-charcoal-800 hover:border-charcoal-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-charcoal-400">Loading...</p>
      ) : events.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-charcoal-300">No events yet.</p>
          <p className="text-sm text-charcoal-500 mt-2">Run <code className="text-terra-400">npm run seed</code> or create one in admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((e) => <EventCard key={e._id} event={e} />)}
        </div>
      )}
    </div>
  );
}
