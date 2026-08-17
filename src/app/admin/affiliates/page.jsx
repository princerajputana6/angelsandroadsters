'use client';
import { useEffect, useState } from 'react';
import {
  useListAffiliatesQuery,
  useGetAffiliateQuery,
  useUpdateAffiliateMutation,
  useUpdateConversionMutation,
} from '@/store/api';
import toast from 'react-hot-toast';

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export default function AdminAffiliates() {
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const { data, isLoading } = useListAffiliatesQuery();

  const affiliates = (data?.affiliates || []).filter((a) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return a.code?.toLowerCase().includes(s)
      || a.user?.name?.toLowerCase().includes(s)
      || a.user?.email?.toLowerCase().includes(s);
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">PROGRAM</p>
          <h1 className="text-3xl sm:text-4xl font-display">Affiliation</h1>
        </div>
        <input className="input w-full sm:w-64" placeholder="Search name, email, code..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? <p>Loading...</p> : affiliates.length === 0 ? (
        <div className="card p-10 text-center text-charcoal-400">No affiliates yet.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
              <tr>
                <th className="text-left p-3">Affiliate</th>
                <th className="text-left p-3">Code</th>
                <th className="text-left p-3">Disc / Comm</th>
                <th className="text-left p-3">Clicks</th>
                <th className="text-left p-3">Sales</th>
                <th className="text-left p-3">Earned</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {affiliates.map((a) => (
                <tr key={a._id} className="hover:bg-white/[0.02]">
                  <td className="p-3">
                    <div className="font-medium">{a.user?.name || a.displayName || '—'}</div>
                    <div className="text-xs text-charcoal-500">{a.user?.email}</div>
                  </td>
                  <td className="p-3 font-mono text-xs">{a.code}</td>
                  <td className="p-3">{a.discountPercent || 0}% / {a.commissionPercent || 0}%</td>
                  <td className="p-3">{a.clicks || 0}</td>
                  <td className="p-3">{inr(a.totalSales)}</td>
                  <td className="p-3 text-gold-400">{inr(a.totalCommission)}</td>
                  <td className="p-3">
                    <span className={`badge ${a.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{a.status}</span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => setSelectedId(a._id)} className="btn btn-outline text-xs h-8 px-3">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedId && <AffiliateDrawer id={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function AffiliateDrawer({ id, onClose }) {
  const { data, isLoading } = useGetAffiliateQuery(id);
  const [updateAffiliate, { isLoading: saving }] = useUpdateAffiliateMutation();
  const [updateConversion] = useUpdateConversionMutation();
  const affiliate = data?.affiliate;
  const conversions = data?.conversions || [];

  const [discount, setDiscount] = useState('');
  const [commission, setCommission] = useState('');

  // Seed the inputs once the record loads.
  useEffect(() => {
    if (affiliate) {
      setDiscount(String(affiliate.discountPercent || 0));
      setCommission(String(affiliate.commissionPercent || 0));
    }
  }, [affiliate?._id]);

  const saveRates = async () => {
    try {
      await updateAffiliate({ id, body: { discountPercent: Number(discount), commissionPercent: Number(commission) } }).unwrap();
      toast.success('Rates updated');
    } catch (e) { toast.error('Failed to save'); }
  };

  const setStatus = async (status) => {
    try {
      await updateAffiliate({ id, body: { status } }).unwrap();
      toast.success(status === 'active' ? 'Reactivated' : 'Suspended');
    } catch (e) { toast.error('Failed'); }
  };

  const markConversion = async (cid, status) => {
    try {
      await updateConversion({ id: cid, status }).unwrap();
      toast.success(status === 'paid' ? 'Marked paid' : status === 'reversed' ? 'Reversed' : 'Updated');
    } catch (e) { toast.error('Failed'); }
  };

  const now = Date.now();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div className="w-full max-w-xl bg-charcoal-950 border-l border-charcoal-800 h-full overflow-y-auto p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow mb-1">AFFILIATE</p>
            <h2 className="text-2xl font-display">{affiliate?.user?.name || affiliate?.displayName || '—'}</h2>
            <p className="text-xs text-charcoal-500">{affiliate?.user?.email}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full border border-charcoal-800">✕</button>
        </div>

        {isLoading || !affiliate ? <p className="text-charcoal-400">Loading...</p> : (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Code" value={<span className="font-mono">{affiliate.code}</span>} />
              <Info label="Clicks" value={affiliate.clicks || 0} />
              <Info label="Conversions" value={affiliate.totalConversions || 0} />
              <Info label="Sales driven" value={inr(affiliate.totalSales)} />
              <Info label="Commission earned" value={inr(affiliate.totalCommission)} />
              <Info label="Commission paid" value={inr(affiliate.paidCommission)} />
            </div>

            {/* Application / payout details */}
            <div className="card p-4 text-sm space-y-1">
              <p className="font-semibold mb-1">Application</p>
              <DetailRow label="Phone" value={affiliate.phone} />
              <DetailRow label="Instagram" value={affiliate.instagram} />
              <DetailRow label="YouTube" value={affiliate.youtube} />
              <DetailRow label="Other" value={affiliate.otherSocial} />
              <DetailRow label="Audience" value={affiliate.audienceSize} />
              <DetailRow label="Promotes via" value={affiliate.promoDescription} />
              <div className="border-t border-charcoal-800 my-2" />
              <DetailRow label="Payout UPI" value={affiliate.payoutUpiId} />
              <DetailRow label="Payout name" value={affiliate.payoutName} />
            </div>

            {/* Rate config */}
            <div className="card p-4 space-y-3">
              <p className="font-semibold">Configure rates</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Follower discount %</label>
                  <input type="number" min="0" max="100" className="input" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
                <div>
                  <label className="label">Commission %</label>
                  <input type="number" min="0" max="100" className="input" value={commission} onChange={(e) => setCommission(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveRates} disabled={saving} className="btn btn-gold h-10 px-5 text-sm">{saving ? 'Saving...' : 'Save rates'}</button>
                {affiliate.status === 'active' ? (
                  <button onClick={() => setStatus('suspended')} className="btn btn-outline h-10 px-5 text-sm text-red-400 border-red-500/40">Suspend</button>
                ) : (
                  <button onClick={() => setStatus('active')} className="btn btn-outline h-10 px-5 text-sm text-green-400 border-green-500/40">Reactivate</button>
                )}
              </div>
            </div>

            {/* Conversions + payouts */}
            <div>
              <p className="font-semibold mb-2">Sales &amp; payouts</p>
              {conversions.length === 0 ? (
                <p className="text-sm text-charcoal-500">No sales yet.</p>
              ) : (
                <div className="space-y-2">
                  {conversions.map((c) => {
                    const eligible = c.eligibleAt && new Date(c.eligibleAt).getTime() <= now;
                    return (
                      <div key={c._id} className="card p-3 flex items-center justify-between gap-3">
                        <div className="text-sm min-w-0">
                          <div className="capitalize">{c.kind} · {inr(c.saleAmount)} <span className="text-gold-400">→ {inr(c.commissionAmount)}</span></div>
                          <div className="text-xs text-charcoal-500">
                            {new Date(c.createdAt).toLocaleDateString()} ·{' '}
                            {c.status === 'pending' && (eligible ? <span className="text-green-400">payable now</span> : `holds till ${new Date(c.eligibleAt).toLocaleDateString()}`)}
                            {c.status === 'paid' && <span className="text-green-400">paid</span>}
                            {c.status === 'reversed' && <span className="text-red-400">reversed</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {c.status !== 'paid' && (
                            <button onClick={() => markConversion(c._id, 'paid')} className="btn btn-outline text-xs h-8 px-2">Mark paid</button>
                          )}
                          {c.status !== 'reversed' ? (
                            <button onClick={() => markConversion(c._id, 'reversed')} className="btn btn-outline text-xs h-8 px-2 text-red-400 border-red-500/40">Reverse</button>
                          ) : (
                            <button onClick={() => markConversion(c._id, 'pending')} className="btn btn-outline text-xs h-8 px-2">Restore</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="card p-3">
      <div className="text-xs text-charcoal-500">{label}</div>
      <div className="font-display text-lg">{value}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-charcoal-500">{label}</span>
      <span className="text-right text-charcoal-200 break-words">{value || '—'}</span>
    </div>
  );
}
