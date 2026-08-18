'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useMyAffiliateQuery } from '@/store/api';
import toast from 'react-hot-toast';

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export default function AffiliateDashboard() {
  const { data, isLoading } = useMyAffiliateQuery();
  const [copied, setCopied] = useState(false);
  const affiliate = data?.affiliate;
  const conversions = data?.conversions || [];
  const summary = data?.summary || {};

  const shareUrl = affiliate
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${affiliate.code}`
    : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 1500);
    } catch (_) { toast.error('Could not copy'); }
  };

  if (isLoading) return <div className="animate-pulse text-charcoal-400">Loading...</div>;

  // Not enrolled yet. Onboarding is admin-managed, so point them to support
  // rather than a self-service signup.
  if (!affiliate) {
    return (
      <div className="card p-10 text-center">
        <div className="text-5xl mb-3">🔗</div>
        <h1 className="text-3xl font-display mb-2">Affiliate program</h1>
        <p className="text-charcoal-400 mb-6 max-w-md mx-auto">
          Our affiliate program is invite-only right now. If you'd like to partner with us,
          reach out and our team will get you set up.
        </p>
        <Link href="/contact" className="btn btn-gold h-12 px-6">Contact us</Link>
      </div>
    );
  }

  const stats = [
    ['Clicks', affiliate.clicks || 0],
    ['Conversions', affiliate.totalConversions || 0],
    ['Sales driven', inr(affiliate.totalSales)],
    ['Commission earned', inr(affiliate.totalCommission)],
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1">AFFILIATE</p>
        <h1 className="text-4xl font-display">Your affiliate hub</h1>
      </div>

      {/* Status + rates */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-charcoal-400 text-sm">Status</p>
          <p className={`text-2xl font-display ${affiliate.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
            {affiliate.status === 'active' ? 'Active' : 'Suspended'}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-charcoal-400 text-sm">Follower discount</p>
          <p className="text-2xl font-display text-terra-400">{affiliate.discountPercent || 0}%</p>
        </div>
        <div className="card p-5">
          <p className="text-charcoal-400 text-sm">Your commission</p>
          <p className="text-2xl font-display text-gold-400">{affiliate.commissionPercent || 0}%</p>
        </div>
      </div>

      {(!affiliate.discountPercent && !affiliate.commissionPercent) && (
        <div className="card p-4 border-yellow-500/30 bg-yellow-500/5 text-sm text-yellow-300">
          Your link is live and tracking clicks. Your discount and commission rates are being set up by our team — they'll appear here once configured.
        </div>
      )}

      {/* Share link */}
      <div className="card p-5">
        <p className="text-sm text-charcoal-400 mb-2">Your share link</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input readOnly value={shareUrl} className="input flex-1 font-mono text-sm" onFocus={(e) => e.target.select()} />
          <button onClick={copy} className="btn btn-gold h-11 px-6 whitespace-nowrap">{copied ? 'Copied ✓' : 'Copy link'}</button>
        </div>
        <p className="text-xs text-charcoal-500 mt-2">Code: <span className="font-mono text-charcoal-300">{affiliate.code}</span> — works across events and shop.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(([label, val]) => (
          <div key={label} className="card p-5">
            <p className="text-charcoal-400 text-sm">{label}</p>
            <p className="text-3xl font-display text-terra-400">{val}</p>
          </div>
        ))}
      </div>

      {/* Earnings summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-charcoal-400 text-sm">Paid out</p>
          <p className="text-2xl font-display text-green-400">{inr(affiliate.paidCommission)}</p>
        </div>
        <div className="card p-5">
          <p className="text-charcoal-400 text-sm">Pending</p>
          <p className="text-2xl font-display">{inr(summary.pendingCommission)}</p>
        </div>
        <div className="card p-5">
          <p className="text-charcoal-400 text-sm">Ready to pay (7-day hold cleared)</p>
          <p className="text-2xl font-display text-gold-400">{inr(summary.payableCommission)}</p>
        </div>
      </div>

      {/* Conversions */}
      <div>
        <h2 className="text-xl font-display mb-3">Recent sales</h2>
        {conversions.length === 0 ? (
          <div className="card p-8 text-center text-charcoal-400">No sales yet. Share your link to get started!</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Sale</th>
                  <th className="text-left p-3">Commission</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {conversions.map((c) => (
                  <tr key={c._id}>
                    <td className="p-3 text-charcoal-300">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 capitalize">{c.kind}</td>
                    <td className="p-3">{inr(c.saleAmount)}</td>
                    <td className="p-3 text-gold-400">{inr(c.commissionAmount)}</td>
                    <td className="p-3">
                      <span className={`badge ${
                        c.status === 'paid' ? 'bg-green-500/20 text-green-400'
                        : c.status === 'reversed' ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                      }`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
