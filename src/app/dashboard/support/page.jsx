'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const STATUS_COLORS = {
  open: 'bg-yellow-500/20 text-yellow-400',
  'in-progress': 'bg-blue-500/20 text-blue-400',
  resolved: 'bg-green-500/20 text-green-400',
  closed: 'bg-charcoal-700 text-charcoal-400',
};

export default function DashboardSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/support')
      .then((r) => r.json())
      .then((j) => setTickets(j.tickets || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="eyebrow mb-1">DASHBOARD</p>
          <h1 className="text-3xl font-display">My Support Tickets</h1>
        </div>
        <Link href="/help" className="btn btn-gold text-sm px-4 py-2">
          + New Ticket
        </Link>
      </div>

      {loading ? (
        <p className="text-charcoal-400">Loading…</p>
      ) : tickets.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-4">🎫</div>
          <h3 className="font-display text-xl mb-2">No tickets yet</h3>
          <p className="text-charcoal-400 mb-5">Need help? Raise a support ticket and we'll get back to you.</p>
          <Link href="/help" className="btn btn-gold">Get Help</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div key={t._id} className="card border border-charcoal-800/60">
              <button
                type="button"
                className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                onClick={() => setExpanded(expanded === t._id ? null : t._id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs text-terra-400">{t.ticketRef}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[t.status]}`}>
                      {t.status}
                    </span>
                    <span className="text-xs text-charcoal-500 capitalize bg-charcoal-800/50 px-2 py-0.5 rounded-full">
                      {t.category}
                    </span>
                  </div>
                  <p className="font-semibold text-sm">{t.subject}</p>
                  <p className="text-xs text-charcoal-500 mt-0.5">
                    {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}{t.replies?.length || 0} replies
                  </p>
                </div>
                <span className="text-terra-400 text-xs shrink-0">{expanded === t._id ? '▲ Collapse' : '▼ View'}</span>
              </button>

              {expanded === t._id && (
                <div className="border-t border-charcoal-800/60 p-4 space-y-4">
                  {/* Original message */}
                  <div className="bg-charcoal-900/60 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-terra-500/20 flex items-center justify-center text-xs font-bold text-terra-400">
                        {t.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{t.name}</div>
                        <div className="text-[10px] text-charcoal-500">{new Date(t.createdAt).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                    <p className="text-sm text-charcoal-200 whitespace-pre-wrap">{t.message}</p>
                    {t.bookingTicketId && (
                      <p className="text-xs text-charcoal-500 mt-2">Booking ref: <span className="text-terra-400 font-mono">{t.bookingTicketId}</span></p>
                    )}
                  </div>

                  {/* Replies */}
                  {t.replies?.map((r, i) => (
                    <div
                      key={i}
                      className={`rounded-xl p-4 ${r.isAdmin
                        ? 'bg-terra-500/10 border border-terra-500/20 ml-4'
                        : 'bg-charcoal-900/40 mr-4'
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
                        {r.isAdmin && <span className="ml-auto text-[10px] bg-terra-500/20 text-terra-400 px-2 py-0.5 rounded-full">Support</span>}
                      </div>
                      <p className="text-sm text-charcoal-200 whitespace-pre-wrap">{r.message}</p>
                    </div>
                  ))}

                  {/* Reply box (only if not closed/resolved) */}
                  {!['closed', 'resolved'].includes(t.status) && (
                    <div className="flex gap-2 pt-2">
                      <textarea
                        className="input flex-1 text-sm resize-none"
                        rows={2}
                        placeholder="Add a reply or provide more details…"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                      />
                      <button
                        onClick={() => sendReply(t._id)}
                        disabled={sending || !reply.trim()}
                        className="btn btn-gold text-sm px-4 self-end disabled:opacity-40"
                      >
                        Send
                      </button>
                    </div>
                  )}
                  {['closed', 'resolved'].includes(t.status) && (
                    <p className="text-xs text-charcoal-500 text-center pt-2">
                      This ticket is {t.status}. <Link href="/help" className="text-terra-400 hover:underline">Open a new ticket</Link> if you need further help.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
