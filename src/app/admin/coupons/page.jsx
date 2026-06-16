'use client';
import { useState } from 'react';
import {
  useListCouponsQuery,
  useCreateCouponMutation,
  useToggleCouponMutation,
  useDeleteCouponMutation,
} from '@/store/api';
import toast from 'react-hot-toast';

const EMPTY = {
  code: '', discountType: 'percent', discountValue: '', maxUses: '', expiresAt: '', applicableTo: [],
};

export default function CouponsPage() {
  const { data, isLoading } = useListCouponsQuery();
  const [createCoupon, { isLoading: creating }] = useCreateCouponMutation();
  const [toggleCoupon] = useToggleCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);

  const coupons = data?.coupons || [];

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleApplicable = (type) => {
    setForm((f) => ({
      ...f,
      applicableTo: f.applicableTo.includes(type)
        ? f.applicableTo.filter((t) => t !== type)
        : [...f.applicableTo, type],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createCoupon({
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxUses: form.maxUses ? Number(form.maxUses) : 0,
        expiresAt: form.expiresAt || undefined,
        applicableTo: form.applicableTo,
      }).unwrap();
      toast.success('Coupon created');
      setForm(EMPTY);
      setShowForm(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create coupon');
    }
  };

  const handleToggle = async (id, current) => {
    try {
      await toggleCoupon({ id, isActive: !current }).unwrap();
      toast.success(current ? 'Coupon deactivated' : 'Coupon activated');
    } catch {
      toast.error('Failed to update coupon');
    }
  };

  const handleDelete = async (id, code) => {
    if (!confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    try {
      await deleteCoupon(id).unwrap();
      toast.success('Coupon deleted');
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display">Coupons</h1>
          <p className="text-sm text-charcoal-400 mt-1">Create discount codes for event registrations</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn btn-gold">
          {showForm ? '✕ Cancel' : '+ New coupon'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card p-6 mb-6 space-y-4">
          <h3 className="font-display text-xl">New Coupon</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Coupon Code *</label>
              <input
                className="input uppercase"
                required
                placeholder="e.g. RIDE20"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              />
            </div>
            <div>
              <label className="label">Discount Type *</label>
              <select className="input" value={form.discountType} onChange={set('discountType')}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="label">
                Discount Value * {form.discountType === 'percent' ? '(%)' : '(₹)'}
              </label>
              <input
                className="input"
                type="number"
                required
                min="1"
                max={form.discountType === 'percent' ? 100 : undefined}
                value={form.discountValue}
                onChange={set('discountValue')}
              />
            </div>
            <div>
              <label className="label">Max Uses (0 = unlimited)</label>
              <input className="input" type="number" min="0" value={form.maxUses} onChange={set('maxUses')} placeholder="0" />
            </div>
            <div>
              <label className="label">Expires At (optional)</label>
              <input className="input" type="datetime-local" value={form.expiresAt} onChange={set('expiresAt')} />
            </div>
          </div>

          <div>
            <label className="label">Applicable to (leave all unchecked = all types)</label>
            <div className="flex gap-3 mt-1">
              {['individual', 'group', 'visitor'].map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-terra-500"
                    checked={form.applicableTo.includes(t)}
                    onChange={() => toggleApplicable(t)}
                  />
                  <span className="text-sm capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={creating} className="btn btn-gold">
            {creating ? 'Creating...' : 'Create Coupon'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-charcoal-400 text-sm">Loading...</div>
      ) : coupons.length === 0 ? (
        <div className="card p-8 text-center text-charcoal-400">
          No coupons yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <div key={c._id} className={`card p-4 flex items-center gap-4 ${!c.isActive ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-terra-400 text-lg tracking-widest">{c.code}</span>
                  <span className={`badge text-xs ${c.isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-charcoal-300 mt-1">
                  <span className="font-semibold text-white">
                    {c.discountType === 'percent' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                  </span>
                  {c.applicableTo?.length > 0 && (
                    <span className="text-charcoal-400"> · {c.applicableTo.join(', ')}</span>
                  )}
                  {c.maxUses > 0 && (
                    <span className="text-charcoal-400"> · {c.usedCount}/{c.maxUses} uses</span>
                  )}
                  {c.maxUses === 0 && (
                    <span className="text-charcoal-400"> · {c.usedCount} uses · unlimited</span>
                  )}
                  {c.expiresAt && (
                    <span className="text-charcoal-400">
                      {' '}· expires {new Date(c.expiresAt).toLocaleDateString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(c._id, c.isActive)}
                  className="btn btn-outline text-xs px-3 py-1.5"
                >
                  {c.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(c._id, c.code)}
                  className="btn text-xs px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
