'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  useRaceDashboardQuery,
  useListEventsQuery,
  useCreateRaceMutation,
  useBulkAddEntriesMutation,
  useListRaceEntriesQuery,
  useRaceIndexReportQuery,
  useEnsureRaceIndexesMutation,
  useDeleteRaceMutation,
  useCloneRaceDataMutation,
} from '@/store/api';
import RiderMultiSelect from '@/components/race/RiderMultiSelect';

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
  const [bulkAdd, { isLoading: adding }] = useBulkAddEntriesMutation();
  const events = eventsData?.events || [];
  const [form, setForm] = useState({
    event: '', name: '', startModel: 'individual', finishType: 'laps', expectedLaps: 1,
  });
  const [picked, setPicked] = useState(() => new Set());
  const toggle = (riderId) => setPicked((prev) => {
    const next = new Set(prev);
    next.has(riderId) ? next.delete(riderId) : next.add(riderId);
    return next;
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.event || !form.name.trim()) return toast.error('Event and name are required');
    try {
      const res = await createRace({
        event: form.event,
        name: form.name.trim(),
        startModel: form.startModel,
        finishType: form.finishType,
        expectedLaps: Number(form.expectedLaps) || 0,
      }).unwrap();

      // Optionally onboard the picked pool riders as entries in the same step.
      if (picked.size && res?.race?._id) {
        try {
          const add = await bulkAdd({ race: res.race._id, riderIds: [...picked] }).unwrap();
          toast.success(`Race created · ${add.created} rider(s) added`);
        } catch {
          toast.error('Race created, but adding riders failed — add them from Entries');
        }
      } else {
        toast.success('Race created');
      }
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

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-charcoal-400">Participants (optional)</span>
            <span className="text-[11px] text-charcoal-500">{picked.size} selected · numbers auto-assigned</span>
          </div>
          <p className="text-[11px] text-charcoal-500 mt-0.5 mb-2">Pick riders from the pool to enter them in this race now. You can always add more later.</p>
          <RiderMultiSelect picked={picked} onToggle={toggle} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button type="submit" disabled={isLoading || adding} className="btn btn-gold">
            {isLoading || adding ? 'Creating…' : picked.size ? `Create race + ${picked.size} rider(s)` : 'Create race'}
          </button>
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

/**
 * Global "Add entries" — pick any race, multi-select pool riders, bulk-add.
 * Reachable from the dashboard header and from each race row, so officials can
 * build a start list without drilling into Manage → Entries.
 */
function AddEntriesModal({ races, defaultRaceId, onClose }) {
  const [raceId, setRaceId] = useState(defaultRaceId || '');
  const [picked, setPicked] = useState(() => new Set());
  const [bulkAdd, { isLoading }] = useBulkAddEntriesMutation();
  const { data: entryData } = useListRaceEntriesQuery(raceId, { skip: !raceId });
  const alreadyIn = new Set(
    (entryData?.entries || [])
      .filter((e) => e.status === 'active' && e.poolRider)
      .map((e) => String(e.poolRider?._id || e.poolRider))
  );

  const toggle = (riderId) => setPicked((prev) => {
    const next = new Set(prev);
    next.has(riderId) ? next.delete(riderId) : next.add(riderId);
    return next;
  });

  const add = async () => {
    if (!raceId) return toast.error('Pick a race first');
    if (picked.size === 0) return toast.error('Select at least one rider');
    try {
      const res = await bulkAdd({ race: raceId, riderIds: [...picked] }).unwrap();
      toast.success(`Added ${res.created} rider(s)` + (res.skipped?.length ? `, skipped ${res.skipped.length}` : ''));
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-charcoal-950/80 backdrop-blur overflow-y-auto">
      <div className="card-glass p-4 sm:p-6 w-full max-w-lg space-y-3 my-4 sm:my-8 max-h-[92vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-display">Add entries</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full border border-charcoal-700">✕</button>
        </div>

        <label className="block">
          <span className="text-xs text-charcoal-400">Race</span>
          <select className="input mt-1 w-full" value={raceId} onChange={(e) => setRaceId(e.target.value)}>
            <option value="">Select race…</option>
            {races.map((r) => (
              <option key={r._id} value={r._id}>{r.name}{r.event?.title ? ` — ${r.event.title}` : ''}</option>
            ))}
          </select>
        </label>

        <RiderMultiSelect picked={picked} onToggle={toggle} height="max-h-72" alreadyIn={alreadyIn} />

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-sm text-charcoal-400">{picked.size} selected · numbers auto-assigned</span>
          <button onClick={add} disabled={isLoading || picked.size === 0 || !raceId} className="btn btn-gold">
            {isLoading ? 'Adding…' : `Add ${picked.size || ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/** In-app delete confirmation (replaces window.confirm, unreliable in the
 * PWA / Android webview). A force delete needs the race name typed back. */
function DeleteRaceModal({ race, onClose }) {
  const [deleteRace, { isLoading }] = useDeleteRaceMutation();
  const [typed, setTyped] = useState('');
  const hasData = (race.counts?.activeEntries || 0) > 0 || race.status !== 'draft';
  const ready = !hasData || typed.trim() === race.name.trim();

  const go = async () => {
    if (!ready) return;
    try {
      await deleteRace({ id: race._id, force: hasData }).unwrap();
      toast.success('Race deleted');
      onClose();
    } catch (e) { toast.error(e?.data?.message || 'Failed to delete race'); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-charcoal-950/80 backdrop-blur overflow-y-auto">
      <div className="card-glass p-4 sm:p-6 w-full max-w-md space-y-4 my-4 sm:my-8">
        <h3 className="text-xl font-display text-red-300">Delete “{race.name}”?</h3>
        {hasData ? (
          <>
            <p className="text-sm text-charcoal-300">
              This permanently removes the race and <span className="text-red-300 font-semibold">all its data</span> — entries,
              timing, results and standings points. It cannot be undone. The global rider pool is kept.
            </p>
            <label className="block">
              <span className="text-xs text-charcoal-400">Type the race name to confirm</span>
              <input className="input mt-1 w-full" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={race.name} />
            </label>
          </>
        ) : (
          <p className="text-sm text-charcoal-300">This draft race has no recorded data and will be removed.</p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button type="button" onClick={go} disabled={isLoading || !ready}
            className={`btn ${ready ? 'bg-red-600 hover:bg-red-500 text-white' : 'btn-outline opacity-50'}`}>
            {isLoading ? 'Deleting…' : 'Delete race'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Copy participants + results from one race into another (e.g. Shadow Run →
 * Dune Raid). Overwriting a non-empty target requires the confirm checkbox. */
function DuplicateDataModal({ races, onClose }) {
  const [clone, { isLoading }] = useCloneRaceDataMutation();
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(true);

  const target = races.find((r) => r._id === targetId);
  const targetHasData = (target?.counts?.activeEntries || 0) > 0;
  const ready = sourceId && targetId && sourceId !== targetId && (!targetHasData || replaceExisting);

  const run = async () => {
    if (!ready) return;
    try {
      const res = await clone({ targetId, sourceRaceId: sourceId, replaceExisting }).unwrap();
      toast.success(`Copied ${res.entriesCreated} rider(s) & ${res.resultsCreated} result(s)`);
      onClose();
    } catch (e) { toast.error(e?.data?.message || 'Failed to duplicate race data'); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-charcoal-950/80 backdrop-blur overflow-y-auto">
      <div className="card-glass p-4 sm:p-6 w-full max-w-md space-y-4 my-4 sm:my-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display">Duplicate participants &amp; results</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full border border-charcoal-700">✕</button>
        </div>
        <p className="text-sm text-charcoal-300">Copy every participant and their result from one race into another.</p>

        <label className="block">
          <span className="text-xs text-charcoal-400">Copy from (source)</span>
          <select className="input mt-1 w-full" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            <option value="">Select source race…</option>
            {races.map((r) => (
              <option key={r._id} value={r._id}>{r.name}{r.event?.title ? ` — ${r.event.title}` : ''} ({r.counts?.activeEntries ?? 0})</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-charcoal-400">Copy into (target)</span>
          <select className="input mt-1 w-full" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">Select target race…</option>
            {races.filter((r) => r._id !== sourceId).map((r) => (
              <option key={r._id} value={r._id}>{r.name}{r.event?.title ? ` — ${r.event.title}` : ''} ({r.counts?.activeEntries ?? 0})</option>
            ))}
          </select>
        </label>

        {targetHasData && (
          <label className="flex items-start gap-2 text-sm text-amber-300 cursor-pointer rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <input type="checkbox" checked={replaceExisting} onChange={(e) => setReplaceExisting(e.target.checked)} className="accent-amber-500 mt-0.5" />
            <span>Target already has {target.counts.activeEntries} participant(s). Replace them — this permanently clears the target’s current entries, results and timing first.</span>
          </label>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button type="button" onClick={run} disabled={isLoading || !ready} className="btn btn-gold">
            {isLoading ? 'Copying…' : 'Duplicate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RaceDashboard() {
  // Light polling so a race created by one admin shows up for the others.
  const { data, isLoading } = useRaceDashboardQuery(undefined, { pollingInterval: 15000, refetchOnFocus: true });
  const [showNew, setShowNew] = useState(false);
  const [addEntriesFor, setAddEntriesFor] = useState(null); // null | '' (any race) | raceId
  const [deleteTarget, setDeleteTarget] = useState(null); // race pending deletion
  const [showDuplicate, setShowDuplicate] = useState(false); // duplicate-data modal
  const summary = data?.summary;
  const races = data?.races || [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">RACE MANAGEMENT</p>
          <h1 className="text-3xl sm:text-4xl font-display">Race Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Link href="/admin/race/standings" className="btn btn-outline flex-1 sm:flex-none">🏆 Standings</Link>
          <button onClick={() => setShowDuplicate(true)} className="btn btn-outline flex-1 sm:flex-none">⧉ Duplicate data</button>
          <button onClick={() => setAddEntriesFor('')} className="btn btn-outline flex-1 sm:flex-none">＋ Add entries</button>
          <button onClick={() => setShowNew(true)} className="btn btn-gold flex-1 sm:flex-none">+ New Race</button>
        </div>
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
                      <button onClick={() => setAddEntriesFor(r._id)} className="text-xs text-emerald-400 hover:text-emerald-300">+ Riders</button>
                      <Link href={`/admin/race/${r._id}/board`} className="text-xs text-gold-400 hover:text-gold-300">▶ Board</Link>
                      <Link href={`/admin/race/${r._id}`} className="text-xs text-terra-400 hover:text-terra-300">Manage →</Link>
                      <button onClick={() => setDeleteTarget(r)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
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
              <div key={r._id} className="card p-4">
                <Link href={`/admin/race/${r._id}`} className="block">
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
                <div className="flex gap-3 mt-3 pt-3 border-t border-charcoal-800 items-center">
                  <button onClick={() => setAddEntriesFor(r._id)} className="text-xs text-emerald-400">+ Riders</button>
                  <button onClick={() => setDeleteTarget(r)} className="text-xs text-red-400">Delete</button>
                  <Link href={`/admin/race/${r._id}/board`} className="text-xs text-gold-400 ml-auto">▶ Board</Link>
                  <Link href={`/admin/race/${r._id}`} className="text-xs text-terra-400">Manage →</Link>
                </div>
              </div>
            ))}
            {races.length === 0 && <p className="text-center text-charcoal-400 py-8">No races yet.</p>}
          </div>
        </>
      )}

      {deleteTarget && <DeleteRaceModal race={deleteTarget} onClose={() => setDeleteTarget(null)} />}
      {showDuplicate && <DuplicateDataModal races={races} onClose={() => setShowDuplicate(false)} />}
      {showNew && <NewRaceModal onClose={() => setShowNew(false)} />}
      {addEntriesFor !== null && (
        <AddEntriesModal
          races={races}
          defaultRaceId={addEntriesFor || ''}
          onClose={() => setAddEntriesFor(null)}
        />
      )}
    </div>
  );
}
