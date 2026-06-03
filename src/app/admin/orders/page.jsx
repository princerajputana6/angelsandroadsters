'use client';
import { useState } from 'react';
import { useListOrdersQuery, useUpdateOrderMutation } from '@/store/api';
import toast from 'react-hot-toast';

const STATUSES = ['placed', 'paid', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
const STATUS_COLORS = {
  placed: 'bg-blue-500/20 text-blue-400',
  paid: 'bg-emerald-500/20 text-emerald-400',
  packed: 'bg-amber-500/20 text-amber-400',
  shipped: 'bg-purple-500/20 text-purple-400',
  out_for_delivery: 'bg-cyan-500/20 text-cyan-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  returned: 'bg-gray-500/20 text-gray-400',
};

function TrackingPanel({ order, onSave }) {
  const t = order.tracking || {};
  const [f, setF] = useState({
    courier: t.courier || '',
    trackingNumber: t.trackingNumber || '',
    trackingUrl: t.trackingUrl || '',
    expectedDeliveryDate: t.expectedDeliveryDate ? new Date(t.expectedDeliveryDate).toISOString().slice(0, 10) : '',
    notes: t.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, max) => (e) => {
    const v = max ? e.target.value.slice(0, max) : e.target.value;
    setF({ ...f, [k]: v });
  };

  const buildTrackingPayload = () => ({
    courier: f.courier.trim(),
    trackingNumber: f.trackingNumber.trim(),
    trackingUrl: f.trackingUrl.trim(),
    expectedDeliveryDate: f.expectedDeliveryDate ? new Date(f.expectedDeliveryDate) : null,
    notes: f.notes.trim(),
  });

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ tracking: buildTrackingPayload() });
      toast.success('Tracking saved');
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to save tracking');
    } finally { setSaving(false); }
  };

  const markShipped = async () => {
    if (!f.trackingNumber.trim()) {
      toast.error('Add a tracking number first');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        status: 'shipped',
        note: `Handed to ${f.courier || 'courier'}${f.trackingNumber ? ` (AWB ${f.trackingNumber})` : ''}`,
        tracking: buildTrackingPayload(),
      });
      toast.success('Marked as shipped');
    } catch (e) {
      toast.error(e?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-charcoal-900/40 p-4 rounded-xl mt-3 space-y-3">
      <p className="eyebrow">Shipment & tracking</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Courier</label>
          <input className="input" maxLength={40} placeholder="Delhivery / DTDC / Bluedart…" value={f.courier} onChange={set('courier', 40)} />
        </div>
        <div>
          <label className="label">Tracking number / AWB</label>
          <input className="input" maxLength={40} value={f.trackingNumber} onChange={set('trackingNumber', 40)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Tracking URL (optional)</label>
          <input className="input" maxLength={200} placeholder="https://www.courier.com/track/..." value={f.trackingUrl} onChange={set('trackingUrl', 200)} />
        </div>
        <div>
          <label className="label">Expected delivery</label>
          <input className="input" type="date" value={f.expectedDeliveryDate} onChange={set('expectedDeliveryDate')} />
        </div>
        <div>
          <label className="label">Notes (visible to customer)</label>
          <input className="input" maxLength={140} value={f.notes} onChange={set('notes', 140)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-end">
        <button onClick={save} disabled={saving} className="btn btn-outline h-9 px-4 text-xs">
          {saving ? 'Saving…' : 'Save tracking'}
        </button>
        <button onClick={markShipped} disabled={saving} className="btn btn-gold h-9 px-4 text-xs">
          {saving ? '…' : '🚚 Mark as shipped'}
        </button>
      </div>
    </div>
  );
}

function OrderRow({ o, onUpdate }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="hover:bg-white/[0.02]">
        <td className="p-3 font-mono text-xs">
          <button onClick={() => setOpen((x) => !x)} className="text-terra-400 hover:text-terra-300">
            {open ? '▾' : '▸'} #{o._id.slice(-8).toUpperCase()}
          </button>
        </td>
        <td className="p-3">
          <div className="font-semibold">{o.user?.name}</div>
          <div className="text-xs text-charcoal-500">{o.user?.email}</div>
        </td>
        <td className="p-3 text-xs text-charcoal-300">{o.items?.length || 0} items</td>
        <td className="p-3 text-terra-400 font-bold">₹{o.totalPrice?.toLocaleString()}</td>
        <td className="p-3">
          <select
            value={o.status}
            onChange={(e) => onUpdate(o._id, { status: e.target.value })}
            className={`text-xs px-2 py-1.5 rounded-full border-0 outline-none ${STATUS_COLORS[o.status] || 'bg-charcoal-800 text-charcoal-200'}`}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {o.tracking?.trackingNumber && (
            <div className="text-[10px] text-charcoal-500 mt-1 font-mono">AWB {o.tracking.trackingNumber}</div>
          )}
        </td>
        <td className="p-3 text-xs text-charcoal-400">{new Date(o.createdAt).toLocaleDateString()}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} className="bg-charcoal-950/50 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3 text-sm">
                <div>
                  <p className="eyebrow mb-1">Ship to</p>
                  <p className="text-charcoal-200">{o.shippingAddress?.name}</p>
                  <p className="text-charcoal-400 text-xs">
                    {o.shippingAddress?.line1}{o.shippingAddress?.line2 ? `, ${o.shippingAddress.line2}` : ''}<br />
                    {o.shippingAddress?.city}, {o.shippingAddress?.state} {o.shippingAddress?.postalCode}<br />
                    📞 {o.shippingAddress?.phone}
                  </p>
                </div>
                <div>
                  <p className="eyebrow mb-1">Items</p>
                  <ul className="text-xs text-charcoal-300 space-y-1">
                    {o.items.map((it, i) => (
                      <li key={i}>{it.quantity} × {it.name} {it.size ? `(${it.size})` : ''} — ₹{(it.price * it.quantity).toLocaleString()}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-[11px] text-charcoal-500">
                  Subtotal ₹{o.itemsPrice?.toLocaleString()} · Shipping ₹{o.shippingPrice || 0} · Tax ₹{o.taxPrice || 0}
                </div>
              </div>
              <TrackingPanel order={o} onSave={(body) => onUpdate(o._id, body)} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminOrders() {
  const [filter, setFilter] = useState('');
  const { data, isLoading } = useListOrdersQuery();
  const [update] = useUpdateOrderMutation();
  const orders = (data?.orders || []).filter((o) => !filter || o.status === filter);

  const onUpdate = async (id, body) => {
    try {
      await update({ id, body }).unwrap();
      if (body.status && !body.tracking) toast.success('Status updated');
      return true;
    } catch (e) {
      toast.error(e?.data?.message || 'Failed');
      throw e;
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">REVENUE</p>
          <h1 className="text-3xl sm:text-4xl font-display">Orders</h1>
          <p className="text-charcoal-400 text-xs mt-1">Click any order to expand and manage tracking / courier handoff.</p>
        </div>
        <select className="input w-full sm:w-auto sm:min-w-[200px]" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? <p>Loading...</p> : (
        <>
          {/* Desktop */}
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Order</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Items</th>
                  <th className="text-left p-3">Total</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {orders.map((o) => <OrderRow key={o._id} o={o} onUpdate={onUpdate} />)}
                {orders.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-charcoal-400">No orders.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {orders.map((o) => (
              <details key={o._id} className="card">
                <summary className="cursor-pointer p-4 list-none">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-charcoal-500">#{o._id.slice(-8).toUpperCase()}</span>
                    <span className="text-terra-400 font-bold">₹{o.totalPrice?.toLocaleString()}</span>
                  </div>
                  <div className="font-semibold text-sm">{o.user?.name}</div>
                  <div className="text-xs text-charcoal-500 truncate">{o.user?.email}</div>
                  <div className="text-xs text-charcoal-400 mt-1">{o.items?.length} items · {new Date(o.createdAt).toLocaleDateString()}</div>
                  <select value={o.status} onChange={(e) => onUpdate(o._id, { status: e.target.value })}
                    className={`mt-3 text-xs px-3 py-2 rounded-full w-full outline-none ${STATUS_COLORS[o.status] || 'bg-charcoal-800'}`}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </summary>
                <div className="p-4 pt-0">
                  <TrackingPanel order={o} onSave={(body) => onUpdate(o._id, body)} />
                </div>
              </details>
            ))}
            {orders.length === 0 && <div className="card p-8 text-center text-charcoal-400">No orders.</div>}
          </div>
        </>
      )}
    </div>
  );
}
