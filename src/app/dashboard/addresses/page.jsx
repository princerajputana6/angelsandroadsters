'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useMyAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} from '@/store/api';

const EMPTY = { label: '', line1: '', line2: '', city: '', state: '', postalCode: '', phone: '', isDefault: false };

function AddressForm({ initial = EMPTY, onSubmit, onCancel, submitLabel }) {
  const [f, setF] = useState({ ...EMPTY, ...initial });
  const set = (k, max) => (e) => {
    const v = max ? e.target.value.slice(0, max) : e.target.value;
    setF({ ...f, [k]: v });
  };
  const submit = (e) => {
    e.preventDefault();
    if (!f.line1 || !f.city || !f.state || !f.postalCode || !f.phone) return;
    onSubmit(f);
  };
  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="label">Label (e.g. Home, Office)</label>
        <input className="input" maxLength={40} value={f.label} onChange={set('label', 40)} placeholder="Home" />
      </div>
      <div>
        <label className="label">Phone <span className="text-red-400">*</span></label>
        <input className="input" required maxLength={15} value={f.phone} onChange={set('phone', 15)} placeholder="10-digit mobile" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Address line 1 <span className="text-red-400">*</span></label>
        <input className="input" required maxLength={120} value={f.line1} onChange={set('line1', 120)} />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Address line 2 (optional)</label>
        <input className="input" maxLength={120} value={f.line2} onChange={set('line2', 120)} />
      </div>
      <div>
        <label className="label">City <span className="text-red-400">*</span></label>
        <input className="input" required maxLength={60} value={f.city} onChange={set('city', 60)} />
      </div>
      <div>
        <label className="label">State <span className="text-red-400">*</span></label>
        <input className="input" required maxLength={60} value={f.state} onChange={set('state', 60)} />
      </div>
      <div>
        <label className="label">Postal code <span className="text-red-400">*</span></label>
        <input className="input" required maxLength={10} value={f.postalCode} onChange={set('postalCode', 10)} />
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={!!f.isDefault} onChange={(e) => setF({ ...f, isDefault: e.target.checked })} />
          Set as default
        </label>
      </div>
      <div className="sm:col-span-2 flex gap-2 justify-end">
        {onCancel && <button type="button" onClick={onCancel} className="btn btn-outline h-10 px-5">Cancel</button>}
        <button type="submit" className="btn btn-gold h-10 px-5">{submitLabel}</button>
      </div>
    </form>
  );
}

export default function MyAddressesPage() {
  const { data, isLoading } = useMyAddressesQuery();
  const [addAddress] = useAddAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);

  const addresses = data?.addresses || [];

  const handleAdd = async (body) => {
    try {
      await addAddress(body).unwrap();
      toast.success('Address added');
      setAdding(false);
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to add');
    }
  };
  const handleUpdate = async (id, body) => {
    try {
      await updateAddress({ id, body }).unwrap();
      toast.success('Saved');
      setEditingId(null);
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to save');
    }
  };
  const handleDelete = async (a) => {
    if (!confirm(`Delete ${a.label || 'address'}?`)) return;
    try {
      await deleteAddress(a._id).unwrap();
      toast.success('Deleted');
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to delete');
    }
  };
  const handleSetDefault = async (a) => {
    if (a.isDefault) return;
    await handleUpdate(a._id, { isDefault: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display">Addresses</h1>
          <p className="text-charcoal-400 text-sm mt-1">Save addresses for faster checkout. Your default is used automatically.</p>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn btn-gold h-10 px-5">+ Add address</button>
        )}
      </div>

      {adding && (
        <div className="card p-5">
          <h3 className="font-display text-xl mb-3">New address</h3>
          <AddressForm onSubmit={handleAdd} onCancel={() => setAdding(false)} submitLabel="Save address" />
        </div>
      )}

      {isLoading && <div className="card p-8 text-center text-charcoal-400">Loading...</div>}
      {!isLoading && addresses.length === 0 && !adding && (
        <div className="card p-8 text-center text-charcoal-400">
          No saved addresses yet. Add one above for quicker checkout.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {addresses.map((a) => {
          const isEditing = editingId === a._id;
          return (
            <div key={a._id} className="card p-4">
              {isEditing ? (
                <AddressForm
                  initial={a}
                  onSubmit={(body) => handleUpdate(a._id, body)}
                  onCancel={() => setEditingId(null)}
                  submitLabel="Save changes"
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{a.label || 'Address'}</span>
                        {a.isDefault && <span className="badge bg-gold-500/20 text-gold-400 text-[9px]">Default</span>}
                      </div>
                      <p className="text-sm text-charcoal-300 mt-1">
                        {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                        {a.city}, {a.state} {a.postalCode}<br />
                        <span className="text-charcoal-400">📞 {a.phone}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-charcoal-800">
                    <button onClick={() => setEditingId(a._id)} className="text-xs text-terra-400 hover:text-terra-300">Edit</button>
                    {!a.isDefault && (
                      <button onClick={() => handleSetDefault(a)} className="text-xs text-charcoal-400 hover:text-terra-300">Make default</button>
                    )}
                    <button onClick={() => handleDelete(a)} className="text-xs text-red-400 hover:text-red-300 ml-auto">Delete</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
