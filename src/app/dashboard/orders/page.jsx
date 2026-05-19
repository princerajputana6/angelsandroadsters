'use client';
import { useMyOrdersQuery } from '@/store/api';

export default function MyOrdersPage() {
  const { data, isLoading } = useMyOrdersQuery();
  const orders = data?.orders || [];

  if (isLoading) return <p className="text-charcoal-400">Loading...</p>;
  if (orders.length === 0) return <p className="text-charcoal-400">No orders yet.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-display">My Orders</h1>
      {orders.map((o) => (
        <div key={o._id} className="card p-5">
          <div className="flex flex-wrap justify-between items-start gap-2">
            <div>
              <p className="text-xs text-charcoal-400">Order #{o._id.slice(-8).toUpperCase()}</p>
              <p className="text-sm text-charcoal-300">{new Date(o.createdAt).toDateString()}</p>
            </div>
            <span className="badge bg-terra-500/15 text-terra-400 border border-terra-500/40 uppercase">{o.status}</span>
          </div>
          <div className="mt-3 divide-y divide-charcoal-800">
            {o.items.map((it, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <img src={it.image} alt={it.name} className="w-12 h-12 object-cover rounded" />
                <span className="flex-1 text-sm">{it.name}</span>
                <span className="text-sm text-charcoal-400">× {it.quantity}</span>
                <span className="text-sm font-semibold">₹{(it.price * it.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="text-right font-bold text-terra-400 mt-2">Total ₹{o.totalPrice?.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
