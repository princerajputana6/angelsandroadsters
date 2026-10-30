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
  useAutoAssignPointsMutation,
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

// Format a signed second-delta like "+30.0s" / "−1:05.0".
function fmtDelta(sec) {
  if (!sec) return '±0s';
  const sign = sec > 0 ? '+' : '−';
  const abs = Math.abs(sec);
  if (abs >= 60) {
    const mm = Math.floor(abs / 60);
    const ss = (abs % 60).toFixed(1);
    return `${sign}${mm}:${String(ss).padStart(4, '0')}`;
  }
  return `${sign}${abs.toFixed(1)}s`;
}

const PENALTY_CHIPS = [
  { label: '+5s', sec: 5 },
  { label: '+10s', sec: 10 },
  { label: '+30s', sec: 30 },
  { label: '+45s', sec: 45 },
  { label: '+1:00', sec: 60 },
  { label: '−5s', sec: -5 },
  { label: '−10s', sec: -10 },
];

/**
 * Manual post-race adjustment for one rider: disqualify, points, a time
 * penalty/bonus (add or subtract seconds/minutes), an exact time override,
 * and a note.
 */
function AdjustModal({ raceId, result, onClose }) {
  const [adjust, { isLoading }] = useAdjustRaceResultMutation();
  const [points, setPoints] = useState(String(result.manualPoints ?? 0));
  const [deltaSec, setDeltaSec] = useState(0);         // pending penalty/bonus
  const [stepMin, setStepMin] = useState('');          // custom add/subtract inputs
  const [stepSec, setStepSec] = useState('');
  const [exact, setExact] = useState('');              // optional exact override
  const [showExact, setShowExact] = useState(false);
  const [dsq, setDsq] = useState((result.manualStatus || result.effectiveStatus) === 'disqualified');
  const [note, setNote] = useState(result.adjustNote || '');

  const name = result.entry?.displayName || result.entry?.riderName || `#${result.entry?.raceNumber}`;
  const wasDsq = result.manualStatus === 'disqualified';
  const hadOverride = result.adjustedTimeMs != null;
  const baseMs = result.adjustedTimeMs != null ? result.adjustedTimeMs : result.totalTimeMs;
  const previewMs = baseMs != null ? Math.max(0, baseMs + Math.round(deltaSec * 1000)) : null;

  const addStep = (dir) => {
    const m = Number(stepMin) || 0;
    const s = Number(stepSec) || 0;
    const step = m * 60 + s;
    if (!step) return;
    setDeltaSec((d) => d + dir * step);
    setStepMin(''); setStepSec('');
  };

  const save = async () => {
    const p = Number(points);
    if (!Number.isFinite(p)) return toast.error('Points must be a number');

    const body = { id: raceId, entry: result.entry?._id || result.entry, points: p, note };

    // Time: a penalty/bonus wins; else an exact override if typed.
    if (deltaSec !== 0) {
      if (baseMs == null) return toast.error('No base time to adjust — set an exact time instead.');
      body.timeDeltaMs = Math.round(deltaSec * 1000);
    } else if (showExact && exact.trim()) {
      const timeMs = parseTimeToMs(exact);
      if (Number.isNaN(timeMs)) return toast.error('Time must look like 1:30.500 or seconds (90.5)');
      body.timeMs = timeMs;
    }

    // Status override (disqualify / un-disqualify).
    if (dsq && !wasDsq) body.status = 'disqualified';
    else if (!dsq && wasDsq) body.clearStatus = true;

    try {
      await adjust(body).unwrap();
      toast.success('Adjustment saved');
      onClose();
    } catch (e) { toast.error(e?.data?.message || 'Failed to save'); }
  };

  const clearTimeOverride = async () => {
    try {
      await adjust({ id: raceId, entry: result.entry?._id || result.entry, points: Number(points) || 0, clearTime: true, note }).unwrap();
      toast.success('Time override cleared');
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

        {/* Disqualify */}
        <button
          type="button"
          onClick={() => setDsq((v) => !v)}
          className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${dsq ? 'border-red-500/60 bg-red-500/15 text-red-300' : 'border-charcoal-700 text-charcoal-300 hover:border-red-500/40'}`}
        >
          <span className="font-semibold uppercase tracking-wide">{dsq ? 'Disqualified (DSQ)' : 'Disqualify rider'}</span>
          <span className={`w-10 h-5 rounded-full relative transition ${dsq ? 'bg-red-500' : 'bg-charcoal-700'}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${dsq ? 'left-5' : 'left-0.5'}`} />
          </span>
        </button>

        <label className="block">
          <span className="text-xs text-charcoal-400">Points (use a negative number to deduct)</span>
          <input type="number" className="input mt-1 w-full" value={points} onChange={(e) => setPoints(e.target.value)} />
        </label>

        {/* Time penalty / bonus */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-charcoal-400">Time penalty / bonus</span>
            {deltaSec !== 0 && (
              <button type="button" onClick={() => setDeltaSec(0)} className="text-[11px] text-charcoal-500 hover:text-terra-400">reset</button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PENALTY_CHIPS.map((c) => (
              <button key={c.label} type="button" onClick={() => setDeltaSec((d) => d + c.sec)}
                className="px-2.5 py-1 rounded-md border border-charcoal-700 text-xs hover:border-terra-400 hover:text-terra-400">
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <label className="block flex-1">
              <span className="text-[11px] text-charcoal-500">min</span>
              <input type="number" min="0" className="input mt-0.5 w-full" value={stepMin} onChange={(e) => setStepMin(e.target.value)} placeholder="0" />
            </label>
            <label className="block flex-1">
              <span className="text-[11px] text-charcoal-500">sec</span>
              <input type="number" min="0" step="0.1" className="input mt-0.5 w-full" value={stepSec} onChange={(e) => setStepSec(e.target.value)} placeholder="0" />
            </label>
            <button type="button" onClick={() => addStep(1)} className="btn btn-outline px-3">+ Add</button>
            <button type="button" onClick={() => addStep(-1)} className="btn btn-outline px-3">− Sub</button>
          </div>
          <p className="text-[11px] text-charcoal-500">
            {baseMs == null ? 'No computed time yet — use exact time below.' : (
              <>Current {fmt(baseMs)} → <span className="text-charcoal-200">New {fmt(previewMs)}</span> <span className="text-terra-400">({fmtDelta(deltaSec)})</span></>
            )}
          </p>
        </div>

        {/* Exact override (secondary) */}
        <div>
          {!showExact ? (
            <button type="button" onClick={() => { setShowExact(true); setExact(hadOverride ? fmt(result.adjustedTimeMs) : ''); }} className="text-xs text-charcoal-400 hover:text-terra-400">
              Set exact time instead…
            </button>
          ) : (
            <label className="block">
              <span className="text-xs text-charcoal-400">Exact time override (overrides penalty)</span>
              <input className="input mt-1 w-full" value={exact} onChange={(e) => setExact(e.target.value)} placeholder="e.g. 1:30.500 or 90.5" disabled={deltaSec !== 0} />
              <span className="text-[11px] text-charcoal-500">{deltaSec !== 0 ? 'Clear the penalty to use an exact time.' : `Computed: ${fmt(result.totalTimeMs)}`}</span>
            </label>
          )}
        </div>

        <label className="block">
          <span className="text-xs text-charcoal-400">Reason / note (optional)</span>
          <input className="input mt-1 w-full" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. +30s route cut, +45s crash" />
        </label>

        <div className="flex items-center justify-between gap-2 pt-1">
          {hadOverride
            ? <button type="button" onClick={clearTimeOverride} disabled={isLoading} className="text-xs text-charcoal-400 hover:text-red-400">Clear time override</button>
            : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="button" onClick={save} disabled={isLoading} className="btn btn-gold">{isLoading ? 'Saving…' : 'Save'}</button>
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
  const [autoPoints, { isLoading: autoAssigning }] = useAutoAssignPointsMutation();
  const [adjusting, setAdjusting] = useState(null); // result row being edited

  const race = data?.race;
  const results = data?.results || [];

  const doRecompute = async () => {
    try { const r = await recompute(id).unwrap(); toast.success(`Recomputed · ${r.conflicts.openCount} open conflict(s)`); }
    catch (e) { toast.error(e?.data?.message || 'Recompute failed'); }
  };

  const doAutoPoints = async () => {
    if (!confirm('Assign points by finishing position? 1st 100, 2nd 90, 3rd 80, 4th 72, 5th 65, 6th 60, 7th 55, 8th 50, 9th 46, 10th 42, every other finisher 25. This overwrites existing points.')) return;
    try { const r = await autoPoints({ id }).unwrap(); toast.success(`Points assigned to ${r.assigned} finisher(s)`); }
    catch (e) { toast.error(e?.data?.message || 'Auto-assign failed'); }
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
          <button onClick={doAutoPoints} disabled={autoAssigning} className="btn btn-outline">{autoAssigning ? 'Assigning…' : '⚡ Auto-points'}</button>
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
                const status = r.effectiveStatus || r.status;
                const isDsq = status === 'disqualified';
                return (
                  <tr key={r._id} className={`hover:bg-white/[0.02] ${isDsq ? 'opacity-70' : ''}`}>
                    <td className="p-3 font-display text-lg">{isDsq ? 'DSQ' : (r.displayRank || r.rank || '—')}</td>
                    <td className="p-3 font-display text-terra-400">{r.entry?.raceNumber ?? '—'}</td>
                    <td className="p-3">{r.entry?.displayName || r.entry?.riderName || '—'}</td>
                    <td className={`p-3 uppercase text-xs font-semibold ${ROW_STATUS[status] || ''}`}>
                      {status}{r.manualStatus ? <span title="Manually set" className="ml-1 text-charcoal-500">·m</span> : ''}
                    </td>
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
