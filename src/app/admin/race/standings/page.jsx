'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useListEventsQuery, useCombinedStandingsQuery } from '@/store/api';

export default function CombinedStandingsPage() {
  const { data: eventsData, isLoading: loadingEvents } = useListEventsQuery();
  const events = eventsData?.events || [];
  const [eventId, setEventId] = useState('');

  // Default to the first event once they load.
  useEffect(() => {
    if (!eventId && events.length) setEventId(events[0]._id);
  }, [events, eventId]);

  const { data, isLoading, isFetching } = useCombinedStandingsQuery(eventId, { skip: !eventId });
  const races = data?.races || [];
  const standings = data?.standings || [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <Link href="/admin/race" className="text-xs text-charcoal-400 hover:text-terra-400">← Race Dashboard</Link>
          <h1 className="text-3xl font-display mt-1">🏆 Championship Standings</h1>
          <p className="text-sm text-charcoal-400">Combined points across every race in the event.</p>
        </div>
        <label className="block">
          <span className="text-xs text-charcoal-400">Event</span>
          <select className="input mt-1 w-full sm:w-64" value={eventId} onChange={(e) => setEventId(e.target.value)}>
            {loadingEvents && <option>Loading…</option>}
            {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
          </select>
        </label>
      </div>

      {isLoading || isFetching ? (
        <p className="text-charcoal-400">Loading standings…</p>
      ) : standings.length === 0 ? (
        <div className="card p-12 text-center text-charcoal-400">
          No points yet for this event. Assign points on each race’s Results page (⚡ Auto-points), then they tally up here.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
              <tr>
                <th className="text-left p-3">Pos</th>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Rider</th>
                {races.map((r) => (
                  <th key={r._id} className="text-right p-3 whitespace-nowrap">{r.name}</th>
                ))}
                <th className="text-right p-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {standings.map((s, i) => (
                <tr key={s.key} className={`hover:bg-white/[0.02] ${i < 3 ? 'bg-gold-500/[0.04]' : ''}`}>
                  <td className="p-3 font-display text-lg">{s.rank}</td>
                  <td className="p-3 font-display text-terra-400">{s.participantNo != null ? String(s.participantNo).padStart(3, '0') : '—'}</td>
                  <td className="p-3 font-semibold">{s.name}</td>
                  {races.map((r) => {
                    const cell = s.perRace[r._id];
                    const dsq = cell?.status === 'disqualified';
                    return (
                      <td key={r._id} className="p-3 text-right tabular-nums">
                        {!cell ? <span className="text-charcoal-600">—</span>
                          : dsq ? <span className="text-red-400" title="Disqualified">DSQ</span>
                          : <span className={cell.points ? '' : 'text-charcoal-500'}>{cell.points}</span>}
                      </td>
                    );
                  })}
                  <td className="p-3 text-right font-display text-lg text-emerald-400 tabular-nums">{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-charcoal-500 mt-3">
        Points come from each race’s Results page. A rider’s row shows their score per round and the combined total. “—” means they didn’t race that round.
      </p>
    </div>
  );
}
