'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  useGetRaceQuery,
  useListRaceCategoriesQuery,
  useListRaceEntriesQuery,
  useCreateRaceEntryMutation,
  useUpdateRaceEntryMutation,
  useSetEntryParticipantNoMutation,
  useSetRaceEntryStatusMutation,
  useDeleteRaceEntryMutation,
  useSearchRaceUsersQuery,
  useBulkAddEntriesMutation,
  useBackfillParticipantNosMutation,
} from '@/store/api';
import { FiUserPlus, FiPlus, FiTag } from 'react-icons/fi';
import RacePhotoInput from '@/components/race/RacePhotoInput';
import RiderMultiSelect from '@/components/race/RiderMultiSelect';
import { fmtParticipantNo } from '@/lib/participantNo';

/**
 * Multi-select riders from the global pool and onboard them into this race in
 * one go (numbers auto-assigned server-side; riders already in the race skipped).
 * Shows the FULL pool — riders already in this race are marked "In race" rather
 * than hidden — plus Select-all, via the shared RiderMultiSelect.
 */
function PoolModal({ raceId, onClose }) {
  const { data: entryData } = useListRaceEntriesQuery(raceId);
  const [bulkAdd, { isLoading: adding }] = useBulkAddEntriesMutation();
  const [picked, setPicked] = useState(() => new Set());

  // Pool riders already entered in this race (active entries with a pool link).
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
    if (picked.size === 0) return;
    try {
      const res = await bulkAdd({ race: raceId, riderIds: [...picked] }).unwrap();
      const msg = `Added ${res.created} rider(s)` + (res.skipped?.length ? `, skipped ${res.skipped.length}` : '');
      toast.success(msg);
      onClose();
    } catch (err) { toast.error(err?.data?.message || 'Failed to add'); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-charcoal-950/80 backdrop-blur overflow-y-auto">
      <div className="card-glass p-4 sm:p-6 w-full max-w-lg space-y-3 my-4 sm:my-8 max-h-[92vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-display">Add riders from pool</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full border border-charcoal-700">✕</button>
        </div>
        <RiderMultiSelect picked={picked} onToggle={toggle} alreadyIn={alreadyIn} height="max-h-[55vh]" />
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-sm text-charcoal-400">{picked.size} selected · numbers auto-assigned</span>
          <button onClick={add} disabled={adding || picked.size === 0} className="btn btn-gold">{adding ? 'Adding…' : `Add ${picked.size || ''}`}</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Rider name field that doubles as a search box over existing users. Pick a
 * match to link the entry to that user; or just type a new name to add a rider
 * who isn't an existing user (rider link stays empty).
 */
function RiderPicker({ name, riderId, onType, onPick }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(name || '');
  useEffect(() => { const t = setTimeout(() => setQ(name), 250); return () => clearTimeout(t); }, [name]);
  const { data, isFetching } = useSearchRaceUsersQuery(q, { skip: !q || q.trim().length < 2 });
  const results = data?.users || [];

  return (
    <div className="block relative">
      <span className="text-xs text-charcoal-400">
        Rider * {riderId && <span className="text-emerald-400">· linked to existing user</span>}
      </span>
      <input
        className="input mt-1 w-full"
        value={name}
        placeholder="Search existing riders or type a new name…"
        autoComplete="off"
        onChange={(e) => { onType(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && q.trim().length >= 2 && (
        <div className="absolute z-20 left-0 right-0 mt-1 card max-h-56 overflow-y-auto">
          {results.map((u) => (
            <button
              key={u._id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onPick(u); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-white/5 border-b border-charcoal-800/60 last:border-0"
            >
              <div className="text-sm">{u.name}</div>
              <div className="text-[11px] text-charcoal-500">{u.email}{u.phone ? ` · ${u.phone}` : ''}</div>
            </button>
          ))}
          {isFetching && <div className="px-3 py-2 text-xs text-charcoal-500">Searching…</div>}
          {!isFetching && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-charcoal-500">No match — “{name}” will be added as a new rider.</div>
          )}
        </div>
      )}
    </div>
  );
}

const STATUS_STYLE = {
  active: 'bg-emerald-500/20 text-emerald-300',
  withdrawn: 'bg-orange-500/20 text-orange-300',
  void: 'bg-red-500/20 text-red-300',
};

const emptyForm = {
  raceNumber: '', riderName: '', rider: undefined, displayName: '', category: '',
  bike: { make: '', model: '', cc: '', description: '' },
  photos: { rider: {}, bike: {}, plate: {} },
};

function EntryModal({ raceId, categories, editing, lockedLifecycle, onClose }) {
  const [create, { isLoading: creating }] = useCreateRaceEntryMutation();
  const [update, { isLoading: updating }] = useUpdateRaceEntryMutation();
  const [setPartNo] = useSetEntryParticipantNoMutation();
  const initialPartNo = editing?.poolRider?.participantNo ?? '';
  const [participantNo, setParticipantNo] = useState(initialPartNo === '' ? '' : String(initialPartNo));
  const [form, setForm] = useState(
    editing
      ? {
          raceNumber: editing.raceNumber,
          riderName: editing.riderName || '',
          rider: editing.rider || undefined,
          displayName: editing.displayName || '',
          category: editing.category?._id || editing.category || '',
          bike: { make: '', model: '', cc: '', description: '', ...(editing.bike || {}) },
          photos: {
            rider: editing.photos?.rider || {},
            bike: editing.photos?.bike || {},
            plate: editing.photos?.plate || {},
          },
        }
      : emptyForm
  );

  const numberChanged = editing && Number(form.raceNumber) !== editing.raceNumber;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.riderName.trim() || form.raceNumber === '') return toast.error('Rider name and number are required');

    // Only send asset refs that actually have a URL.
    const photos = {};
    for (const k of ['rider', 'bike', 'plate']) {
      if (form.photos[k]?.url) photos[k] = form.photos[k];
    }

    const body = {
      riderName: form.riderName.trim(),
      rider: form.rider || undefined,
      displayName: form.displayName.trim() || undefined,
      raceNumber: Number(form.raceNumber),
      category: form.category || undefined,
      bike: form.bike,
      photos: Object.keys(photos).length ? photos : undefined,
    };

    try {
      if (editing) {
        if (numberChanged && lockedLifecycle) {
          const reason = prompt('Reason for changing the race number (required after lock):');
          if (reason == null || !reason.trim()) return;
          body.reason = reason;
        }
        await update({ id: editing._id, body }).unwrap();
        // Persist a hand-set participant ID if it changed (lives on the pool rider).
        const trimmed = participantNo.trim();
        if (trimmed !== String(initialPartNo)) {
          await setPartNo({ id: editing._id, participantNo: trimmed === '' ? null : Number(trimmed) }).unwrap();
        }
        toast.success('Entry updated');
      } else {
        await create({ race: raceId, ...body }).unwrap();
        toast.success('Entry added');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save entry');
    }
  };

  const setBike = (k) => (e) => setForm({ ...form, bike: { ...form.bike, [k]: e.target.value } });
  const setPhoto = (k) => (ref) => setForm({ ...form, photos: { ...form.photos, [k]: ref } });

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-charcoal-950/80 backdrop-blur overflow-y-auto">
      <form onSubmit={submit} className="card-glass p-4 sm:p-6 w-full max-w-2xl space-y-4 my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-display">{editing ? `Edit #${editing.raceNumber}` : 'New entry'}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full border border-charcoal-700">✕</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-charcoal-400">Race number *</span>
            <input type="number" min={0} className="input mt-1 w-full" value={form.raceNumber} onChange={(e) => setForm({ ...form, raceNumber: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-xs text-charcoal-400">Category</span>
            <select className="input mt-1 w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">— none —</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
          <RiderPicker
            name={form.riderName}
            riderId={form.rider}
            onType={(v) => setForm({ ...form, riderName: v, rider: undefined })}
            onPick={(u) => setForm({ ...form, riderName: u.name, rider: u._id })}
          />
          <label className="block">
            <span className="text-xs text-charcoal-400">Display name (for plate)</span>
            <input className="input mt-1 w-full" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="optional" />
          </label>
          {editing && (
            <label className="block">
              <span className="text-xs text-charcoal-400">Participant ID (permanent)</span>
              <input
                type="number"
                min={0}
                className="input mt-1 w-full"
                value={participantNo}
                onChange={(e) => setParticipantNo(e.target.value)}
                placeholder="e.g. 4 → shows as 004"
              />
              <span className="text-[11px] text-charcoal-500">Blank to clear · must be unique across all participants</span>
            </label>
          )}
        </div>

        <div className="grid sm:grid-cols-4 gap-3">
          <label className="block"><span className="text-xs text-charcoal-400">Make</span><input className="input mt-1 w-full" value={form.bike.make} onChange={setBike('make')} /></label>
          <label className="block"><span className="text-xs text-charcoal-400">Model</span><input className="input mt-1 w-full" value={form.bike.model} onChange={setBike('model')} /></label>
          <label className="block"><span className="text-xs text-charcoal-400">CC</span><input className="input mt-1 w-full" value={form.bike.cc} onChange={setBike('cc')} /></label>
          <label className="block"><span className="text-xs text-charcoal-400">Note</span><input className="input mt-1 w-full" value={form.bike.description} onChange={setBike('description')} /></label>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <RacePhotoInput label="Rider photo" value={form.photos.rider} onChange={setPhoto('rider')} />
          <RacePhotoInput label="Bike photo" value={form.photos.bike} onChange={setPhoto('bike')} />
          <RacePhotoInput label="Plate photo" value={form.photos.plate} onChange={setPhoto('plate')} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button type="submit" disabled={creating || updating} className="btn btn-gold">{creating || updating ? 'Saving…' : 'Save entry'}</button>
        </div>
      </form>
    </div>
  );
}

export default function RaceEntriesPage() {
  const { id } = useParams();
  const { data: raceData } = useGetRaceQuery(id);
  const { data: catData } = useListRaceCategoriesQuery(id);
  const { data: entryData, isLoading } = useListRaceEntriesQuery(id);
  const [setStatus] = useSetRaceEntryStatusMutation();
  const [del] = useDeleteRaceEntryMutation();
  const [renumberIds, { isLoading: renumbering }] = useBackfillParticipantNosMutation();

  const [modal, setModal] = useState(null); // 'new' | entry object
  const [showPool, setShowPool] = useState(false);
  const race = raceData?.race;
  const categories = catData?.categories || [];
  const entries = entryData?.entries || [];
  const lockedLifecycle = race && !['draft', 'configured'].includes(race.status);

  const changeStatus = async (entry, status) => {
    let reason;
    if (status === 'withdrawn' || status === 'void') {
      reason = prompt(`Reason to ${status} #${entry.raceNumber}:`);
      if (reason == null || !reason.trim()) return;
    }
    try { await setStatus({ id: entry._id, status, reason }).unwrap(); toast.success(`Entry ${status}`); }
    catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  const remove = async (entry) => {
    if (!confirm(`Delete #${entry.raceNumber}? Only allowed for a draft race with no events.`)) return;
    try { await del(entry._id).unwrap(); toast.success('Deleted'); }
    catch (err) { toast.error(err?.data?.message || 'Use withdraw/void instead'); }
  };

  const renumber = async () => {
    const input = prompt('Assign participant IDs to ALL riders, starting from which number? (e.g. 4 → 004). Numbered in this list order; overwrites existing IDs.', '4');
    if (input == null) return;
    const start = Number(input.trim());
    if (!Number.isInteger(start) || start < 0) return toast.error('Enter a whole number ≥ 0');
    if (!confirm(`Renumber everyone from ${String(start).padStart(3, '0')}? This writes new IDs for every participant.`)) return;
    try {
      const res = await renumberIds({ start }).unwrap();
      const range = res.count ? `${String(res.first).padStart(3, '0')}–${String(res.last).padStart(3, '0')}` : 'none';
      toast.success(`Numbered ${res.count} participant(s) (${range})`);
    } catch (err) { toast.error(err?.data?.message || 'Failed to renumber'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <Link href={`/admin/race/${id}`} className="text-xs text-charcoal-400 hover:text-terra-400">← {race?.name || 'Race'}</Link>
          <h1 className="text-3xl font-display mt-1">Riders & Entries</h1>
          <p className="text-sm text-charcoal-400">Number uniqueness: per {race?.numberUniquenessScope || 'race'} · {entries.filter((e) => e.status === 'active').length} active</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/race/${id}/plates`} className="btn btn-outline"><FiTag /> Plates</Link>
          <button onClick={renumber} disabled={renumbering} className="btn btn-outline" title="Assign participant IDs to everyone from a chosen start (e.g. 004)"><FiTag /> {renumbering ? 'Numbering…' : 'Renumber IDs'}</button>
          <button onClick={() => setShowPool(true)} className="btn btn-outline"><FiUserPlus /> Add from pool</button>
          <button onClick={() => setModal('new')} className="btn btn-gold"><FiPlus /> Add entry</button>
        </div>
      </div>
      {showPool && <PoolModal raceId={id} onClose={() => setShowPool(false)} />}

      {isLoading ? <p className="text-charcoal-400">Loading entries…</p> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
              <tr>
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Rider</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Photos</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Plate</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {entries.map((e) => {
                const photoCount = ['rider', 'bike', 'plate'].filter((k) => e.photos?.[k]?.url).length;
                return (
                  <tr key={e._id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-display text-lg text-terra-400">{e.raceNumber}</td>
                    <td className="p-3">
                      {e.poolRider?.participantNo != null
                        ? <span className="text-xs font-mono text-charcoal-300">{fmtParticipantNo(e.poolRider.participantNo)}</span>
                        : <span className="text-xs text-charcoal-600">—</span>}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold">{e.riderName}</div>
                      {e.bike?.make && <div className="text-xs text-charcoal-500">{e.bike.make} {e.bike.model}</div>}
                    </td>
                    <td className="p-3 text-charcoal-300">{e.category?.name || '—'}</td>
                    <td className="p-3 text-charcoal-400">{photoCount}/3</td>
                    <td className="p-3"><span className={`badge ${STATUS_STYLE[e.status]} uppercase`}>{e.status}</span></td>
                    <td className="p-3">{e.platePrinted ? <span className="text-emerald-400 text-xs">printed</span> : <span className="text-charcoal-500 text-xs">—</span>}</td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => setModal(e)} className="text-xs text-terra-400">Edit</button>
                      {e.status === 'active' ? (
                        <>
                          <button onClick={() => changeStatus(e, 'withdrawn')} className="text-xs text-orange-400">Withdraw</button>
                          <button onClick={() => changeStatus(e, 'void')} className="text-xs text-red-400">Void</button>
                        </>
                      ) : (
                        <button onClick={() => changeStatus(e, 'active')} className="text-xs text-emerald-400">Reactivate</button>
                      )}
                      <button onClick={() => remove(e)} className="text-xs text-charcoal-500">Del</button>
                    </td>
                  </tr>
                );
              })}
              {entries.length === 0 && <tr><td colSpan={8} className="p-12 text-center text-charcoal-400">No entries yet. <button onClick={() => setModal('new')} className="text-terra-400">Add one</button>.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <EntryModal
          raceId={id}
          categories={categories}
          editing={modal === 'new' ? null : modal}
          lockedLifecycle={lockedLifecycle}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
