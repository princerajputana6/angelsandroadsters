'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRaceBoardQuery, useRaceBoardActionMutation } from '@/store/api';

function fmt(ms) {
  if (ms == null) return '—';
  const s = Math.floor(ms / 1000);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, '0')}`;
}

const STATE = {
  idle: { label: 'Not started', cls: 'bg-charcoal-700/50 text-charcoal-300' },
  out: { label: 'On track', cls: 'bg-emerald-500/20 text-emerald-300' },
  done: { label: 'Finished', cls: 'bg-terra-500/20 text-terra-400' },
};

export default function RaceBoardPage() {
  const { id } = useParams();
  const { data, isLoading } = useRaceBoardQuery(id, { pollingInterval: 0 });
  const [act, { isLoading: acting }] = useRaceBoardActionMutation();
  const [now, setNow] = useState(Date.now());

  // Tick every second so on-track timers update live.
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);

  const race = data?.race;
  const riders = data?.riders || [];
  const allIn = data?.allIn;
  const counts = data?.counts || { total: 0, done: 0, out: 0 };

  const run = async (action, entryId, confirmMsg) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    try { await act({ id, action, entryId }).unwrap(); }
    catch (e) { toast.error(e?.data?.message || 'Action failed'); }
  };

  if (isLoading) return <p className="text-charcoal-400">Loading board…</p>;

  const notStarted = race && !['active', 'completed'].includes(race.status);
  const active = race?.status === 'active';
  const ended = race?.status === 'completed';

  // Finished riders ranked by time (for the ended view).
  const ranked = [...riders].filter((r) => r.timeMs != null).sort((a, b) => a.timeMs - b.timeMs);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <Link href={`/admin/race/${id}`} className="text-xs text-charcoal-400 hover:text-terra-400">← {race?.name || 'Race'}</Link>
          <h1 className="text-3xl font-display mt-1">Race Board</h1>
          <p className="text-sm text-charcoal-400">{counts.total} riders · {counts.done} finished · {counts.out} on track</p>
        </div>
        <Link href={`/admin/race/${id}/results`} className="btn btn-outline">🏆 Full results</Link>
      </div>

      {riders.length === 0 ? (
        <div className="card p-10 text-center text-charcoal-400">
          No riders assigned to this race yet.{' '}
          <Link href={`/admin/race/${id}/entries`} className="text-terra-400">Add riders</Link>, then come back to start.
        </div>
      ) : notStarted ? (
        /* ---- Pre-start: confirm roster + Start Race ---- */
        <div className="space-y-4">
          <div className="card p-6 text-center">
            <p className="text-charcoal-300 mb-4">{riders.length} riders are ready. Starting the race opens the board so you can mark each rider OUT and IN.</p>
            <button onClick={() => run('start')} disabled={acting} className="btn btn-gold text-lg px-8 py-3">▶ Start Race</button>
          </div>
          <div className="card p-4">
            <h3 className="text-sm uppercase tracking-wider text-charcoal-500 mb-2">Riders</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {riders.map((r) => (
                <div key={r.entryId} className="flex items-center gap-2 p-2 rounded-lg bg-charcoal-800/40">
                  <span className="font-display text-xl text-terra-400">{r.raceNumber}</span>
                  <span className="text-sm truncate">{r.riderName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ---- Active / Ended board ---- */
        <>
          {ended && (
            <div className="card p-4 mb-4 border border-terra-500/30 text-center">
              <span className="badge bg-terra-500/20 text-terra-400 uppercase">Race ended</span>
              <p className="text-sm text-charcoal-400 mt-1">Final timings below · results are {race.resultsState}.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(ended ? ranked.concat(riders.filter((r) => r.timeMs == null)) : riders).map((r, i) => {
              const st = STATE[r.state];
              const elapsed = r.state === 'out' && r.startedAt ? now - new Date(r.startedAt).getTime() : null;
              return (
                <div key={r.entryId} className={`card p-4 ${r.state === 'out' ? 'ring-2 ring-emerald-500/50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {ended && r.timeMs != null && <span className="font-display text-2xl text-gold-400 w-7">{i + 1}</span>}
                      <span className="font-display text-4xl text-terra-400 leading-none">{r.raceNumber}</span>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{r.riderName}</div>
                        <div className="text-[11px] text-charcoal-500">
                          {r.timeMs != null ? `time ${fmt(r.timeMs)}` : st.label}
                        </div>
                      </div>
                    </div>
                    <span className={`badge ${st.cls} uppercase`}>{st.label}</span>
                  </div>

                  {r.state === 'out' && (
                    <div className="mt-2 text-center font-display text-3xl tabular-nums text-emerald-400">{fmt(elapsed)}</div>
                  )}

                  {active && r.state === 'idle' && (
                    <button onClick={() => run('out', r.entryId)} disabled={acting} className="btn btn-gold w-full mt-3 py-3">OUT — start rider</button>
                  )}
                  {active && r.state === 'out' && (
                    <button onClick={() => run('in', r.entryId)} disabled={acting} className="btn w-full mt-3 py-3 bg-emerald-500 text-white hover:bg-emerald-600">IN — finish rider</button>
                  )}
                  {r.state === 'done' && (
                    <div className="mt-3 text-center font-display text-2xl tabular-nums text-terra-400">⏱ {fmt(r.timeMs)}</div>
                  )}
                </div>
              );
            })}
          </div>

          {active && (
            <div className="sticky bottom-4 mt-6">
              <div className="card p-4 flex items-center justify-between gap-3">
                <span className="text-sm text-charcoal-400">
                  {allIn ? 'All riders are in — you can end the race.' : `Waiting for ${counts.total - counts.done} rider(s) to finish.`}
                </span>
                {allIn ? (
                  <button onClick={() => run('end', null, 'End the race and lock in timings?')} disabled={acting} className="btn btn-gold px-6">🏁 End Race</button>
                ) : (
                  <button onClick={() => run('end', null, 'Some riders are not in yet. End the race anyway?')} disabled={acting} className="btn btn-outline text-sm">End anyway</button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
