'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  useRaceResultsQuery,
  useRecomputeRaceMutation,
  useFinalizeRaceResultsMutation,
} from '@/store/api';

function fmt(ms) {
  if (ms == null) return '—';
  const s = Math.floor(ms / 1000);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  const mmm = ms % 1000;
  return `${mm}:${String(ss).padStart(2, '0')}.${String(mmm).padStart(3, '0')}`;
}

const STATE_STYLE = {
  none: 'bg-charcoal-700/40 text-charcoal-300',
  provisional: 'bg-amber-500/20 text-amber-300',
  final: 'bg-emerald-500/20 text-emerald-300',
};
const ROW_STATUS = {
  finished: 'text-emerald-400', running: 'text-blue-300', dnf: 'text-orange-400', dns: 'text-charcoal-500', disqualified: 'text-red-400',
};

export default function ResultsPage() {
  const { id } = useParams();
  const { data, isLoading } = useRaceResultsQuery(id);
  const [recompute, { isLoading: recomputing }] = useRecomputeRaceMutation();
  const [finalize, { isLoading: finalizing }] = useFinalizeRaceResultsMutation();

  const race = data?.race;
  const results = data?.results || [];

  const doRecompute = async () => {
    try { const r = await recompute(id).unwrap(); toast.success(`Recomputed · ${r.conflicts.openCount} open conflict(s)`); }
    catch (e) { toast.error(e?.data?.message || 'Recompute failed'); }
  };

  const doFinalize = async () => {
    const reason = prompt('Reason for finalizing results (recorded in the audit log):');
    if (reason == null || !reason.trim()) return;
    try {
      await finalize({ id, reason }).unwrap();
      toast.success('Results finalized');
    } catch (e) {
      const msg = e?.data?.message || 'Finalize failed';
      if (/open conflict/i.test(msg)) {
        if (confirm(`${msg}\n\nWaive the open conflicts and finalize anyway?`)) {
          try { await finalize({ id, reason, waiveOpenConflicts: true }).unwrap(); toast.success('Finalized (conflicts waived)'); }
          catch (e2) { toast.error(e2?.data?.message || 'Finalize failed'); }
        }
      } else toast.error(msg);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <Link href={`/admin/race/${id}`} className="text-xs text-charcoal-400 hover:text-terra-400">← {race?.name || 'Race'}</Link>
          <h1 className="text-3xl font-display mt-1">Results</h1>
          <p className="text-sm text-charcoal-400">
            State: <span className={`badge ${STATE_STYLE[race?.resultsState] || ''} uppercase`}>{race?.resultsState || 'none'}</span>
            {race?.resultsState !== 'final' && <span className="ml-2">— provisional until finalized</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={doRecompute} disabled={recomputing} className="btn btn-outline">{recomputing ? 'Recomputing…' : '↻ Recompute'}</button>
          {race?.resultsState !== 'final' && <button onClick={doFinalize} disabled={finalizing} className="btn btn-gold">{finalizing ? 'Finalizing…' : 'Finalize results'}</button>}
        </div>
      </div>

      {isLoading ? <p className="text-charcoal-400">Loading results…</p> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
              <tr>
                <th className="text-left p-3">Rank</th>
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Rider</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Laps</th>
                <th className="text-right p-3">Total time</th>
                <th className="text-right p-3">Best lap</th>
                <th className="text-center p-3">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {results.map((r) => (
                <tr key={r._id} className="hover:bg-white/[0.02]">
                  <td className="p-3 font-display text-lg">{r.rank || '—'}</td>
                  <td className="p-3 font-display text-terra-400">{r.entry?.raceNumber ?? '—'}</td>
                  <td className="p-3">{r.entry?.displayName || r.entry?.riderName || '—'}</td>
                  <td className={`p-3 uppercase text-xs font-semibold ${ROW_STATUS[r.status] || ''}`}>{r.status}</td>
                  <td className="p-3 text-right">{r.lapsCompleted}</td>
                  <td className="p-3 text-right tabular-nums">{fmt(r.totalTimeMs)}</td>
                  <td className="p-3 text-right tabular-nums">{fmt(r.bestLapMs)}</td>
                  <td className="p-3 text-center">
                    {r.hasOpenConflicts && <span title="Open conflict" className="text-red-400">⚠</span>}
                    {r.provisional && <span title="Provisional" className="text-amber-300 ml-1">◌</span>}
                  </td>
                </tr>
              ))}
              {results.length === 0 && <tr><td colSpan={8} className="p-12 text-center text-charcoal-400">No results yet. Recompute after events sync.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
