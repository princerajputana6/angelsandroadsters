'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiHash } from 'react-icons/fi';
import {
  useListRidersQuery,
  useCreateRiderMutation,
  useUpdateRiderMutation,
  useDeleteRiderMutation,
  useBackfillParticipantNosMutation,
} from '@/store/api';
import RacePhotoInput from '@/components/race/RacePhotoInput';
import { fmtParticipantNo } from '@/lib/participantNo';

const emptyRider = {
  name: '', displayName: '', phone: '', email: '',
  bike: { make: '', model: '', cc: '', description: '' },
  photo: {}, notes: '',
};

function RiderModal({ editing, onClose }) {
  const [create, { isLoading: creating }] = useCreateRiderMutation();
  const [update, { isLoading: updating }] = useUpdateRiderMutation();
  const [form, setForm] = useState(
    editing
      ? {
          name: editing.name || '', displayName: editing.displayName || '',
          phone: editing.phone || '', email: editing.email || '',
          bike: { make: '', model: '', cc: '', description: '', ...(editing.bike || {}) },
          photo: editing.photo || {}, notes: editing.notes || '',
        }
      : emptyRider
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    const body = {
      name: form.name.trim(),
      displayName: form.displayName.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      bike: form.bike,
      photo: form.photo?.url ? form.photo : undefined,
      notes: form.notes.trim() || undefined,
    };
    try {
      if (editing) { await update({ id: editing._id, body }).unwrap(); toast.success('Rider updated'); }
      else { await create(body).unwrap(); toast.success('Rider added to pool'); }
      onClose();
    } catch (err) { toast.error(err?.data?.message || 'Failed to save'); }
  };

  const setBike = (k) => (e) => setForm({ ...form, bike: { ...form.bike, [k]: e.target.value } });

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-charcoal-950/80 backdrop-blur overflow-y-auto">
      <form onSubmit={submit} className="card-glass p-4 sm:p-6 w-full max-w-xl space-y-4 my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-display">{editing ? 'Edit rider' : 'New rider'}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full border border-charcoal-700">✕</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block"><span className="text-xs text-charcoal-400">Name *</span><input className="input mt-1 w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block"><span className="text-xs text-charcoal-400">Display name</span><input className="input mt-1 w-full" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="optional" /></label>
          <label className="block"><span className="text-xs text-charcoal-400">Phone</span><input className="input mt-1 w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label className="block"><span className="text-xs text-charcoal-400">Email</span><input className="input mt-1 w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block"><span className="text-xs text-charcoal-400">Make</span><input className="input mt-1 w-full" value={form.bike.make} onChange={setBike('make')} /></label>
          <label className="block"><span className="text-xs text-charcoal-400">Model</span><input className="input mt-1 w-full" value={form.bike.model} onChange={setBike('model')} /></label>
          <label className="block"><span className="text-xs text-charcoal-400">CC</span><input className="input mt-1 w-full" value={form.bike.cc} onChange={setBike('cc')} /></label>
        </div>
        <div className="max-w-[12rem]"><RacePhotoInput label="Rider photo" value={form.photo} onChange={(ref) => setForm({ ...form, photo: ref })} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button type="submit" disabled={creating || updating} className="btn btn-gold">{creating || updating ? 'Saving…' : 'Save rider'}</button>
        </div>
      </form>
    </div>
  );
}

export default function RiderPoolPage() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useListRidersQuery(q ? { q } : {});
  const [del] = useDeleteRiderMutation();
  const [backfill, { isLoading: backfilling }] = useBackfillParticipantNosMutation();
  const [modal, setModal] = useState(null); // 'new' | rider
  const riders = data?.riders || [];
  const missingIds = riders.filter((r) => r.participantNo == null).length;

  const assignIds = async () => {
    try {
      const res = await backfill().unwrap();
      toast.success(res.assigned ? `Assigned ${res.assigned} participant ID(s)` : 'All riders already have an ID');
    } catch (err) { toast.error(err?.data?.message || 'Failed to assign IDs'); }
  };

  const renumber = async () => {
    const input = prompt('Renumber ALL participants starting from which number? (e.g. 4 → 004). This overwrites every existing ID and pulls in anyone added inside a race.', '4');
    if (input == null) return;
    const start = Number(input.trim());
    if (!Number.isInteger(start) || start < 0) return toast.error('Enter a whole number ≥ 0');
    if (!confirm(`Renumber everyone from ${String(start).padStart(3, '0')}? This changes existing participant IDs.`)) return;
    try {
      const res = await backfill({ start }).unwrap();
      const range = res.count ? `${String(res.first).padStart(3, '0')}–${String(res.last).padStart(3, '0')}` : 'none';
      toast.success(`Numbered ${res.count} participant(s) (${range})` + (res.linkedFromRaces ? `, incl. ${res.linkedFromRaces} from races` : ''));
    } catch (err) { toast.error(err?.data?.message || 'Failed to renumber'); }
  };

  const remove = async (r) => {
    if (!confirm(`Remove ${r.name} from the pool?`)) return;
    try {
      const res = await del(r._id).unwrap();
      toast.success(res.deactivated ? 'Rider is used in races — deactivated' : 'Rider removed');
    } catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">RACE MANAGEMENT</p>
          <h1 className="text-3xl sm:text-4xl font-display">Rider Pool</h1>
          <p className="text-sm text-charcoal-400">A reusable master list — add riders here once, then onboard them into any race. Each rider keeps a permanent ID (001, 002…) across every race.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {missingIds > 0 && (
            <button onClick={assignIds} disabled={backfilling} className="btn btn-outline">
              <FiHash /> {backfilling ? 'Assigning…' : `Assign IDs (${missingIds})`}
            </button>
          )}
          <button onClick={renumber} disabled={backfilling} className="btn btn-outline" title="Renumber everyone from a chosen start (e.g. 004)">
            <FiHash /> {backfilling ? 'Working…' : 'Renumber from…'}
          </button>
          <button onClick={() => setModal('new')} className="btn btn-gold"><FiPlus /> Add rider</button>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-500" />
        <input className="input w-full pl-9" placeholder="Search riders…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? <p className="text-charcoal-400">Loading…</p> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
              <tr><th className="text-left p-3">ID</th><th className="text-left p-3">Rider</th><th className="text-left p-3">Contact</th><th className="text-left p-3">Bike</th><th className="text-right p-3">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {riders.map((r) => (
                <tr key={r._id} className={`hover:bg-white/[0.02] ${!r.active ? 'opacity-50' : ''}`}>
                  <td className="p-3">
                    {r.participantNo != null
                      ? <span className="font-mono text-sm text-terra-400">{fmtParticipantNo(r.participantNo)}</span>
                      : <span className="text-xs text-charcoal-600">—</span>}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {r.photo?.url
                        ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.photo.url} alt="" className="w-9 h-9 rounded object-cover" />
                        : <span className="w-9 h-9 rounded bg-charcoal-800 flex items-center justify-center text-sm">🏍</span>}
                      <span className="font-semibold">{r.name}{!r.active && ' (inactive)'}</span>
                    </div>
                  </td>
                  <td className="p-3 text-charcoal-300 text-xs">{r.phone}{r.phone && r.email ? ' · ' : ''}{r.email}</td>
                  <td className="p-3 text-charcoal-300 text-xs">{[r.bike?.make, r.bike?.model, r.bike?.cc].filter(Boolean).join(' ')}</td>
                  <td className="p-3 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => setModal(r)} className="text-terra-400"><FiEdit2 className="inline" /></button>
                    <button onClick={() => remove(r)} className="text-red-400"><FiTrash2 className="inline" /></button>
                  </td>
                </tr>
              ))}
              {riders.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-charcoal-400">No riders yet. <button onClick={() => setModal('new')} className="text-terra-400">Add one</button>.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && <RiderModal editing={modal === 'new' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
