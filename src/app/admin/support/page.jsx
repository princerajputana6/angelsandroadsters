'use client';
import { useState, useEffect, useCallback } from 'react';

const STATUS_COLORS = {
  open: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'in-progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
  closed: 'bg-charcoal-700 text-charcoal-400 border-charcoal-600',
};

const PRIORITY_COLORS = {
  low: 'text-charcoal-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

const STATUS_OPTIONS = ['open', 'in-progress', 'resolved', 'closed'];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    fetch(`/api/admin/support${params}`)
      .then((r) => r.json())
      .then((j) => setTickets(j.tickets || []))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(load, [load]);

  const updateStatus = async (id, status) => {
    await fetch(`/api/support/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const sendReply = async (ticketId) => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/support/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      });
      setReply('');
      load();
    } finally {
      setSending(false);
    }
  };

  const counts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">HELPDESK</p>
          <h1 className="text-3xl sm:text-4xl font-display">Support Tickets</h1>
        </div>
        <div className="flex gap-2">
          <select
            className="input w-40 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card p-4"><div className="text-[10px] text-charcoal-400 uppercase">Total</div><div className="text-2xl font-display text-terra-400">{tickets.length}</div></div>
        <div className="card p-4"><div className="text-[10px] text-charcoal-400 uppercase">Open</div><div className="text-2xl font-display text-yellow-400">{counts.open || 0}</div></div>
        <div className="card p-4"><div className="text-[10px] text-charcoal-400 uppercase">In Progress</div><div className="text-2xl font-display text-blue-400">{counts['in-progress'] || 0}</div></div>
        <div className="card p-4"><div className="text-[10px] text-charcoal-400 uppercase">Resolved</div><div className="text-2xl font-display text-green-400">{counts.resolved || 0}</div></div>
      </div>

      {loading ? (
        <p className="text-charcoal-400">Loading…</p>
      ) : tickets.length === 0 ? (
        <div className="card p-12 text-center text-charcoal-400">No support tickets found.</div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t._id} className="card border border-charcoal-800/60">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-terra-400">{t.ticketRef}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[t.status]}`}>
                      {t.status}
                    </span>
                    <span className={`text-xs font-semibold capitalize ${PRIORITY_COLORS[t.priority]}`}>
                      {t.priority} priority
                    </span>
                    <span className="text-xs text-charcoal-500 capitalize">{t.category}</span>
                  </div>
                  <p className="font-semibold text-sm">{t.subject}</p>
                  <p className="text-xs text-charcoal-400 mt-0.5">
                    From: <strong>{t.name}</strong> · {t.email}
                    {t.phone && ` · ${t.phone}`}
                    {t.bookingTicketId && <span className="text-terra-400 ml-1">· Booking: {t.bookingTicketId}</span>}
                  </p>
                  <p className="text-xs text-charcoal-500">
                    {new Date(t.createdAt).toLocaleString('en-IN')} · {t.replies?.length || 0} replies
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    className="input text-xs py-1 px-2 w-36"
                    value={t.status}
                    onChange={(e) => updateStatus(t._id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setExpanded(expanded === t._id ? null : t._id)}
                    className="text-xs text-terra-400 hover:text-terra-300 whitespace-nowrap"
                  >
                    {expanded === t._id ? '▲ Collapse' : '▼ Expand'}
                  </button>
                </div>
              </div>

              {expanded === t._id && (
                <div className="border-t border-charcoal-800/60 p-4 space-y-4">
                  {/* Original message */}
                  <div className="bg-charcoal-900/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-charcoal-700 flex items-center justify-center text-xs font-bold">
                        {t.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{t.name}</div>
                        <div className="text-[10px] text-charcoal-500">{new Date(t.createdAt).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                    <p className="text-sm text-charcoal-200 whitespace-pre-wrap">{t.message}</p>
                  </div>

                  {/* Replies */}
                  {t.replies?.map((r, i) => (
                    <div
                      key={i}
                      className={`rounded-xl p-4 ${r.isAdmin
                        ? 'bg-terra-500/10 border border-terra-500/20 mr-4'
                        : 'bg-charcoal-900/40 ml-4'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          r.isAdmin ? 'bg-terra-500 text-charcoal-950' : 'bg-charcoal-700 text-charcoal-200'
                        }`}>
                          {r.isAdmin ? '⚡' : (r.authorName?.[0]?.toUpperCase() || 'U')}
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{r.authorName}</div>
                          <div className="text-[10px] text-charcoal-500">{new Date(r.createdAt).toLocaleString('en-IN')}</div>
                        </div>
                        {r.isAdmin && <span className="ml-auto text-[10px] bg-terra-500/20 text-terra-400 px-2 py-0.5 rounded-full">Admin Reply</span>}
                      </div>
                      <p className="text-sm text-charcoal-200 whitespace-pre-wrap">{r.message}</p>
                    </div>
                  ))}

                  {/* Admin reply box */}
                  <div className="flex gap-2 pt-2">
                    <textarea
                      className="input flex-1 text-sm resize-none"
                      rows={3}
                      placeholder="Type your reply to the user…"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />
                    <button
                      onClick={() => sendReply(t._id)}
                      disabled={sending || !reply.trim()}
                      className="btn btn-gold text-sm px-4 self-end disabled:opacity-40"
                    >
                      {sending ? 'Sending…' : 'Reply'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
