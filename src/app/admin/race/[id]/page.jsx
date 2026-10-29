'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  useGetRaceQuery,
  useUpdateRaceMutation,
  useDeleteRaceMutation,
  useSetRaceStatusMutation,
  useListRaceCategoriesQuery,
  useCreateRaceCategoryMutation,
  useUpdateRaceCategoryMutation,
  useDeleteRaceCategoryMutation,
} from '@/store/api';

// Allowed lifecycle moves mirror the server (src/app/api/race/races/[id]/status).
const NEXT_STATES = {
  draft: ['configured', 'archived'],
  configured: ['locked', 'draft', 'archived'],
  locked: ['active', 'configured', 'archived'],
  active: ['paused', 'completed'],
  paused: ['active', 'completed'],
  completed: ['active', 'archived'],
  archived: [],
};
const REASON_REQUIRED = new Set(['locked', 'archived', 'completed', 'active']);

const LABEL = {
  configured: 'Mark configured', locked: 'Lock for race day', active: 'Activate', draft: 'Back to draft',
  paused: 'Pause', completed: 'Complete', archived: 'Archive',
};

function ConfigForm({ race }) {
  const [update, { isLoading }] = useUpdateRaceMutation();
  const [form, setForm] = useState({});
  useEffect(() => {
    setForm({
      name: race.name || '',
      startModel: race.startModel,
      finishType: race.finishType,
      expectedLaps: race.expectedLaps ?? 0,
      durationMinutes: race.durationMinutes ?? 0,
      minLapDurationMs: race.minLapDurationMs ?? 0,
      maxLapDurationMs: race.maxLapDurationMs ?? 0,
      numberUniquenessScope: race.numberUniquenessScope,
      finishRule: race.finishRule || '',
      penaltyRules: race.penaltyRules || '',
      correctionAllowed: race.correctionAllowed,
    });
  }, [race]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await update({
        id: race._id,
        body: {
          ...form,
          expectedLaps: Number(form.expectedLaps) || 0,
          durationMinutes: Number(form.durationMinutes) || 0,
          minLapDurationMs: Number(form.minLapDurationMs) || 0,
          maxLapDurationMs: Number(form.maxLapDurationMs) || 0,
        },
      }).unwrap();
      toast.success(race.status === 'draft' ? 'Saved' : 'Saved — config version bumped');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save');
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={save} className="card p-5 space-y-4">
      <h3 className="text-xl font-display">Configuration</h3>
      <label className="block">
        <span className="text-xs text-charcoal-400">Race name</span>
        <input className="input mt-1 w-full" value={form.name || ''} onChange={set('name')} />
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-charcoal-400">Start model</span>
          <select className="input mt-1 w-full" value={form.startModel} onChange={set('startModel')}>
            <option value="individual">Individual start</option>
            <option value="common">Common start</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-charcoal-400">Finish by</span>
          <select className="input mt-1 w-full" value={form.finishType} onChange={set('finishType')}>
            <option value="laps">Laps</option>
            <option value="time">Time</option>
          </select>
        </label>
        {form.finishType === 'laps' ? (
          <label className="block">
            <span className="text-xs text-charcoal-400">Expected laps</span>
            <input type="number" min={0} className="input mt-1 w-full" value={form.expectedLaps} onChange={set('expectedLaps')} />
          </label>
        ) : (
          <label className="block">
            <span className="text-xs text-charcoal-400">Duration (minutes)</span>
            <input type="number" min={0} className="input mt-1 w-full" value={form.durationMinutes} onChange={set('durationMinutes')} />
          </label>
        )}
        <label className="block">
          <span className="text-xs text-charcoal-400">Number uniqueness scope</span>
          <select className="input mt-1 w-full" value={form.numberUniquenessScope} onChange={set('numberUniquenessScope')}>
            <option value="race">Per race</option>
            <option value="category">Per category</option>
            <option value="event">Per event</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-charcoal-400">Min lap duration (ms)</span>
          <input type="number" min={0} className="input mt-1 w-full" value={form.minLapDurationMs} onChange={set('minLapDurationMs')} />
        </label>
        <label className="block">
          <span className="text-xs text-charcoal-400">Max lap duration (ms, 0 = none)</span>
          <input type="number" min={0} className="input mt-1 w-full" value={form.maxLapDurationMs} onChange={set('maxLapDurationMs')} />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-charcoal-400">Finish rule</span>
        <textarea className="input mt-1 w-full" rows={2} value={form.finishRule} onChange={set('finishRule')} />
      </label>
      {race.status !== 'draft' && (
        <p className="text-[11px] text-amber-300/80">
          This race is <b>{race.status}</b>. Saving config changes bumps the offline bundle version (currently v{race.configVersion}); devices must re-preflight.
        </p>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={isLoading} className="btn btn-gold">{isLoading ? 'Saving…' : 'Save configuration'}</button>
      </div>
    </form>
  );
}

function Categories({ raceId }) {
  const { data, isLoading } = useListRaceCategoriesQuery(raceId);
  const [create] = useCreateRaceCategoryMutation();
  const [update] = useUpdateRaceCategoryMutation();
  const [del] = useDeleteRaceCategoryMutation();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const cats = data?.categories || [];

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await create({ race: raceId, name: name.trim(), code: code.trim() || undefined }).unwrap();
      setName(''); setCode('');
      toast.success('Category added');
    } catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  const rename = async (c) => {
    const next = prompt('Category name', c.name);
    if (next == null || !next.trim()) return;
    try { await update({ id: c._id, body: { name: next.trim() } }).unwrap(); toast.success('Updated'); }
    catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  const remove = async (c) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try { await del(c._id).unwrap(); toast.success('Deleted'); }
    catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-xl font-display">Categories</h3>
      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input className="input flex-1 min-w-[140px]" placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input w-28" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="btn btn-outline" type="submit">Add</button>
      </form>
      {isLoading ? <p className="text-charcoal-400 text-sm">Loading…</p> : (
        <ul className="divide-y divide-charcoal-800">
          {cats.map((c) => (
            <li key={c._id} className="flex items-center justify-between py-2">
              <span className="text-sm">{c.name} {c.code && <span className="text-charcoal-500">({c.code})</span>}</span>
              <span className="space-x-3">
                <button onClick={() => rename(c)} className="text-xs text-terra-400">Rename</button>
                <button onClick={() => remove(c)} className="text-xs text-red-400">Delete</button>
              </span>
            </li>
          ))}
          {cats.length === 0 && <li className="py-3 text-sm text-charcoal-400">No categories yet.</li>}
        </ul>
      )}
    </div>
  );
}

function Lifecycle({ race }) {
  const [setStatus, { isLoading }] = useSetRaceStatusMutation();
  const moves = NEXT_STATES[race.status] || [];

  const go = async (next) => {
    let reason;
    if (REASON_REQUIRED.has(next)) {
      reason = prompt(`Reason for "${LABEL[next] || next}" (required for the audit trail):`);
      if (reason == null || !reason.trim()) return;
    }
    try {
      await setStatus({ id: race._id, status: next, reason }).unwrap();
      toast.success(`Race ${next}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Transition not allowed');
    }
  };

  return (
    <div className="card p-5 space-y-3">
      <h3 className="text-xl font-display">Lifecycle</h3>
      <p className="text-sm text-charcoal-300">Current status: <span className="badge bg-terra-500/20 text-terra-400 uppercase">{race.status}</span> · config v{race.configVersion}</p>
      {moves.length === 0 ? (
        <p className="text-sm text-charcoal-400">No further transitions available.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {moves.map((m) => (
            <button key={m} onClick={() => go(m)} disabled={isLoading} className="btn btn-outline text-sm">
              {LABEL[m] || m}
            </button>
          ))}
        </div>
      )}
      <p className="text-[11px] text-charcoal-500">Locking persists the immutable offline config bundle (checksummed) for device preflight.</p>
    </div>
  );
}

export default function RaceManage() {
  const { id } = useParams();
  const router = useRouter();
  const { data, isLoading, error } = useGetRaceQuery(id);
  const [del] = useDeleteRaceMutation();
  const race = data?.race;

  const remove = async () => {
    if (!confirm('Delete this draft race? Only allowed if it has no recorded events.')) return;
    try {
      await del(id).unwrap();
      toast.success('Race deleted');
      router.push('/admin/race');
    } catch (err) {
      toast.error(err?.data?.message || 'Cannot delete — archive instead');
    }
  };

  if (isLoading) return <p className="text-charcoal-400">Loading race…</p>;
  if (error || !race) return <p className="text-red-400">Race not found. <Link href="/admin/race" className="text-terra-400">Back</Link></p>;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <Link href="/admin/race" className="text-xs text-charcoal-400 hover:text-terra-400">← Race Dashboard</Link>
          <h1 className="text-3xl font-display mt-1">{race.name}</h1>
          <p className="text-sm text-charcoal-400">{race.event?.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/race/${race._id}/entries`} className="btn btn-outline">🎫 Riders & Entries</Link>
          <Link href={`/admin/race/${race._id}/plates`} className="btn btn-outline">🏷 Plates</Link>
          <Link href={`/admin/race/${race._id}/checkpoints`} className="btn btn-outline">📍 Checkpoints</Link>
          <Link href={`/admin/race/${race._id}/results`} className="btn btn-outline">🏆 Results</Link>
          <Link href={`/admin/race/${race._id}/conflicts`} className="btn btn-outline">⚠️ Conflicts</Link>
          <Link href={`/admin/race/${race._id}/sync`} className="btn btn-outline">📡 Sync Health</Link>
          {race.status === 'draft' && (
            <button onClick={remove} className="btn btn-outline text-red-400 border-red-500/40">Delete draft</button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <ConfigForm race={race} />
        </div>
        <div className="space-y-4">
          <Lifecycle race={race} />
          <Categories raceId={race._id} />
        </div>
      </div>
    </div>
  );
}
