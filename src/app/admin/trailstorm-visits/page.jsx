'use client';
import { useState } from 'react';
import { useTrailstormAnalyticsQuery } from '@/store/api';
import IndiaHeatMap from '@/components/admin/IndiaHeatMap';

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
];

// Horizontal bar list used for sources / states / cities.
function BarList({ rows, labelKey, total, empty }) {
  if (!rows?.length) return <p className="text-sm text-charcoal-500">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r[labelKey]} className="text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-charcoal-200">{r[labelKey] || 'Unknown'}</span>
            <span className="text-charcoal-400">{r.count}{total ? ` · ${Math.round((r.count / total) * 100)}%` : ''}</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-terra-500 to-gold-500" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ rows }) {
  if (!rows?.length) return <p className="text-sm text-charcoal-500">No visits in this window yet.</p>;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="flex items-end gap-[3px] h-32">
      {rows.map((r) => (
        <div key={r.date} className="flex-1 min-w-[2px] bg-terra-500/70 hover:bg-terra-400 rounded-t transition-all"
             style={{ height: `${Math.max(3, (r.count / max) * 100)}%` }} title={`${r.date}: ${r.count}`} />
      ))}
    </div>
  );
}

export default function TrailstormVisits() {
  const [days, setDays] = useState(90);
  const { data, isLoading } = useTrailstormAnalyticsQuery({ days });

  const total = data?.total || 0;
  const byState = data?.byState || [];
  const bySource = data?.bySource || [];
  const byCity = data?.byCity || [];
  const byDay = data?.byDay || [];

  // Map for the heat-map: { stateName: count }, excluding 'Unknown'.
  const stateCounts = {};
  let knownStateVisits = 0;
  for (const s of byState) {
    if (s.state && s.state !== 'Unknown') { stateCounts[s.state] = s.count; knownStateVisits += s.count; }
  }
  const topState = byState.find((s) => s.state && s.state !== 'Unknown');

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">ANALYTICS</p>
          <h1 className="text-3xl sm:text-4xl font-display">Trailstorm Visits</h1>
        </div>
        <div className="flex gap-1 bg-charcoal-900 rounded-full p-1">
          {RANGES.map((r) => (
            <button key={r.days} onClick={() => setDays(r.days)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${days === r.days ? 'bg-terra-500 text-white' : 'text-charcoal-300 hover:text-white'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <p>Loading...</p> : (
        <div className="space-y-6">
          {/* Stat tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5">
              <p className="text-charcoal-400 text-sm">Total visits</p>
              <p className="text-4xl font-display text-terra-400">{total}</p>
            </div>
            <div className="card p-5">
              <p className="text-charcoal-400 text-sm">Top state</p>
              <p className="text-2xl font-display">{topState?.state || '—'}</p>
              <p className="text-xs text-charcoal-500">{topState ? `${topState.count} visits` : ''}</p>
            </div>
            <div className="card p-5">
              <p className="text-charcoal-400 text-sm">Top source</p>
              <p className="text-2xl font-display">{bySource[0]?.source || '—'}</p>
              <p className="text-xs text-charcoal-500">{bySource[0] ? `${bySource[0].count} visits` : ''}</p>
            </div>
            <div className="card p-5">
              <p className="text-charcoal-400 text-sm">Located visits</p>
              <p className="text-4xl font-display text-gold-400">{knownStateVisits}</p>
              <p className="text-xs text-charcoal-500">geo-identified</p>
            </div>
          </div>

          {/* Trend */}
          <div className="card p-5">
            <h2 className="font-display text-xl mb-3">Visits over time</h2>
            <TrendChart rows={byDay} />
          </div>

          {/* Map + states */}
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
            <div className="card p-5">
              <h2 className="font-display text-xl mb-3">Where visitors are from</h2>
              {knownStateVisits === 0 ? (
                <p className="text-sm text-charcoal-500">No geo-located visits yet in this window.</p>
              ) : (
                <IndiaHeatMap counts={stateCounts} />
              )}
            </div>
            <div className="card p-5">
              <h2 className="font-display text-xl mb-3">Top states</h2>
              <BarList rows={byState.slice(0, 12)} labelKey="state" total={total} empty="No data yet." />
            </div>
          </div>

          {/* Sources + cities */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="font-display text-xl mb-3">Traffic sources</h2>
              <BarList rows={bySource} labelKey="source" total={total} empty="No data yet." />
            </div>
            <div className="card p-5">
              <h2 className="font-display text-xl mb-3">Top cities</h2>
              <BarList rows={byCity} labelKey="city" total={total} empty="No city data yet." />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
