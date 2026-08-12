'use client';
import { useState } from 'react';
import { useListResortBookingsQuery, useUpdateResortBookingMutation } from '@/store/api';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  confirmed: 'bg-green-500/20 text-green-400 border border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
};
const PAY_STYLES = {
  paid: 'bg-green-500/20 text-green-400 border border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  failed: 'bg-red-500/20 text-red-400 border border-red-500/30',
  refunded: 'bg-charcoal-700 text-charcoal-300',
};

export default function AdminResortBookingsPage() {
  const [status, setStatus] = useState('');
  const { data, isLoading } = useListResortBookingsQuery(status ? { status } : {});
  const [updateBooking] = useUpdateResortBookingMutation();
  const bookings = data?.bookings || [];

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—');

  const setBookingStatus = async (id, newStatus) => {
    try {
      await updateBooking({ id, body: { status: newStatus } }).unwrap();
      toast.success(`Booking ${newStatus}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed');
    }
  };

  const revenue = bookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((s, b) => s + (b.totalAmount || 0), 0);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display">Resort bookings</h1>
          <p className="text-sm text-charcoal-400 mt-1">{bookings.length} booking(s) · {inr(revenue)} collected</p>
        </div>
        <select className="input max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-charcoal-400 text-sm">Loading…</div>
      ) : bookings.length === 0 ? (
        <div className="card p-8 text-center text-charcoal-400">No bookings yet.</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b._id} className="card p-4">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-terra-400">{b.bookingId}</span>
                    <span className={`badge text-xs ${STATUS_STYLES[b.status] || ''}`}>{b.status}</span>
                    <span className={`badge text-xs ${PAY_STYLES[b.paymentStatus] || ''}`}>{b.paymentStatus}</span>
                  </div>
                  <div className="text-sm mt-1">
                    <span className="font-semibold">{b.resortName}</span>
                    <span className="text-charcoal-400"> · {b.roomTypeName} · {b.rooms} room(s) · {b.guests} guest(s)</span>
                  </div>
                  <div className="text-xs text-charcoal-400 mt-1">
                    {b.guestName} · {b.guestEmail} · {b.guestPhone || 'no phone'}
                  </div>
                  <div className="text-xs text-charcoal-500 mt-1">
                    {fmt(b.checkIn)} → {fmt(b.checkOut)} · {b.nights} night(s) · {inr(b.totalAmount)}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {b.status !== 'confirmed' && (
                    <button onClick={() => setBookingStatus(b._id, 'confirmed')} className="btn btn-outline text-xs px-3 py-1.5">Mark confirmed</button>
                  )}
                  {b.status !== 'cancelled' && (
                    <button onClick={() => setBookingStatus(b._id, 'cancelled')} className="btn text-xs px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20">Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
