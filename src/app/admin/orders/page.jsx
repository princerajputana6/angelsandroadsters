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

export default function AdminOrders() {
  const [filter, setFilter] = useState('');
  const { data, isLoading } = useListOrdersQuery();
  const [update] = useUpdateOrderMutation();
  const orders = (data?.orders || []).filter((o) => !filter || o.status === filter);

  const setStatus = async (id, status) => {
    try { await update({ id, body: { status } }).unwrap(); toast.success('Status updated'); }
    catch (e) { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">REVENUE</p>
          <h1 className="text-3xl sm:text-4xl font-display">Orders</h1>
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
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-mono text-xs">#{o._id.slice(-8).toUpperCase()}</td>
                    <td className="p-3">
                      <div className="font-semibold">{o.user?.name}</div>
                      <div className="text-xs text-charcoal-500">{o.user?.email}</div>
                    </td>
                    <td className="p-3 text-xs text-charcoal-300">{o.items?.length || 0} items</td>
                    <td className="p-3 text-terra-400 font-bold">₹{o.totalPrice?.toLocaleString()}</td>
                    <td className="p-3">
                      <select value={o.status} onChange={(e) => setStatus(o._id, e.target.value)}
                        className={`text-xs px-2 py-1.5 rounded-full border-0 outline-none ${STATUS_COLORS[o.status] || 'bg-charcoal-800 text-charcoal-200'}`}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-xs text-charcoal-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-charcoal-400">No orders.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {orders.map((o) => (
              <div key={o._id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-charcoal-500">#{o._id.slice(-8).toUpperCase()}</span>
                  <span className="text-terra-400 font-bold">₹{o.totalPrice?.toLocaleString()}</span>
                </div>
                <div className="font-semibold text-sm">{o.user?.name}</div>
                <div className="text-xs text-charcoal-500 truncate">{o.user?.email}</div>
                <div className="text-xs text-charcoal-400 mt-1">{o.items?.length} items · {new Date(o.createdAt).toLocaleDateString()}</div>
                <select value={o.status} onChange={(e) => setStatus(o._id, e.target.value)}
                  className={`mt-3 text-xs px-3 py-2 rounded-full w-full outline-none ${STATUS_COLORS[o.status] || 'bg-charcoal-800'}`}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
            {orders.length === 0 && <div className="card p-8 text-center text-charcoal-400">No orders.</div>}
          </div>
        </>
      )}
    </div>
  );
}
