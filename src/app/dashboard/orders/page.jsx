'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useMyOrdersQuery, useCancelOrderMutation } from '@/store/api';

const STATUS_FLOW = ['placed', 'paid', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
const STATUS_LABEL = {
  placed: 'Placed',
  paid: 'Paid',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};
const STATUS_BADGE = {
  placed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  packed: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  shipped: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  out_for_delivery: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  delivered: 'bg-green-500/15 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  returned: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

function ProgressBar({ status }) {
  if (status === 'cancelled' || status === 'returned') {
    return (
      <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
        Order {status}.
      </div>
    );
  }
  const idx = STATUS_FLOW.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {STATUS_FLOW.map((s, i) => {
        const reached = i <= idx;
        return (
          <div key={s} className="flex-1 flex items-center gap-1">
            <div className={`flex-1 h-1.5 rounded-full ${reached ? 'bg-terra-500' : 'bg-charcoal-800'}`} />
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ o, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const canCancel = ['placed', 'paid', 'packed'].includes(o.status);
  const t = o.tracking || {};
  const history = o.statusHistory || [];

  return (
    <div className="card p-5">
      <div className="flex flex-wrap justify-between items-start gap-2">
        <div>
          <p className="text-xs text-charcoal-400">Order #{o._id.slice(-8).toUpperCase()}</p>
          <p className="text-sm text-charcoal-300">{new Date(o.createdAt).toLocaleString()}</p>
        </div>
        <span className={`badge border uppercase ${STATUS_BADGE[o.status] || ''}`}>{STATUS_LABEL[o.status] || o.status}</span>
      </div>

      <div className="mt-4">
        <ProgressBar status={o.status} />
        <div className="flex justify-between text-[10px] text-charcoal-500 mt-1.5">
          {STATUS_FLOW.map((s) => (
            <span key={s} className="capitalize hidden sm:inline">{STATUS_LABEL[s].split(' ')[0]}</span>
          ))}
        </div>
      </div>

      {/* Tracking */}
      {(t.courier || t.trackingNumber || t.expectedDeliveryDate) && (
        <div className="mt-4 rounded-xl border border-terra-500/30 bg-terra-500/[0.06] p-3 text-sm">
          <p className="eyebrow mb-2">Shipment</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1.5 gap-x-3">
            {t.courier && <div><span className="text-charcoal-400 text-xs">Courier:</span> <span className="ml-1">{t.courier}</span></div>}
            {t.trackingNumber && <div><span className="text-charcoal-400 text-xs">AWB:</span> <span className="ml-1 font-mono">{t.trackingNumber}</span></div>}
            {t.expectedDeliveryDate && <div><span className="text-charcoal-400 text-xs">ETA:</span> <span className="ml-1">{new Date(t.expectedDeliveryDate).toLocaleDateString()}</span></div>}
          </div>
          {t.trackingUrl && (
            <a href={t.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-terra-400 hover:text-terra-300 underline">
              Track on {t.courier || 'courier site'} →
            </a>
          )}
          {t.notes && <p className="text-xs text-charcoal-400 mt-2">{t.notes}</p>}
        </div>
      )}

      <div className="mt-4 divide-y divide-charcoal-800">
        {o.items.map((it, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <img src={it.image} alt={it.name} className="w-12 h-12 object-cover rounded" />
            <span className="flex-1 text-sm">{it.name}</span>
            <span className="text-sm text-charcoal-400">× {it.quantity}</span>
            <span className="text-sm font-semibold">₹{(it.price * it.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
        <div><span className="text-charcoal-500">Subtotal</span><div>₹{o.itemsPrice?.toLocaleString()}</div></div>
        <div><span className="text-charcoal-500">Shipping</span><div>{o.shippingPrice ? `₹${o.shippingPrice}` : <span className="text-terra-400">FREE</span>}</div></div>
        <div><span className="text-charcoal-500">Tax</span><div>{o.taxPrice ? `₹${o.taxPrice}` : <span className="text-charcoal-500">Included</span>}</div></div>
        <div><span className="text-charcoal-500">Total</span><div className="text-terra-400 font-bold">₹{o.totalPrice?.toLocaleString()}</div></div>
      </div>

      <div className="mt-4 pt-3 border-t border-charcoal-800 flex flex-wrap items-center gap-3">
        <button onClick={() => setExpanded((x) => !x)} className="text-xs text-charcoal-400 hover:text-terra-400">
          {expanded ? 'Hide timeline' : 'Show timeline'}
        </button>
        {canCancel && (
          <button onClick={() => onCancel(o)} className="text-xs text-red-400 hover:text-red-300 ml-auto">
            Cancel order
          </button>
        )}
      </div>

      {expanded && (
        <ol className="mt-3 space-y-1.5 text-xs">
          {history.map((h, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-terra-400">●</span>
              <div>
                <span className="font-semibold uppercase tracking-wider">{STATUS_LABEL[h.status] || h.status}</span>
                <span className="text-charcoal-500 ml-2">{new Date(h.at).toLocaleString()}</span>
                {h.note && <p className="text-charcoal-400">{h.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  const { data, isLoading } = useMyOrdersQuery();
  const [cancelOrder] = useCancelOrderMutation();
  const orders = data?.orders || [];

  const handleCancel = async (o) => {
    const reason = prompt('Reason for cancellation? (optional)') || '';
    if (reason === null) return;
    try {
      await cancelOrder({ id: o._id, reason }).unwrap();
      toast.success('Order cancelled');
    } catch (e) {
      toast.error(e?.data?.message || 'Could not cancel');
    }
  };

  if (isLoading) return <p className="text-charcoal-400">Loading...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-display">My Orders</h1>
      {orders.length === 0 ? (
        <div className="card p-8 text-center text-charcoal-400">No orders yet.</div>
      ) : (
        orders.map((o) => <OrderCard key={o._id} o={o} onCancel={handleCancel} />)
      )}
    </div>
  );
}
