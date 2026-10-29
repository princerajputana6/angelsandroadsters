'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useMeQuery, useRaceMySessionsQuery } from '@/store/api';
import { ThemeProvider, ThemeToggle } from '@/components/theme';
import { runPreflight, getLocalSession, getLocalBundle } from '@/lib/offline/preflight';
import { writeLocalEvent, listLocalEvents, localEventCounts, countLapsForEntry, lastEventForEntry } from '@/lib/offline/eventStore';
import { startSyncEngine, syncNow } from '@/lib/offline/sync';
import { storageEstimate } from '@/lib/offline/db';
import { getClock } from '@/lib/offline/clock';
import { getBoardState, pressIn, pressOut, cancelOut } from '@/lib/offline/trackBoard';

function fmtClock(ms) {
  if (ms == null) return '—';
  const s = Math.floor(ms / 1000);
  const mm = Math.floor(s / 60);
  return `${mm}:${String(s % 60).padStart(2, '0')}`;
}

const SYNC_BADGE = {
  acknowledged: { t: 'Synced', c: 'bg-emerald-500/20 text-emerald-300' },
  pending: { t: 'Pending sync', c: 'bg-amber-500/20 text-amber-300' },
  uploading: { t: 'Uploading…', c: 'bg-blue-500/20 text-blue-300' },
  needsReview: { t: 'Needs review', c: 'bg-red-500/20 text-red-300' },
  failed: { t: 'Save failed', c: 'bg-red-600/30 text-red-200' },
};

// ---------------------------------------------------------------- Session picker
function SessionPicker({ sessions, onPick }) {
  if (!sessions.length) {
    return (
      <div className="card p-6 text-center text-charcoal-400">
        No checkpoint sessions are assigned to you. Ask an admin to assign one under
        <span className="text-terra-400"> Race Management → Checkpoints &amp; Officials</span>.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <button key={s.sessionId} onClick={() => onPick(s)} className="card p-4 w-full text-left hover:border-terra-500/50">
          <div className="flex items-center justify-between">
            <span className="font-display text-xl capitalize">{s.checkpointType} checkpoint · {s.checkpointId}</span>
            <span className="badge bg-terra-500/20 text-terra-400 uppercase">{s.race?.name}</span>
          </div>
          <div className="text-xs text-charcoal-400 mt-1">{s.event?.title} · expires {new Date(s.expiresAt).toLocaleString()}</div>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Preflight
function Preflight({ session, onReady }) {
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);

  const run = async () => {
    setBusy(true);
    try {
      const r = await runPreflight(session.sessionId, `Official device`);
      setReport(r);
      if (r.ready) {
        toast.success('Ready for offline operation');
        onReady(session.sessionId);
      }
    } catch (e) {
      toast.error(e.message || 'Preflight failed');
      setReport({ ready: false, error: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-2xl font-display">Preflight — {session.checkpointType} · {session.checkpointId}</h2>
      <p className="text-sm text-charcoal-400">
        Download the roster &amp; rules and verify them before going offline. The race must be locked.
      </p>
      <button onClick={run} disabled={busy} className="btn btn-gold w-full py-3 text-lg">
        {busy ? 'Running checks…' : 'Run preflight & download roster'}
      </button>
      {report && (
        <ul className="text-sm space-y-1">
          <li>{report.steps?.checksumOk ? '✅' : '❌'} Bundle checksum verified</li>
          <li>{report.steps?.persistentStorage ? '✅' : '⚠️'} Persistent storage</li>
          <li>{report.steps?.clock?.uncertaintyMs != null ? '✅' : '⚠️'} Clock calibrated {report.steps?.clock?.uncertaintyMs != null ? `(±${report.steps.clock.uncertaintyMs}ms)` : ''}</li>
          <li>{report.bundle ? '✅' : '❌'} Roster loaded ({report.bundle?.rosterSize ?? 0} riders)</li>
          {(report.warnings || []).map((w, i) => <li key={i} className="text-amber-300">⚠️ {w}</li>)}
          {report.error && <li className="text-red-400">❌ {report.error}</li>}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Device status
function DeviceStatus({ sessionId, counts, lastSync, bundleVersion }) {
  const [online, setOnline] = useState(true);
  const [storage, setStorage] = useState(null);
  const [clock, setClock] = useState(null);

  useEffect(() => {
    const upd = () => setOnline(navigator.onLine);
    upd();
    window.addEventListener('online', upd);
    window.addEventListener('offline', upd);
    const iv = setInterval(async () => { setStorage(await storageEstimate()); setClock(await getClock()); }, 5000);
    (async () => { setStorage(await storageEstimate()); setClock(await getClock()); })();
    return () => { window.removeEventListener('online', upd); window.removeEventListener('offline', upd); clearInterval(iv); };
  }, []);

  return (
    <div className="card p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
      <div><span className="text-charcoal-500">Network</span><div className={online ? 'text-emerald-400' : 'text-red-400'}>{online ? 'Online (hint)' : 'Offline'}</div></div>
      <div><span className="text-charcoal-500">Pending</span><div className={counts.pending ? 'text-amber-300' : 'text-charcoal-300'}>{counts.pending}</div></div>
      <div><span className="text-charcoal-500">Synced</span><div className="text-emerald-400">{counts.acknowledged}</div></div>
      <div><span className="text-charcoal-500">Needs review</span><div className={counts.needsReview ? 'text-red-400' : 'text-charcoal-300'}>{counts.needsReview}</div></div>
      <div><span className="text-charcoal-500">Last sync</span><div className="text-charcoal-300">{lastSync || '—'}</div></div>
      <div><span className="text-charcoal-500">Clock</span><div className="text-charcoal-300">{clock?.uncertaintyMs != null ? `±${clock.uncertaintyMs}ms` : 'uncal.'}</div></div>
      <div><span className="text-charcoal-500">Storage</span><div className={storage && storage.pct >= 90 ? 'text-red-400' : 'text-charcoal-300'}>{storage ? `${storage.pct}%` : '—'}</div></div>
      <div><span className="text-charcoal-500">Config</span><div className="text-charcoal-300">v{bundleVersion}</div></div>
    </div>
  );
}

// ---------------------------------------------------------------- Track In/Out board
function TrackBoard({ sessionId, bundle, session, onChanged }) {
  const roster = bundle?.snapshot?.roster || [];
  const [board, setBoard] = useState({ outByEntry: {}, stats: {} });
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(null);

  const refresh = useCallback(async () => setBoard(await getBoardState(sessionId)), [sessionId]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);

  const toggle = async (r) => {
    const outAt = board.outByEntry[r.id];
    setBusy(r.id);
    try {
      if (outAt) {
        await pressIn(sessionId, bundle.race, r.id, { raceNumber: r.raceNumber, checkpointId: session?.checkpointId });
        toast.success(`#${r.raceNumber} IN · lap ${fmtClock(Date.now() - outAt)}`);
      } else {
        await pressOut(sessionId, r.id);
      }
      await refresh();
      onChanged?.();
      if (outAt) syncNow(sessionId);
    } catch (e) {
      toast.error('Save failed — ' + (e.message || ''));
    } finally {
      setBusy(null);
    }
  };

  const undo = async (r) => { await cancelOut(sessionId, r.id); await refresh(); };

  const sorted = [...roster].sort((a, b) => {
    const ao = board.outByEntry[a.id] ? 1 : 0;
    const bo = board.outByEntry[b.id] ? 1 : 0;
    return bo - ao || a.raceNumber - b.raceNumber;
  });

  if (!roster.length) return <div className="card p-8 text-center text-charcoal-400">No riders in the cached roster.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sorted.map((r) => {
        const outAt = board.outByEntry[r.id];
        const s = board.stats[r.id] || { laps: 0, lastMs: null, bestMs: null };
        const elapsed = outAt ? now - outAt : null;
        return (
          <div key={r.id} className={`card p-4 ${outAt ? 'ring-2 ring-emerald-500/50' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-display text-4xl text-terra-400 leading-none">{r.raceNumber}</span>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{r.displayName}</div>
                  <div className="text-[11px] text-charcoal-500">{s.laps} laps · last {fmtClock(s.lastMs)} · best {fmtClock(s.bestMs)}</div>
                </div>
              </div>
              {outAt
                ? <span className="badge bg-emerald-500/20 text-emerald-300 uppercase">on track</span>
                : <span className="badge bg-charcoal-700/50 text-charcoal-300 uppercase">in</span>}
            </div>

            {outAt && (
              <div className="mt-2 text-center">
                <div className="font-display text-3xl tabular-nums text-emerald-400">{fmtClock(elapsed)}</div>
                <button onClick={() => undo(r)} className="text-[10px] text-charcoal-500 hover:text-red-400">undo out</button>
              </div>
            )}

            <button
              onClick={() => toggle(r)}
              disabled={busy === r.id}
              className={`btn w-full mt-3 py-4 text-lg ${outAt ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'btn-gold'}`}
            >
              {busy === r.id ? '…' : outAt ? '● Press IN (finish lap)' : 'Press OUT ●'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- Control panel
function Control({ sessionId }) {
  const [bundle, setBundle] = useState(null);
  const [session, setSession] = useState(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [counts, setCounts] = useState({ pending: 0, acknowledged: 0, needsReview: 0, failed: 0, total: 0 });
  const [recent, setRecent] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [entryMeta, setEntryMeta] = useState({ laps: 0, last: null });
  const [view, setView] = useState('board'); // 'board' (In/Out) | 'search' (single rider)

  const refresh = useCallback(async () => {
    setCounts(await localEventCounts(sessionId));
    const evs = await listLocalEvents(sessionId);
    setRecent(evs.slice(0, 12));
  }, [sessionId]);

  useEffect(() => {
    (async () => {
      setBundle(await getLocalBundle(sessionId));
      setSession(await getLocalSession(sessionId));
      await refresh();
    })();
    const stop = startSyncEngine(sessionId, {
      onResult: (r) => {
        if (r?.ok) setLastSync(new Date().toLocaleTimeString());
        refresh();
      },
    });
    return stop;
  }, [sessionId, refresh]);

  useEffect(() => {
    if (!selected) { setEntryMeta({ laps: 0, last: null }); return; }
    (async () => {
      setEntryMeta({
        laps: await countLapsForEntry(sessionId, selected.id),
        last: await lastEventForEntry(sessionId, selected.id),
      });
    })();
  }, [selected, sessionId, counts]);

  const roster = bundle?.snapshot?.roster || [];
  const checkpointType = session?.checkpointType;
  const filtered = query
    ? roster.filter((r) => String(r.raceNumber).includes(query.trim()) || (r.displayName || '').toLowerCase().includes(query.trim().toLowerCase())).slice(0, 25)
    : [];

  const record = async (type, extraPayload = {}) => {
    if (!selected) return;
    try {
      await writeLocalEvent({
        sessionId,
        raceId: bundle.race,
        entryId: selected.id,
        type,
        payload: { raceNumber: selected.raceNumber, checkpointId: session?.checkpointId, ...extraPayload },
      });
      toast.success(`Saved on this device · ${type.replace('_', ' ').toLowerCase()}`);
      await refresh();
      syncNow(sessionId).then((r) => { if (r?.ok) setLastSync(new Date().toLocaleTimeString()); });
    } catch (e) {
      toast.error('Save failed — not recorded. ' + (e.message || ''));
    }
  };

  const actions = () => {
    if (checkpointType === 'start') return [{ t: 'Record START', type: 'RIDER_STARTED', cls: 'btn-gold' }];
    if (checkpointType === 'lap') return [{ t: `Confirm LAP (${entryMeta.laps + 1})`, type: 'LAP_RECORDED', cls: 'btn-gold' }];
    if (checkpointType === 'finish') return [
      { t: 'Record FINISH', type: 'RIDER_FINISHED', cls: 'btn-gold' },
      { t: 'Record DNF', type: 'DNF', cls: 'btn-outline' },
    ];
    return [];
  };

  return (
    <div className="space-y-4">
      <DeviceStatus sessionId={sessionId} counts={counts} lastSync={lastSync} bundleVersion={bundle?.configVersion} />

      {/* View switcher: the In/Out board (all riders) vs single-rider search. */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-charcoal-800/60 text-sm">
        <button onClick={() => setView('board')} className={`py-2 rounded-full font-semibold transition ${view === 'board' ? 'bg-terra-500 text-white' : 'text-charcoal-300'}`}>🏁 In / Out board</button>
        <button onClick={() => setView('search')} className={`py-2 rounded-full font-semibold transition ${view === 'search' ? 'bg-terra-500 text-white' : 'text-charcoal-300'}`}>🔎 Single rider</button>
      </div>

      {view === 'board' && (
        <TrackBoard sessionId={sessionId} bundle={bundle} session={session} onChanged={refresh} />
      )}

      {view === 'search' && (
      <div className="card p-4">
        <input
          autoFocus
          inputMode="numeric"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          placeholder="Search race number or name…"
          className="input w-full text-2xl py-4 text-center"
        />
        {filtered.length > 0 && !selected && (
          <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-charcoal-800">
            {filtered.map((r) => (
              <button key={r.id} onClick={() => setSelected(r)} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 text-left">
                <span className="font-display text-2xl text-terra-400 w-14">{r.raceNumber}</span>
                {r.riderPhoto
                  ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.riderPhoto} alt="" className="w-10 h-10 rounded object-cover" />
                  : <span className="w-10 h-10 rounded bg-charcoal-800" />}
                <span className="flex-1 truncate">{r.displayName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      )}

      {view === 'search' && selected && (
        <div className="card p-5 text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            {selected.riderPhoto
              ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={selected.riderPhoto} alt="" className="w-20 h-20 rounded-lg object-cover" />
              : <span className="w-20 h-20 rounded-lg bg-charcoal-800 flex items-center justify-center text-2xl">🏍</span>}
            <div className="text-left">
              <div className="font-display text-5xl text-terra-400 leading-none">{selected.raceNumber}</div>
              <div className="text-lg">{selected.displayName}</div>
              <div className="text-xs text-charcoal-400">Laps here: {entryMeta.laps} · last: {entryMeta.last ? entryMeta.last.type.replace('_', ' ').toLowerCase() : 'none'}</div>
            </div>
          </div>
          <div className="grid gap-2">
            {actions().map((a) => (
              <button key={a.type} onClick={() => record(a.type)} className={`btn ${a.cls} py-4 text-lg`}>{a.t}</button>
            ))}
            <button onClick={() => { setSelected(null); setQuery(''); }} className="btn btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-lg">Recent events</h3>
          <button onClick={() => syncNow(sessionId).then((r) => { if (r?.ok) setLastSync(new Date().toLocaleTimeString()); refresh(); })} className="btn btn-outline text-xs">Sync now</button>
        </div>
        <ul className="divide-y divide-charcoal-800 text-sm">
          {recent.map((e) => {
            const b = SYNC_BADGE[e.syncState] || SYNC_BADGE.pending;
            return (
              <li key={e.clientEventId} className="flex items-center justify-between py-2">
                <span><span className="font-display text-terra-400 mr-2">#{e.payload?.raceNumber ?? '—'}</span>{e.type.replace('_', ' ').toLowerCase()}</span>
                <span className={`badge ${b.c} text-[10px] uppercase`}>{b.t}</span>
              </li>
            );
          })}
          {recent.length === 0 && <li className="py-4 text-center text-charcoal-400">No events recorded on this device yet.</li>}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Page
export default function RaceControlPage() {
  const { data: me, isLoading: meLoading } = useMeQuery();
  const { data: sessData, isLoading: sessLoading, refetch } = useRaceMySessionsQuery(undefined, { skip: !me?.user });
  const [activeSession, setActiveSession] = useState(null); // full session object
  const [readySessionId, setReadySessionId] = useState(null);

  // Register the (conservative) service worker so the shell works offline.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/race-sw.js').catch(() => { /* non-fatal */ });
    }
  }, []);

  // If a selected session was already preflighted earlier, go straight to control.
  useEffect(() => {
    if (!activeSession) return;
    (async () => {
      const local = await getLocalSession(activeSession.sessionId);
      if (local?.status === 'ready') setReadySessionId(activeSession.sessionId);
    })();
  }, [activeSession]);

  const user = me?.user;

  return (
    <ThemeProvider defaultTheme="light" className="min-h-screen bg-charcoal-950 text-charcoal-100">
     <div className="p-4 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-5 gap-3">
        <div>
          <p className="eyebrow">RACE CONTROL</p>
          <h1 className="text-2xl font-display">Checkpoint</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {activeSession && (
            <button onClick={() => { setActiveSession(null); setReadySessionId(null); refetch?.(); }} className="btn btn-ghost text-sm">← Sessions</button>
          )}
        </div>
      </header>

      {meLoading ? (
        <p className="text-charcoal-400">Loading…</p>
      ) : !user ? (
        <div className="card p-6 text-center">
          <p className="mb-3">Sign in as an assigned official to record at a checkpoint.</p>
          <Link href="/login?next=/race-control" className="btn btn-gold">Sign in</Link>
        </div>
      ) : !activeSession ? (
        sessLoading ? <p className="text-charcoal-400">Loading your sessions…</p> : <SessionPicker sessions={sessData?.sessions || []} onPick={setActiveSession} />
      ) : readySessionId === activeSession.sessionId ? (
        <Control sessionId={activeSession.sessionId} />
      ) : (
        <Preflight session={activeSession} onReady={setReadySessionId} />
      )}

      <p className="text-[10px] text-charcoal-600 text-center mt-8">
        Local saves are durable on this device. Results are provisional until synced &amp; reviewed.
      </p>
     </div>
    </ThemeProvider>
  );
}
