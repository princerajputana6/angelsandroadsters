'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  useRaceDashboardQuery,
  useListEventsQuery,
  useCreateRaceMutation,
  useRaceIndexReportQuery,
  useEnsureRaceIndexesMutation,
} from '@/store/api';

const STATUS_STYLE = {
  draft: 'bg-charcoal-700/40 text-charcoal-300',
  configured: 'bg-blue-500/20 text-blue-300',
  locked: 'bg-amber-500/20 text-amber-300',
  active: 'bg-emerald-500/20 text-emerald-300',
  paused: 'bg-orange-500/20 text-orange-300',
  completed: 'bg-terra-500/20 text-terra-400',
  archived: 'bg-charcoal-800/60 text-charcoal-500',
};

function Tile({ label, value, accent, icon }) {
  return (
    <div className="card p-4 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-terra-500/70 to-gold-500/70" />
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-charcoal-500">{label}</div>
        <span className="text-lg opacity-70">{icon}</span>
      </div>
      <div className={`text-3xl font-display mt-1 ${accent || ''}`}>{value}</div>
    </div>
  );
}

function NewRaceModal({ onClose }) {
  const { data: eventsData } = useListEventsQuery();
  const [createRace, { isLoading }] = useCreateRaceMutation();
  const events = eventsData?.events || [];
  const [form, setForm] = useState({
    event: '', name: '', startModel: 'individual', finishType: 'laps', expectedLaps: 1,
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.event || !form.name.trim()) return toast.error('Event and name are required');
    try {
      await createRace({
        event: form.event,
        name: form.name.trim(),
        startModel: form.startModel,
        finishType: form.finishType,
        expectedLaps: Number(form.expectedLaps) || 0,
      }).unwrap();
      toast.success('Race created');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create race');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-charcoal-950/80 backdrop-blur overflow-y-auto">
      <form onSubmit={submit} className="card-glass p-4 sm:p-6 w-full max-w-lg space-y-4 my-4 sm:my-0 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-display">New Race</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full border border-charcoal-700">✕</button>
        </div>

        <label className="block">
          <span className="text-xs text-charcoal-400">Event</span>
          <select
            className="input mt-1 w-full"
            value={form.event}
            onChange={(e) => setForm({ ...form, event: e.target.value })}
          >
            <option value="">Select event…</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>{ev.title}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-charcoal-400">Race name</span>
          <input
            className="input mt-1 w-full"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Pro Enduro — Loop A"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-charcoal-400">Start model</span>
            <select className="input mt-1 w-full" value={form.startModel} onChange={(e) => setForm({ ...form, startModel: e.target.value })}>
              <option value="individual">Individual start</option>
              <option value="common">Common start</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-charcoal-400">Finish by</span>
            <select className="input mt-1 w-full" value={form.finishType} onChange={(e) => setForm({ ...form, finishType: e.target.value })}>
              <option value="laps">Laps</option>
              <option value="time">Time</option>
            </select>
          </label>
        </div>

        {form.finishType === 'laps' && (
          <label className="block">
            <span className="text-xs text-charcoal-400">Expected laps</span>
            <input type="number" min={0} className="input mt-1 w-full" value={form.expectedLaps} onChange={(e) => setForm({ ...form, expectedLaps: e.target.value })} />
          </label>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn btn-gold">{isLoading ? 'Creating…' : 'Create race'}</button>
        </div>
      </form>
    </div>
  );
}

function IndexHealthCard() {
  const { data, isLoading, refetch } = useRaceIndexReportQuery();
  const [ensure, { isLoading: ensuring }] = useEnsureRaceIndexesMutation();

  const run = async () => {
    try {
      const res = await ensure().unwrap();
      if (res.ok) toast.success('All race indexes verified');
      else toast.error('Some indexes could not build — check duplicates');
      refetch();
    } catch (err) {
      const r = err?.data;
      if (r?.report) toast.error('Index build issue — resolve duplicate data first');
      else toast.error(err?.data?.message || 'Failed to ensure indexes');
    }
  };

  const totalIndexes = (data?.report || []).reduce((n, m) => n + (m.indexes?.length || 0), 0);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-charcoal-500">Database integrity</div>
          <div className="text-sm text-charcoal-300 mt-1">
            {isLoading ? 'Checking…' : `${totalIndexes} race index(es) present across ${data?.report?.length || 0} collections`}
          </div>
        </div>
        <button onClick={run} disabled={ensuring} className="btn btn-outline text-xs whitespace-nowrap">
          {ensuring ? 'Verifying…' : 'Verify / create indexes'}
        </button>
      </div>
      <p className="text-[11px] text-charcoal-500 mt-2">
        Unique indexes enforce race-number and idempotency guarantees. Run this once per environment before enabling race operations.
      </p>
    </div>
  );
}

export default function RaceDashboard() {
  // Light polling so a race created by one admin shows up for the others.
  const { data, isLoading } = useRaceDashboardQuery(undefined, { pollingInterval: 15000, refetchOnFocus: true });
  const [showNew, setShowNew] = useState(false);
  const summary = data?.summary;
  const races = data?.races || [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">RACE MANAGEMENT</p>
          <h1 className="text-3xl sm:text-4xl font-display">Race Dashboard</h1>
        </div>
        <button onClick={() => setShowNew(true)} className="btn btn-gold w-full sm:w-auto">+ New Race</button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Tile label="Races" icon="🏁" value={isLoading ? '—' : summary?.totalRaces ?? 0} />
        <Tile label="Entries" icon="🎫" value={isLoading ? '—' : summary?.totalEntries ?? 0} accent="text-terra-400" />
        <Tile label="Open conflicts" icon="⚠️" value={isLoading ? '—' : summary?.totalOpenConflicts ?? 0} accent={summary?.totalOpenConflicts ? 'text-red-400' : ''} />
        <Tile label="Devices" icon="📱" value={isLoading ? '—' : summary?.totalDevices ?? 0} />
      </div>

      <div className="mb-6"><IndexHealthCard /></div>

      {/* Races table */}
      {isLoading ? (
        <p className="text-charcoal-400">Loading races…</p>
      ) : (
        <>
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Race</th>
                  <th className="text-left p-3">Event</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Categories</th>
                  <th className="text-right p-3">Entries</th>
                  <th className="text-right p-3">Conflicts</th>
                  <th className="text-right p-3">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {races.map((r) => (
                  <tr key={r._id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-semibold">{r.name}</td>
                    <td className="p-3 text-charcoal-300">{r.event?.title || '—'}</td>
                    <td className="p-3">
                      <span className={`badge ${STATUS_STYLE[r.status] || ''} uppercase`}>{r.status}</span>
                    </td>
                    <td className="p-3 text-right">{r.counts.categories}</td>
                    <td className="p-3 text-right">{r.counts.activeEntries}</td>
                    <td className={`p-3 text-right ${r.counts.openConflicts ? 'text-red-400 font-bold' : ''}`}>{r.counts.openConflicts}</td>
                    <td className="p-3 text-right space-x-3 whitespace-nowrap">
                      <Link href={`/admin/race/${r._id}/board`} className="text-xs text-gold-400 hover:text-gold-300">▶ Board</Link>
                      <Link href={`/admin/race/${r._id}`} className="text-xs text-terra-400 hover:text-terra-300">Manage →</Link>
                    </td>
                  </tr>
                ))}
                {races.length === 0 && (
                  <tr><td colSpan={7} className="p-12 text-center text-charcoal-400">No races yet. <button onClick={() => setShowNew(true)} className="text-terra-400">Create one</button>.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {races.map((r) => (
              <Link key={r._id} href={`/admin/race/${r._id}`} className="card p-4 block">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{r.name}</span>
                  <span className={`badge ${STATUS_STYLE[r.status] || ''} uppercase text-[10px]`}>{r.status}</span>
                </div>
                <div className="text-xs text-charcoal-400 mt-1">{r.event?.title}</div>
                <div className="flex gap-4 text-xs text-charcoal-300 mt-2">
                  <span>{r.counts.categories} cats</span>
                  <span>{r.counts.activeEntries} entries</span>
                  <span className={r.counts.openConflicts ? 'text-red-400' : ''}>{r.counts.openConflicts} conflicts</span>
                </div>
              </Link>
            ))}
            {races.length === 0 && <p className="text-center text-charcoal-400 py-8">No races yet.</p>}
          </div>
        </>
      )}

      {showNew && <NewRaceModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
