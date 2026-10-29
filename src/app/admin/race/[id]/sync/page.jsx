'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRaceReconciliationQuery, useRevokeRaceSessionMutation } from '@/store/api';

const SESSION_STYLE = { open: 'bg-emerald-500/20 text-emerald-300', closed: 'bg-charcoal-700/40 text-charcoal-300', revoked: 'bg-red-500/20 text-red-300' };

export default function SyncHealthPage() {
  const { id } = useParams();
  const { data, isLoading } = useRaceReconciliationQuery(id);
  const [revoke] = useRevokeRaceSessionMutation();

  const devices = data?.devices || [];
  const sessions = data?.sessions || [];
  const receipts = data?.receipts || [];

  const doRevoke = async (s) => {
    const reason = prompt(`Revoke the ${s.checkpointType} session for ${s.official?.name}? Reason:`);
    if (reason == null || !reason.trim()) return;
    try { await revoke({ sessionId: s.sessionId, reason }).unwrap(); toast.success('Session revoked'); }
    catch (e) { toast.error(e?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href={`/admin/race/${id}`} className="text-xs text-charcoal-400 hover:text-terra-400">← {data?.race?.name || 'Race'}</Link>
        <h1 className="text-3xl font-display mt-1">Sync Health &amp; Reconciliation</h1>
        <p className="text-sm text-charcoal-400">Expected vs observed device sequences, pending counts, and batch receipts.</p>
      </div>

      {isLoading ? <p className="text-charcoal-400">Loading…</p> : (
        <div className="space-y-6">
          {/* Devices */}
          <section>
            <h2 className="font-display text-xl mb-2">Devices</h2>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
                  <tr><th className="text-left p-3">Device</th><th className="text-right p-3">Events</th><th className="text-left p-3">Seq range</th><th className="text-left p-3">Gaps</th><th className="text-right p-3">Last reported pending</th><th className="text-left p-3">Last sync</th></tr>
                </thead>
                <tbody className="divide-y divide-charcoal-800">
                  {devices.map((d) => (
                    <tr key={d.deviceId}>
                      <td className="p-3">{d.label || <span className="text-charcoal-500">{d.deviceId.slice(0, 8)}…</span>}</td>
                      <td className="p-3 text-right">{d.observedCount}</td>
                      <td className="p-3">{d.minSeq}–{d.maxSeq}</td>
                      <td className={`p-3 ${d.gaps.length ? 'text-amber-300' : 'text-charcoal-500'}`}>{d.gaps.length ? d.gaps.join(', ') : 'none'}</td>
                      <td className="p-3 text-right">{d.lastReportedPending ?? '—'}</td>
                      <td className="p-3 text-xs text-charcoal-400">{d.lastSyncAt ? new Date(d.lastSyncAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                  {devices.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-charcoal-400">No device activity yet.</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-charcoal-500 mt-1">“Last reported pending” is what the device last told the server — it may be stale. A gap may simply be an interrupted session; investigate rather than invent missing events.</p>
          </section>

          {/* Sessions */}
          <section>
            <h2 className="font-display text-xl mb-2">Checkpoint sessions</h2>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
                  <tr><th className="text-left p-3">Checkpoint</th><th className="text-left p-3">Official</th><th className="text-left p-3">Status</th><th className="text-right p-3">Accepted seq</th><th className="text-right p-3">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-charcoal-800">
                  {sessions.map((s) => (
                    <tr key={s.sessionId}>
                      <td className="p-3"><span className="capitalize">{s.checkpointType}</span> · {s.checkpointId}</td>
                      <td className="p-3 text-charcoal-300">{s.official?.name}</td>
                      <td className="p-3"><span className={`badge ${SESSION_STYLE[s.status]} uppercase text-[10px]`}>{s.status}</span></td>
                      <td className="p-3 text-right">{s.lastAcceptedDeviceSequence || 0}</td>
                      <td className="p-3 text-right">{s.status === 'open' && <button onClick={() => doRevoke(s)} className="text-xs text-red-400">Revoke</button>}</td>
                    </tr>
                  ))}
                  {sessions.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-charcoal-400">No sessions.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          {/* Receipts */}
          <section>
            <h2 className="font-display text-xl mb-2">Recent sync batches</h2>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
                  <tr><th className="text-left p-3">Received</th><th className="text-left p-3">Device</th><th className="text-right p-3">Events</th><th className="text-right p-3">Accepted</th><th className="text-right p-3">Dup</th><th className="text-right p-3">Review</th><th className="text-right p-3">Rejected</th></tr>
                </thead>
                <tbody className="divide-y divide-charcoal-800">
                  {receipts.map((r) => (
                    <tr key={r.batchId}>
                      <td className="p-3 text-xs">{new Date(r.receivedAt).toLocaleString()}</td>
                      <td className="p-3 text-xs text-charcoal-400">{(r.deviceId || '').slice(0, 8)}…</td>
                      <td className="p-3 text-right">{r.eventCount}</td>
                      <td className="p-3 text-right text-emerald-400">{r.acceptedCount}</td>
                      <td className="p-3 text-right">{r.alreadyAcceptedCount}</td>
                      <td className={`p-3 text-right ${r.needsReviewCount ? 'text-red-400' : ''}`}>{r.needsReviewCount}</td>
                      <td className={`p-3 text-right ${r.rejectedCount ? 'text-orange-400' : ''}`}>{r.rejectedCount}</td>
                    </tr>
                  ))}
                  {receipts.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-charcoal-400">No batches received yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
