'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  useRaceResultsQuery,
  useRecomputeRaceMutation,
  useFinalizeRaceResultsMutation,
  useAdjustRaceResultMutation,
} from '@/store/api';

function fmt(ms) {
  if (ms == null) return '—';
  const s = Math.floor(ms / 1000);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  const mmm = ms % 1000;
  return `${mm}:${String(ss).padStart(2, '0')}.${String(mmm).padStart(3, '0')}`;
}

// Parse "m:ss", "m:ss.mmm" or plain seconds (e.g. "95.5") → ms. '' → null; bad → NaN.
function parseTimeToMs(str) {
  const t = (str || '').trim();
  if (!t) return null;
  if (t.includes(':')) {
    const [mPart, sPart] = t.split(':');
    const m = Number(mPart);
    const s = Number(sPart);
    if (!Number.isFinite(m) || !Number.isFinite(s)) return NaN;
    return Math.round(m * 60000 + s * 1000);
  }
  const secs = Number(t);
  if (!Number.isFinite(secs)) return NaN;
  return Math.round(secs * 1000);
}

const STATE_STYLE = {
  none: 'bg-charcoal-700/40 text-charcoal-300',
  provisional: 'bg-amber-500/20 text-amber-300',
  final: 'bg-emerald-500/20 text-emerald-300',
};
const ROW_STATUS = {
  finished: 'text-emerald-400', running: 'text-blue-300', dnf: 'text-orange-400', dns: 'text-charcoal-500', disqualified: 'text-red-400',
};

/** Manual post-race adjustment for one rider: points + time override + note. */
function AdjustModal({ raceId, result, onClose }) {
  const [adjust, { isLoading }] = useAdjustRaceResultMutation();
  const [points, setPoints] = useState(String(result.manualPoints ?? 0));
  const [time, setTime] = useState(result.adjustedTimeMs != null ? fmt(result.adjustedTimeMs) : '');
  const [note, setNote] = useState(result.adjustNote || '');
  const name = result.entry?.displayName || result.entry?.riderName || `#${result.entry?.raceNumber}`;
  const hadOverride = result.adjustedTimeMs != null;

  const save = async (clearTime = false) => {
    const p = Number(points);
    if (!Number.isFinite(p)) return toast.error('Points must be a number');
    let timeMs;
    if (!clearTime) {
      timeMs = parseTimeToMs(time);
      if (Number.isNaN(timeMs)) return toast.error('Time must look like 1:30.500 or seconds (90.5)');
    }
    try {
      await adjust({ id: raceId, entry: result.entry?._id || result.entry, points: p, timeMs: clearTime ? undefined : timeMs, clearTime, note }).unwrap();
      toast.success('Adjustment saved');
      onClose();
    } catch (e) { toast.error(e?.data?.message || 'Failed to save'); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-charcoal-950/80 backdrop-blur overflow-y-auto">
      <div className="card-glass p-4 sm:p-6 w-full max-w-md space-y-4 my-4 sm:my-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display">Adjust — {name}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full border border-charcoal-700">✕</button>
        </div>

        <label className="block">
          <span className="text-xs text-charcoal-400">Points (use a negative number to deduct)</span>
          <input type="number" className="input mt-1 w-full" value={points} onChange={(e) => setPoints(e.target.value)} />
        </label>

        <label className="block">
          <span className="text-xs text-charcoal-400">Final time override</span>
          <input className="input mt-1 w-full" value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g. 1:30.500 or 90.5 — blank keeps computed" />
          <span className="text-[11px] text-charcoal-500">
            Computed: {fmt(result.totalTimeMs)}{hadOverride ? ' · currently overridden' : ''}
          </span>
        </label>

        <label className="block">
          <span className="text-xs text-charcoal-400">Reason / note (optional)</span>
          <input className="input mt-1 w-full" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 10s penalty — jumped start" />
        </label>

        <div className="flex items-center justify-between gap-2 pt-1">
          {hadOverride
            ? <button type="button" onClick={() => save(true)} disabled={isLoading} className="text-xs text-charcoal-400 hover:text-red-400">Clear time override</button>
            : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="button" onClick={() => save(false)} disabled={isLoading} className="btn btn-gold">{isLoading ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams();
  const { data, isLoading } = useRaceResultsQuery(id);
  const [recompute, { isLoading: recomputing }] = useRecomputeRaceMutation();
  const [finalize, { isLoading: finalizing }] = useFinalizeRaceResultsMutation();
  const [adjusting, setAdjusting] = useState(null); // result row being edited

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
      <p className="text-xs text-charcoal-500 mb-3">Tip: use “Adjust” to assign/deduct points or edit a rider’s time. Riders are ranked by points first (more wins), then by time. Manual edits stay put through ↻ Recompute.</p>

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
                <th className="text-right p-3">Points</th>
                <th className="text-center p-3">Flags</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {results.map((r) => {
                const edited = r.adjustedTimeMs != null;
                return (
                  <tr key={r._id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-display text-lg">{r.displayRank || r.rank || '—'}</td>
                    <td className="p-3 font-display text-terra-400">{r.entry?.raceNumber ?? '—'}</td>
                    <td className="p-3">{r.entry?.displayName || r.entry?.riderName || '—'}</td>
                    <td className={`p-3 uppercase text-xs font-semibold ${ROW_STATUS[r.status] || ''}`}>{r.status}</td>
                    <td className="p-3 text-right">{r.lapsCompleted}</td>
                    <td className="p-3 text-right tabular-nums">
                      {fmt(r.effectiveTimeMs ?? r.totalTimeMs)}
                      {edited && <span title={`Edited · computed ${fmt(r.totalTimeMs)}`} className="ml-1 text-amber-300">✎</span>}
                    </td>
                    <td className="p-3 text-right tabular-nums">{fmt(r.bestLapMs)}</td>
                    <td className={`p-3 text-right tabular-nums font-semibold ${r.manualPoints > 0 ? 'text-emerald-400' : r.manualPoints < 0 ? 'text-red-400' : 'text-charcoal-400'}`}>{r.manualPoints || 0}</td>
                    <td className="p-3 text-center">
                      {r.hasOpenConflicts && <span title="Open conflict" className="text-red-400">⚠</span>}
                      {r.provisional && <span title="Provisional" className="text-amber-300 ml-1">◌</span>}
                      {r.adjustNote && <span title={r.adjustNote} className="text-charcoal-400 ml-1">📝</span>}
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => setAdjusting(r)} className="text-xs text-terra-400">Adjust</button>
                    </td>
                  </tr>
                );
              })}
              {results.length === 0 && <tr><td colSpan={10} className="p-12 text-center text-charcoal-400">No results yet. Recompute after events sync.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {adjusting && <AdjustModal raceId={id} result={adjusting} onClose={() => setAdjusting(null)} />}
    </div>
  );
}
