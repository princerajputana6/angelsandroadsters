'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useListRacesQuery, useCombinedStandingsQuery } from '@/store/api';

export default function CombinedStandingsPage() {
  const { data: racesData, isLoading: loadingRaces } = useListRacesQuery();
  const allRaces = useMemo(() => racesData?.races || [], [racesData]);

  const [selected, setSelected] = useState([]); // race ids to combine
  const [bothOnly, setBothOnly] = useState(false); // only riders in every selected race

  // Default: preselect every race in the most recent event, so the common case
  // (combine this event's rounds) works with no clicks.
  useEffect(() => {
    if (selected.length || !allRaces.length) return;
    const firstEvent = allRaces[0]?.event?._id;
    const ids = allRaces.filter((r) => r.event?._id === firstEvent).map((r) => r._id);
    setSelected(ids.length ? ids : allRaces.map((r) => r._id));
  }, [allRaces, selected.length]);

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const { data, isLoading, isFetching } = useCombinedStandingsQuery(
    { races: selected },
    { skip: selected.length === 0 }
  );
  const races = data?.races || [];
  const totalRaces = data?.totalRaces || selected.length;
  let standings = data?.standings || [];
  if (bothOnly) standings = standings.filter((s) => s.rounds >= totalRaces);

  // Group the picker by event for readability.
  const grouped = useMemo(() => {
    const m = new Map();
    for (const r of allRaces) {
      const key = r.event?.title || 'No event';
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(r);
    }
    return [...m.entries()];
  }, [allRaces]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <Link href="/admin/race" className="text-xs text-charcoal-400 hover:text-terra-400">← Race Dashboard</Link>
          <h1 className="text-3xl font-display mt-1">🏆 Championship Standings</h1>
          <p className="text-sm text-charcoal-400">Tick the races to combine. Each rider&apos;s total adds up their points from every selected round.</p>
        </div>
      </div>

      {/* Race picker */}
      <div className="card p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-charcoal-500">Races to combine</span>
          <span className="text-[11px] text-charcoal-500">{selected.length} selected</span>
        </div>
        {loadingRaces ? <p className="text-charcoal-400 text-sm">Loading races…</p> : (
          <div className="space-y-3">
            {grouped.map(([evTitle, rs]) => (
              <div key={evTitle}>
                <div className="text-[11px] uppercase tracking-wider text-charcoal-500 mb-1">{evTitle}</div>
                <div className="flex flex-wrap gap-2">
                  {rs.map((r) => {
                    const on = selected.includes(r._id);
                    return (
                      <button key={r._id} type="button" onClick={() => toggle(r._id)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition ${on ? 'border-terra-500/60 bg-terra-500/15 text-terra-300' : 'border-charcoal-700 text-charcoal-300 hover:border-terra-500/40'}`}>
                        {on ? '✓ ' : ''}{r.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <label className="flex items-center gap-2 mt-3 text-sm text-charcoal-300 cursor-pointer">
          <input type="checkbox" checked={bothOnly} onChange={(e) => setBothOnly(e.target.checked)} className="accent-terra-500" />
          Only show riders who raced <span className="text-charcoal-100 font-semibold">every</span> selected round
        </label>
      </div>

      {selected.length === 0 ? (
        <div className="card p-12 text-center text-charcoal-400">Select at least one race above.</div>
      ) : isLoading || isFetching ? (
        <p className="text-charcoal-400">Loading standings…</p>
      ) : standings.length === 0 ? (
        <div className="card p-12 text-center text-charcoal-400">
          {bothOnly
            ? 'No rider competed in every selected round yet.'
            : 'No points yet. Assign points on each race’s Results page (⚡ Auto-points with the right table), then they tally up here.'}
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
                <th className="text-center p-3">Rounds</th>
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
                          : (
                            <span className={cell.points ? '' : 'text-charcoal-500'}>
                              {cell.points}
                              {cell.position ? <span className="text-charcoal-500 text-[11px]"> · P{cell.position}</span> : ''}
                            </span>
                          )}
                      </td>
                    );
                  })}
                  <td className="p-3 text-center tabular-nums">
                    <span className={s.rounds >= totalRaces ? 'text-emerald-400 font-semibold' : 'text-charcoal-400'}>{s.rounds}/{totalRaces}</span>
                  </td>
                  <td className="p-3 text-right font-display text-lg text-emerald-400 tabular-nums">{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-charcoal-500 mt-3">
        Points come from each race’s ranking and its scoring table (Fury Circuit / Shadow Run), set on that race’s Results page.
        “P2” is the rider’s finishing position in that round. “Rounds” shows how many of the selected races they completed —
        tick the box above to show only riders who raced them all.
      </p>
    </div>
  );
}
