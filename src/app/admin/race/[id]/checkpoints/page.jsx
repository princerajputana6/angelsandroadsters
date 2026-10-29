'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  useGetRaceQuery,
  useListRaceSessionsQuery,
  useCreateRaceSessionMutation,
  useListUsersQuery,
} from '@/store/api';

const STATUS_STYLE = {
  open: 'bg-emerald-500/20 text-emerald-300',
  closed: 'bg-charcoal-700/40 text-charcoal-300',
  revoked: 'bg-red-500/20 text-red-300',
};

function AssignForm({ raceId, users }) {
  const [create, { isLoading }] = useCreateRaceSessionMutation();
  const [form, setForm] = useState({ officialId: '', checkpointType: 'lap', checkpointId: '', expiresInHours: 12 });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.officialId || !form.checkpointId.trim()) return toast.error('Official and checkpoint id are required');
    try {
      await create({
        race: raceId,
        officialId: form.officialId,
        checkpointType: form.checkpointType,
        checkpointId: form.checkpointId.trim(),
        expiresInHours: Number(form.expiresInHours) || 12,
      }).unwrap();
      toast.success('Checkpoint session assigned');
      setForm({ ...form, checkpointId: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to assign');
    }
  };

  return (
    <form onSubmit={submit} className="card p-5 space-y-3">
      <h3 className="text-xl font-display">Assign official to checkpoint</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-charcoal-400">Official</span>
          <select className="input mt-1 w-full" value={form.officialId} onChange={(e) => setForm({ ...form, officialId: e.target.value })}>
            <option value="">Select user…</option>
            {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email}) · {u.role}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-charcoal-400">Checkpoint type</span>
          <select className="input mt-1 w-full" value={form.checkpointType} onChange={(e) => setForm({ ...form, checkpointType: e.target.value })}>
            <option value="start">Start</option>
            <option value="lap">Lap</option>
            <option value="finish">Finish</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-charcoal-400">Checkpoint id / label</span>
          <input className="input mt-1 w-full" value={form.checkpointId} onChange={(e) => setForm({ ...form, checkpointId: e.target.value })} placeholder="e.g. CP-1 (Loop A)" />
        </label>
        <label className="block">
          <span className="text-xs text-charcoal-400">Valid for (hours)</span>
          <input type="number" min={1} max={72} className="input mt-1 w-full" value={form.expiresInHours} onChange={(e) => setForm({ ...form, expiresInHours: e.target.value })} />
        </label>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={isLoading} className="btn btn-gold">{isLoading ? 'Assigning…' : 'Assign session'}</button>
      </div>
      <p className="text-[11px] text-charcoal-500">
        Short-lived by design. The official opens <Link href="/race-control" className="text-terra-400">/race-control</Link>, preflights on their device, then records offline.
      </p>
    </form>
  );
}

export default function CheckpointsPage() {
  const { id } = useParams();
  const { data: raceData } = useGetRaceQuery(id);
  const { data: sessData, isLoading } = useListRaceSessionsQuery(id);
  const { data: usersData } = useListUsersQuery();
  const race = raceData?.race;
  const sessions = sessData?.sessions || [];
  const users = usersData?.users || [];

  const ready = race && ['locked', 'active', 'paused'].includes(race.status);

  return (
    <div>
      <div className="mb-6">
        <Link href={`/admin/race/${id}`} className="text-xs text-charcoal-400 hover:text-terra-400">← {race?.name || 'Race'}</Link>
        <h1 className="text-3xl font-display mt-1">Checkpoints &amp; Officials</h1>
        <p className="text-sm text-charcoal-400">Devices &amp; offline readiness · {sessions.length} session(s)</p>
      </div>

      {!ready && (
        <div className="card p-4 mb-4 border border-amber-500/30 text-amber-200 text-sm">
          ⚠️ This race is <b>{race?.status}</b>. Officials can only preflight &amp; download a bundle once the race is <b>locked</b>.
        </div>
      )}

      <div className="mb-6"><AssignForm raceId={id} users={users} /></div>

      {isLoading ? <p className="text-charcoal-400">Loading sessions…</p> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
              <tr>
                <th className="text-left p-3">Checkpoint</th>
                <th className="text-left p-3">Official</th>
                <th className="text-left p-3">Device</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Last sync</th>
                <th className="text-left p-3">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {sessions.map((s) => (
                <tr key={s.sessionId} className="hover:bg-white/[0.02]">
                  <td className="p-3"><span className="capitalize font-semibold">{s.checkpointType}</span> · {s.checkpointId}</td>
                  <td className="p-3 text-charcoal-300">{s.official?.name}<div className="text-xs text-charcoal-500">{s.official?.email}</div></td>
                  <td className="p-3 text-charcoal-300">{s.device?.label || <span className="text-charcoal-600">not claimed</span>}</td>
                  <td className="p-3"><span className={`badge ${STATUS_STYLE[s.status]} uppercase`}>{s.status}</span></td>
                  <td className="p-3 text-xs text-charcoal-400">{s.device?.lastSyncAt ? new Date(s.device.lastSyncAt).toLocaleString() : '—'}</td>
                  <td className="p-3 text-xs text-charcoal-400">{new Date(s.expiresAt).toLocaleString()}</td>
                </tr>
              ))}
              {sessions.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-charcoal-400">No checkpoint sessions assigned yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
