'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FiSearch } from 'react-icons/fi';
import { useListRidersQuery } from '@/store/api';

/**
 * Searchable, checkbox list of riders from the global pool. Controlled by the
 * parent via a `picked` Set of rider ids + an `onToggle(riderId)` callback.
 * Shared by the New Race modal (pick participants) and the dashboard
 * "Add entries" modal so the selection UI stays identical everywhere.
 */
export default function RiderMultiSelect({ picked, onToggle, height = 'max-h-64' }) {
  const [q, setQ] = useState('');
  const { data, isLoading } = useListRidersQuery(q ? { q } : {});
  const riders = data?.riders || [];

  return (
    <div className="space-y-2">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-500" />
        <input
          className="input w-full pl-9"
          placeholder="Search the rider pool…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className={`overflow-y-auto divide-y divide-charcoal-800 border border-charcoal-800 rounded-xl ${height}`}>
        {isLoading ? (
          <p className="p-3 text-sm text-charcoal-400">Loading…</p>
        ) : (
          riders.map((r) => (
            <label key={r._id} className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-white/5">
              <input type="checkbox" checked={picked.has(r._id)} onChange={() => onToggle(r._id)} />
              {r.photo?.url
                ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.photo.url} alt="" className="w-8 h-8 rounded object-cover" />
                : <span className="w-8 h-8 rounded bg-charcoal-800" />}
              <span className="flex-1 min-w-0">
                <span className="text-sm truncate block">{r.name}</span>
                <span className="text-[11px] text-charcoal-500">{[r.bike?.make, r.bike?.model].filter(Boolean).join(' ')}</span>
              </span>
            </label>
          ))
        )}
        {!isLoading && riders.length === 0 && (
          <p className="p-4 text-sm text-charcoal-400 text-center">
            No riders in the pool. Add them under <Link href="/admin/race/riders" className="text-terra-400">Rider Pool</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
