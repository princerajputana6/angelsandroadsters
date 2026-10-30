'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiPlay, FiDownload, FiWifi, FiWifiOff, FiRefreshCw, FiChevronLeft, FiWind } from 'react-icons/fi';
import { ThemeProvider, ThemeToggle } from '@/components/theme';
import { useMeQuery, useListRacesQuery } from '@/store/api';
import { writeLocalEvent, localEventCounts } from '@/lib/offline/eventStore';
import {
  listBoardRaces, getBoardRace, downloadRaceForBoard, refreshBoardRoster, setBoardFlags, deriveBoardState, boardSessionId,
} from '@/lib/offline/boardStore';
import { startBoardSyncEngine, syncBoardNow } from '@/lib/offline/boardSync';

function fmt(ms) {
  if (ms == null) return '—';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// --------------------------------------------------------------- status bar
function StatusBar({ raceId, lastSync }) {
  const [online, setOnline] = useState(true);
  const [counts, setCounts] = useState({ pending: 0, acknowledged: 0 });
  useEffect(() => {
    const upd = () => setOnline(navigator.onLine);
    upd();
    window.addEventListener('online', upd); window.addEventListener('offline', upd);
    const tick = async () => setCounts(await localEventCounts(boardSessionId(raceId)));
    tick();
    const iv = setInterval(tick, 2000);
    return () => { window.removeEventListener('online', upd); window.removeEventListener('offline', upd); clearInterval(iv); };
  }, [raceId]);
  return (
    <div className="card p-3 flex items-center justify-between text-xs">
      <span className={`inline-flex items-center gap-1 ${online ? 'text-emerald-400' : 'text-amber-400'}`}>
        {online ? <FiWifi /> : <FiWifiOff />} {online ? 'Online' : 'Offline'}
      </span>
      <span className={counts.pending ? 'text-amber-300' : 'text-charcoal-400'}>{counts.pending} pending</span>
      <span className="text-emerald-400">{counts.acknowledged} synced</span>
      <span className="text-charcoal-400">last sync {lastSync || '—'}</span>
    </div>
  );
}

// --------------------------------------------------------------- picker
function Picker({ onOpen }) {
  const { data: me } = useMeQuery();
  const { data: racesData } = useListRacesQuery({}, { skip: !me?.user });
  const [cached, setCached] = useState([]);
  const [busy, setBusy] = useState(null);
  const refresh = useCallback(async () => setCached(await listBoardRaces()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const serverRaces = racesData?.races || [];
  const cachedIds = new Set(cached.map((c) => c.raceId));

  const download = async (raceId) => {
    setBusy(raceId);
    try { await downloadRaceForBoard(raceId); toast.success('Downloaded for offline use'); await refresh(); }
    catch (e) { toast.error(e.message || 'Download failed (are you online?)'); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl mb-2">Downloaded races (work offline)</h2>
        {cached.length === 0 ? <p className="text-sm text-charcoal-400">None yet. Download a race below while you have internet.</p> : (
          <div className="space-y-2">
            {cached.map((c) => (
              <button key={c.raceId} onClick={() => onOpen(c.raceId)} className="card p-4 w-full text-left hover:border-terra-500/50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-xs text-charcoal-500">{c.roster?.length || 0} riders{c.endedAt ? ' · ended' : c.startedAt ? ' · running' : ''}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-xl mb-2">Add a race (needs internet)</h2>
        {!me?.user ? (
          <p className="text-sm text-charcoal-400">Sign in while online to download a race. <Link href="/login?next=/race-board" className="text-terra-400">Sign in</Link></p>
        ) : serverRaces.length === 0 ? (
          <p className="text-sm text-charcoal-400">No races found (or you are offline).</p>
        ) : (
          <div className="space-y-2">
            {serverRaces.filter((r) => !cachedIds.has(r._id)).map((r) => (
              <div key={r._id} className="card p-3 flex items-center justify-between">
                <span className="text-sm">{r.name} <span className="text-charcoal-500">· {r.event?.title}</span></span>
                <button onClick={() => download(r._id)} disabled={busy === r._id} className="btn btn-outline text-xs"><FiDownload /> {busy === r._id ? '…' : 'Download'}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------- board
function Board({ raceId }) {
  const [race, setRace] = useState(null);
  const [state, setState] = useState({ byEntry: {}, allIn: false, counts: { total: 0, out: 0, done: 0 } });
  const [now, setNow] = useState(Date.now());
  const [lastSync, setLastSync] = useState(null);
  const [busy, setBusy] = useState(null);

  const refresh = useCallback(async () => {
    const r = await getBoardRace(raceId);
    setRace(r);
    if (r) setState(await deriveBoardState(raceId, r.roster || []));
  }, [raceId]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);
  useEffect(() => {
    const stop = startBoardSyncEngine(raceId, {
      onResult: async (res) => {
        if (res?.ok) setLastSync(new Date().toLocaleTimeString());
        // Pull in any riders added to the race since download (online-only, safe offline).
        try { await refreshBoardRoster(raceId); } catch { /* keep cached roster */ }
        refresh();
      },
    });
    return stop;
  }, [raceId, refresh]);

  if (!race) return <p className="text-charcoal-400">Loading…</p>;
  const roster = race.roster || [];
  const started = !!race.startedAt;
  const ended = !!race.endedAt;

  const start = async () => { await setBoardFlags(raceId, { startedAt: new Date().toISOString() }); await refresh(); };

  const mark = async (entryId, type, raceNumber) => {
    setBusy(entryId);
    try {
      await writeLocalEvent({ sessionId: boardSessionId(raceId), raceId, entryId, type, payload: { raceNumber } });
      await refresh();
      syncBoardNow(raceId).then((r) => { if (r?.ok) setLastSync(new Date().toLocaleTimeString()); });
    } catch (e) { toast.error('Save failed — ' + (e.message || '')); }
    finally { setBusy(null); }
  };

  const end = async () => {
    if (!confirm('End the race and lock in timings?')) return;
    await setBoardFlags(raceId, { endedAt: new Date().toISOString() });
    await refresh();
    syncBoardNow(raceId).then((r) => { if (r?.ok) setLastSync(new Date().toLocaleTimeString()); });
  };

  const ranked = roster
    .map((r) => ({ ...r, ...state.byEntry[r.entryId] }))
    .filter((r) => r.timeMs != null)
    .sort((a, b) => a.timeMs - b.timeMs);

  const sorted = [...roster].sort((a, b) => {
    const ao = state.byEntry[a.entryId]?.state === 'out' ? 1 : 0;
    const bo = state.byEntry[b.entryId]?.state === 'out' ? 1 : 0;
    return bo - ao || a.raceNumber - b.raceNumber;
  });

  return (
    <div className="space-y-4">
      <StatusBar raceId={raceId} lastSync={lastSync} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl">{race.name}</h2>
          <p className="text-xs text-charcoal-400">{state.counts.total} riders · {state.counts.done} finished · {state.counts.out} on track</p>
        </div>
        <button onClick={async () => { const r = await syncBoardNow(raceId); if (r?.ok) setLastSync(new Date().toLocaleTimeString()); try { await refreshBoardRoster(raceId); } catch { /* keep cached roster */ } refresh(); }} className="btn btn-outline text-xs"><FiRefreshCw /> Sync</button>
      </div>

      {!started ? (
        <div className="card p-6 text-center">
          <p className="text-charcoal-300 mb-4">{roster.length} riders ready. This board works fully offline — it syncs automatically when you get internet.</p>
          <button onClick={start} className="btn btn-gold text-lg px-8 py-3"><FiPlay /> Start Race</button>
        </div>
      ) : (
        <>
          {ended && ranked[0] && (
            <div className="card p-5 text-center border border-terra-500/30">
              <span className="badge bg-terra-500/20 text-terra-400 uppercase">Race ended</span>
              <p className="mt-2">🏆 Winner: <span className="font-display text-2xl text-gold-400">#{ranked[0].raceNumber} {ranked[0].riderName}</span> · {fmt(ranked[0].timeMs)}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(ended ? ranked.concat(roster.filter((r) => state.byEntry[r.entryId]?.timeMs == null)) : sorted).map((r, i) => {
              const st = state.byEntry[r.entryId] || { state: 'idle' };
              const elapsed = st.state === 'out' && st.startedAt ? now - new Date(st.startedAt).getTime() : null;
              return (
                <div key={r.entryId} className={`card p-4 ${st.state === 'out' ? 'ring-2 ring-emerald-500/50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {ended && st.timeMs != null && <span className="font-display text-2xl text-gold-400 w-6">{i + 1}</span>}
                      <span className="font-display text-4xl text-terra-400 leading-none">{r.raceNumber}</span>
                      <div className="min-w-0"><div className="font-semibold truncate">{r.riderName}</div>
                        <div className="text-[11px] text-charcoal-500">{st.timeMs != null ? `time ${fmt(st.timeMs)}` : st.state === 'out' ? 'on track' : 'not started'}</div>
                      </div>
                    </div>
                  </div>
                  {st.state === 'out' && <div className="mt-2 text-center font-display text-3xl tabular-nums text-emerald-400">{fmt(elapsed)}</div>}
                  {!ended && st.state === 'idle' && <button onClick={() => mark(r.entryId, 'RIDER_STARTED', r.raceNumber)} disabled={busy === r.entryId} className="btn btn-gold w-full mt-3 py-3">OUT — start</button>}
                  {!ended && st.state === 'out' && <button onClick={() => mark(r.entryId, 'RIDER_FINISHED', r.raceNumber)} disabled={busy === r.entryId} className="btn w-full mt-3 py-3 bg-emerald-500 text-white hover:bg-emerald-600">IN — finish</button>}
                  {st.state === 'done' && <div className="mt-3 text-center font-display text-2xl tabular-nums text-terra-400">⏱ {fmt(st.timeMs)}</div>}
                </div>
              );
            })}
          </div>

          {!ended && (
            <div className="sticky bottom-4 card p-4 flex items-center justify-between gap-3">
              <span className="text-sm text-charcoal-400">{state.allIn ? 'All riders are in.' : `Waiting for ${state.counts.total - state.counts.done} rider(s).`}</span>
              <button onClick={end} className={`btn px-6 ${state.allIn ? 'btn-gold' : 'btn-outline text-sm'}`}>🏁 End Race</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --------------------------------------------------------------- page
export default function RaceBoardPage() {
  const [raceId, setRaceId] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/race-sw.js').catch(() => {});
  }, []);

  // Deep-link: /race-board?race=<id> auto-downloads (if online) and opens it.
  useEffect(() => {
    const rid = new URLSearchParams(window.location.search).get('race');
    if (!rid) return;
    (async () => {
      try { if (navigator.onLine && !(await getBoardRace(rid))) await downloadRaceForBoard(rid); } catch (_) { /* offline / not cached */ }
      setRaceId(rid);
    })();
  }, []);

  return (
    <ThemeProvider defaultTheme="light" className="min-h-screen bg-charcoal-950 text-charcoal-100">
      <div className="p-4 max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-5 gap-3">
          <div className="flex items-center gap-2">
            {raceId && <button onClick={() => setRaceId(null)} className="btn btn-ghost text-sm"><FiChevronLeft /> Races</button>}
            <div>
              <p className="eyebrow flex items-center gap-1"><FiWind /> OFFLINE RACE BOARD</p>
              {!raceId && <h1 className="text-2xl font-display">Pick a race</h1>}
            </div>
          </div>
          <ThemeToggle />
        </header>

        {raceId ? <Board raceId={raceId} /> : <Picker onOpen={setRaceId} />}

        <p className="text-[10px] text-charcoal-600 text-center mt-8">Works with no internet. Everything syncs automatically when a connection returns.</p>
      </div>
    </ThemeProvider>
  );
}
