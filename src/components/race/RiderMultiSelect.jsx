'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiSearch, FiUserPlus, FiCheckSquare, FiSquare } from 'react-icons/fi';
import { useListRidersQuery, useCreateRiderMutation } from '@/store/api';
import { fmtParticipantNo } from '@/lib/participantNo';

/**
 * Searchable, checkbox list of riders from the GLOBAL rider pool. Controlled by
 * the parent via a `picked` Set of rider ids + an `onToggle(riderId)` callback.
 *
 * The pool is shared across every race: a rider added here (or inline, below) is
 * stored once and can be entered into any number of races. This component is
 * reused by the New Race modal (pick participants) and the dashboard / entries
 * "Add entries" modals so the selection UI stays identical everywhere.
 *
 * Inline add: typing a name that isn't already in the pool reveals an
 * "Add … to the pool" button, which creates the rider globally and selects it.
 *
 * Props:
 *  - alreadyIn   optional Set of rider ids already entered in the target race.
 *                Those rows stay visible (so the full pool is always shown) but
 *                are marked "In race" and can't be re-selected.
 *  - showSelectAll  render the Select-all / Clear controls (default true).
 */
export default function RiderMultiSelect({ picked, onToggle, height = 'max-h-64', alreadyIn, showSelectAll = true }) {
  const [q, setQ] = useState('');
  const { data, isLoading } = useListRidersQuery(q ? { q } : {});
  const [createRider, { isLoading: creating }] = useCreateRiderMutation();
  const riders = data?.riders || [];
  const inRace = alreadyIn || new Set();

  const query = q.trim();
  const exactMatch = riders.some((r) => (r.name || '').trim().toLowerCase() === query.toLowerCase());
  const canAddNew = query.length >= 1 && !exactMatch;

  // Riders that can still be picked (not already in the race).
  const selectable = riders.filter((r) => !inRace.has(r._id));
  const allSelected = selectable.length > 0 && selectable.every((r) => picked.has(r._id));

  const selectAll = () => {
    // Pick every still-selectable rider that isn't picked yet.
    selectable.forEach((r) => { if (!picked.has(r._id)) onToggle(r._id); });
  };
  const clearAll = () => {
    selectable.forEach((r) => { if (picked.has(r._id)) onToggle(r._id); });
  };

  const addNew = async () => {
    if (!query) return;
    try {
      const res = await createRider({ name: query }).unwrap();
      const id = res?.rider?._id;
      if (id) onToggle(id); // auto-select the newly created rider
      toast.success(`Added "${query}" to the pool`);
      setQ(''); // reset search so the full pool (incl. the new rider) shows
    } catch (err) {
      toast.error(err?.data?.message || 'Could not add rider');
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-500" />
        <input
          className="input w-full pl-9"
          placeholder="Search or type a new participant's name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {canAddNew && (
        <button
          type="button"
          onClick={addNew}
          disabled={creating}
          className="btn btn-outline w-full text-sm justify-center"
        >
          <FiUserPlus /> {creating ? 'Adding…' : `Add “${query}” to the pool`}
        </button>
      )}

      {showSelectAll && selectable.length > 0 && (
        <div className="flex items-center justify-between text-xs text-charcoal-400 px-1">
          <button
            type="button"
            onClick={allSelected ? clearAll : selectAll}
            className="inline-flex items-center gap-1.5 text-terra-400 hover:text-terra-300"
          >
            {allSelected ? <FiSquare /> : <FiCheckSquare />}
            {allSelected ? 'Clear all' : `Select all${q ? ' matching' : ''} (${selectable.length})`}
          </button>
          <span>{[...picked].filter((id) => !inRace.has(id)).length} selected</span>
        </div>
      )}

      <div className={`overflow-y-auto divide-y divide-charcoal-800 border border-charcoal-800 rounded-xl ${height}`}>
        {isLoading ? (
          <p className="p-3 text-sm text-charcoal-400">Loading…</p>
        ) : (
          riders.map((r) => {
            const isIn = inRace.has(r._id);
            return (
              <label
                key={r._id}
                className={`flex items-center gap-3 p-2.5 ${isIn ? 'opacity-60 cursor-default' : 'cursor-pointer hover:bg-white/5'}`}
              >
                <input
                  type="checkbox"
                  checked={isIn || picked.has(r._id)}
                  disabled={isIn}
                  onChange={() => !isIn && onToggle(r._id)}
                />
                {r.photo?.url
                  ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.photo.url} alt="" className="w-8 h-8 rounded object-cover" />
                  : <span className="w-8 h-8 rounded bg-charcoal-800" />}
                <span className="flex-1 min-w-0">
                  <span className="text-sm truncate flex items-center gap-2">
                    {r.participantNo != null && (
                      <span className="text-[10px] font-mono text-terra-400/90 bg-terra-400/10 rounded px-1 py-0.5">{fmtParticipantNo(r.participantNo)}</span>
                    )}
                    <span className="truncate">{r.name}</span>
                  </span>
                  <span className="text-[11px] text-charcoal-500">{[r.bike?.make, r.bike?.model].filter(Boolean).join(' ')}</span>
                </span>
                {isIn && <span className="text-[10px] uppercase tracking-wide text-emerald-400 whitespace-nowrap">In race</span>}
              </label>
            );
          })
        )}
        {!isLoading && riders.length === 0 && !canAddNew && (
          <p className="p-4 text-sm text-charcoal-400 text-center">
            No riders in the pool yet. Type a name above to add one, or manage the full list under{' '}
            <Link href="/admin/race/riders" className="text-terra-400">Rider Pool</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
