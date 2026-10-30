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
import { SCORING_PRESETS, DEFAULT_PRESET } from '@/lib/raceScoring';

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
 * Manual post-race adjustment for one rider: disqualify, points, and the
 * final time. The time is a single editable field; the +/− chips and the
 * add/subtract stepper just push that visible value up or down (penalties),
 * so what you see is exactly what gets saved.
 */
function AdjustModal({ raceId, result, onClose }) {
  const [adjust, { isLoading }] = useAdjustRaceResultMutation();
  const [points, setPoints] = useState(String(result.manualPoints ?? 0));
  // One visible final-time value, pre-filled with the current time.
  const initialTime = result.adjustedTimeMs != null
    ? fmt(result.adjustedTimeMs)
    : (result.totalTimeMs != null ? fmt(result.totalTimeMs) : '');
  const [time, setTime] = useState(initialTime);
  const [stepMin, setStepMin] = useState('');
  const [stepSec, setStepSec] = useState('');
  const [dsq, setDsq] = useState((result.manualStatus || result.effectiveStatus) === 'disqualified');
  const [note, setNote] = useState(result.adjustNote || '');

  const name = result.entry?.displayName || result.entry?.riderName || `#${result.entry?.raceNumber}`;
  const wasDsq = result.manualStatus === 'disqualified';
  const hadOverride = result.adjustedTimeMs != null;
  const computedMs = result.totalTimeMs;

  // Shift the visible time by `sec` seconds (penalty +, bonus −), clamped at 0.
  const bump = (sec) => {
    const cur = parseTimeToMs(time);
    const base = (cur == null || Number.isNaN(cur)) ? (computedMs ?? 0) : cur;
    setTime(fmt(Math.max(0, Math.round(base + sec * 1000))));
  };
  const bumpStep = (dir) => {
    const step = (Number(stepMin) || 0) * 60 + (Number(stepSec) || 0);
    if (!step) return;
    bump(dir * step);
    setStepMin(''); setStepSec('');
  };

  const save = async () => {
    const p = Number(points);
    if (!Number.isFinite(p)) return toast.error('Points must be a number');

    const body = { id: raceId, entry: result.entry?._id || result.entry, points: p, note };

    // Time: empty → revert to computed; otherwise save the typed time. If it
    // equals the computed time we drop the override instead of pinning it.
    const t = time.trim();
    if (!t) {
      if (hadOverride) body.clearTime = true;
    } else {
      const timeMs = parseTimeToMs(t);
      if (Number.isNaN(timeMs)) return toast.error('Time must look like 1:30.500 or seconds (90.5)');
      if (computedMs != null && timeMs === computedMs) {
        if (hadOverride) body.clearTime = true;
      } else {
        body.timeMs = timeMs;
      }
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

        {/* Final time — directly editable, with penalty helpers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-charcoal-400">Final time</span>
            {hadOverride && (
              <button type="button" onClick={() => setTime(computedMs != null ? fmt(computedMs) : '')} className="text-[11px] text-charcoal-500 hover:text-terra-400">reset to computed</button>
            )}
          </div>
          <input className="input w-full tabular-nums" value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g. 4:32.500 or 90.5" />
          <span className="text-[11px] text-charcoal-500">Computed: {fmt(computedMs)} — edit directly, or use the penalty buttons below.</span>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {PENALTY_CHIPS.map((c) => (
              <button key={c.label} type="button" onClick={() => bump(c.sec)}
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
            <button type="button" onClick={() => bumpStep(1)} className="btn btn-outline px-3">+ Add</button>
            <button type="button" onClick={() => bumpStep(-1)} className="btn btn-outline px-3">− Sub</button>
          </div>
        </div>

        <label className="block">
          <span className="text-xs text-charcoal-400">Reason / note (optional)</span>
          <input className="input mt-1 w-full" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. +30s route cut, +45s crash" />
        </label>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button type="button" onClick={save} disabled={isLoading} className="btn btn-gold">{isLoading ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

/** In-app Auto-points confirmation (replaces window.confirm, which is
 * unreliable inside the PWA / Android webview). Pick the table, then Assign. */
function AutoPointsModal({ raceId, preset, setPreset, autoPoints, busy, onClose }) {
  const p = SCORING_PRESETS[preset] || SCORING_PRESETS[DEFAULT_PRESET];
  const assign = async () => {
    try {
      const r = await autoPoints({ id: raceId, preset }).unwrap();
      toast.success(`Points assigned to ${r.assigned} finisher(s)`);
      onClose();
    } catch (e) { toast.error(e?.data?.message || 'Auto-assign failed'); }
  };
  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-charcoal-950/80 backdrop-blur overflow-y-auto">
      <div className="card-glass p-4 sm:p-6 w-full max-w-md space-y-4 my-4 sm:my-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display">Assign points by ranking</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full border border-charcoal-700">✕</button>
        </div>

        <label className="block">
          <span className="text-xs text-charcoal-400">Scoring table</span>
          <select value={preset} onChange={(e) => setPreset(e.target.value)} className="input mt-1 w-full">
            {Object.values(SCORING_PRESETS).map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
          </select>
        </label>

        <div className="rounded-lg border border-charcoal-800 p-3 text-xs text-charcoal-300">
          <div className="grid grid-cols-5 gap-y-1 gap-x-2 tabular-nums">
            {p.table.map((v, i) => (
              <span key={i}><span className="text-charcoal-500">{i + 1}</span> {v}</span>
            ))}
          </div>
          <div className="mt-2 text-charcoal-400">Every other finisher: <span className="text-charcoal-200">{p.participation}</span></div>
        </div>
        <p className="text-[11px] text-charcoal-500">Finishers are ranked by time; disqualified riders are skipped. This overwrites existing points.</p>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button type="button" onClick={assign} disabled={busy} className="btn btn-gold">{busy ? 'Assigning…' : 'Assign points'}</button>
        </div>
      </div>
    </div>
  );
}

/** In-app Finalize confirmation (replaces window.prompt/confirm). */
function FinalizeModal({ raceId, finalize, busy, onClose }) {
  const [reason, setReason] = useState('');
  const [waive, setWaive] = useState(false);
  const go = async () => {
    if (!reason.trim()) return toast.error('A reason is required');
    try {
      await finalize({ id: raceId, reason, waiveOpenConflicts: waive }).unwrap();
      toast.success('Results finalized');
      onClose();
    } catch (e) {
      const msg = e?.data?.message || 'Finalize failed';
      if (/open conflict/i.test(msg) && !waive) toast.error(`${msg} — tick “waive conflicts” to finalize anyway.`);
      else toast.error(msg);
    }
  };
  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-charcoal-950/80 backdrop-blur overflow-y-auto">
      <div className="card-glass p-4 sm:p-6 w-full max-w-md space-y-4 my-4 sm:my-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display">Finalize results</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full border border-charcoal-700">✕</button>
        </div>
        <label className="block">
          <span className="text-xs text-charcoal-400">Reason (recorded in the audit log)</span>
          <input className="input mt-1 w-full" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Reviewed and approved" />
        </label>
        <label className="flex items-center gap-2 text-sm text-charcoal-300 cursor-pointer">
          <input type="checkbox" checked={waive} onChange={(e) => setWaive(e.target.checked)} className="accent-terra-500" />
          Waive any open conflicts and finalize anyway
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button type="button" onClick={go} disabled={busy} className="btn btn-gold">{busy ? 'Finalizing…' : 'Finalize'}</button>
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
  const [preset, setPreset] = useState(DEFAULT_PRESET); // scoring table for auto-points

  const race = data?.race;
  const results = data?.results || [];

  const doRecompute = async () => {
    try { const r = await recompute(id).unwrap(); toast.success(`Recomputed · ${r.conflicts.openCount} open conflict(s)`); }
    catch (e) { toast.error(e?.data?.message || 'Recompute failed'); }
  };

  const [showAuto, setShowAuto] = useState(false);
  const [showFinalize, setShowFinalize] = useState(false);

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
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={doRecompute} disabled={recomputing} className="btn btn-outline">{recomputing ? 'Recomputing…' : '↻ Recompute'}</button>
          <button onClick={() => setShowAuto(true)} disabled={autoAssigning} className="btn btn-outline">{autoAssigning ? 'Assigning…' : '⚡ Auto-points'}</button>
          {race?.resultsState !== 'final' && <button onClick={() => setShowFinalize(true)} disabled={finalizing} className="btn btn-gold">{finalizing ? 'Finalizing…' : 'Finalize results'}</button>}
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
      {showAuto && <AutoPointsModal raceId={id} preset={preset} setPreset={setPreset} autoPoints={autoPoints} busy={autoAssigning} onClose={() => setShowAuto(false)} />}
      {showFinalize && <FinalizeModal raceId={id} finalize={finalize} busy={finalizing} onClose={() => setShowFinalize(false)} />}
    </div>
  );
}
