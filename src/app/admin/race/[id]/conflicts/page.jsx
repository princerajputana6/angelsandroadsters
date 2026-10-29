'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useGetRaceQuery, useRaceConflictsQuery, useResolveRaceConflictMutation } from '@/store/api';

const TYPE_LABEL = {
  INTEGRITY_MISMATCH: 'Integrity mismatch',
  DUPLICATE_LAP: 'Duplicate lap',
  IMPOSSIBLE_SEQUENCE: 'Impossible sequence',
  FINISH_BEFORE_START: 'Finish before start',
  DNF_FINISH_CONFLICT: 'DNF + finish',
  DOUBLE_START: 'Double start',
  CLOCK_UNCERTAINTY: 'Clock uncertainty',
  SUSPICIOUS_INTERVAL: 'Suspicious interval',
  SEQUENCE_GAP: 'Sequence gap',
  VALIDATION_FAILED: 'Validation failed',
  OTHER: 'Other',
};
const STATUS_STYLE = {
  open: 'bg-red-500/20 text-red-300',
  resolved: 'bg-emerald-500/20 text-emerald-300',
  waived: 'bg-amber-500/20 text-amber-300',
};

export default function ConflictsPage() {
  const { id } = useParams();
  const { data: raceData } = useGetRaceQuery(id);
  const [filter, setFilter] = useState('open');
  const { data, isLoading } = useRaceConflictsQuery({ race: id, status: filter === 'all' ? undefined : filter });
  const [resolve] = useResolveRaceConflictMutation();
  const race = raceData?.race;
  const conflicts = data?.conflicts || [];

  const act = async (c, action) => {
    const reason = prompt(`Reason to ${action} this ${TYPE_LABEL[c.type] || c.type} conflict:`);
    if (reason == null || !reason.trim()) return;
    try { await resolve({ id: c._id, action, reason }).unwrap(); toast.success(`Conflict ${action === 'waive' ? 'waived' : 'resolved'}`); }
    catch (e) { toast.error(e?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <Link href={`/admin/race/${id}`} className="text-xs text-charcoal-400 hover:text-terra-400">← {race?.name || 'Race'}</Link>
          <h1 className="text-3xl font-display mt-1">Conflicts &amp; review</h1>
          <p className="text-sm text-charcoal-400">Source records are always preserved — resolving only closes the review item.</p>
        </div>
        <div className="flex gap-1">
          {['open', 'resolved', 'waived', 'all'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`btn text-xs ${filter === f ? 'btn-gold' : 'btn-outline'}`}>{f}</button>
          ))}
        </div>
      </div>

      {isLoading ? <p className="text-charcoal-400">Loading conflicts…</p> : (
        <div className="space-y-3">
          {conflicts.map((c) => (
            <div key={c._id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="badge bg-charcoal-700/50 text-charcoal-200 uppercase text-[10px]">{TYPE_LABEL[c.type] || c.type}</span>
                  <span className={`badge ${STATUS_STYLE[c.status]} uppercase text-[10px]`}>{c.status}</span>
                  {c.entry && <span className="text-sm">#{c.entry.raceNumber} {c.entry.riderName}</span>}
                </div>
                {c.status === 'open' && (
                  <div className="flex gap-2">
                    <button onClick={() => act(c, 'resolve')} className="btn btn-outline text-xs">Resolve</button>
                    <button onClick={() => act(c, 'waive')} className="btn btn-outline text-xs text-amber-300 border-amber-400/40">Waive</button>
                  </div>
                )}
              </div>
              <p className="text-sm text-charcoal-300 mt-2">{c.detail}</p>
              <div className="text-[11px] text-charcoal-500 mt-1">
                {c.relatedEventIds?.length ? `${c.relatedEventIds.length} related event(s)` : ''}
                {c.reason && <> · reason: <span className="text-charcoal-300">{c.reason}</span></>}
                {c.resolvedBy && <> · by {c.resolvedBy.name}</>}
              </div>
            </div>
          ))}
          {conflicts.length === 0 && <div className="card p-12 text-center text-charcoal-400">No {filter === 'all' ? '' : filter} conflicts. 🎉</div>}
        </div>
      )}
    </div>
  );
}
