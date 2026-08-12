'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import { useCreateResortMutation, useUpdateResortMutation } from '@/store/api';
import toast from 'react-hot-toast';

// Date <-> yyyy-mm-dd for <input type="date">
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const emptyRoom = () => ({
  name: '', description: '', pricePerNight: '', capacity: 2, totalRooms: '',
  bedType: '', amenitiesText: '', image: '',
});

function roomFromDoc(rt) {
  return {
    _id: rt._id,
    name: rt.name || '',
    description: rt.description || '',
    pricePerNight: rt.pricePerNight ?? '',
    capacity: rt.capacity ?? 2,
    totalRooms: rt.totalRooms ?? '',
    bedType: rt.bedType || '',
    amenitiesText: (rt.amenities || []).join(', '),
    image: rt.images?.[0] || '',
  };
}

export default function ResortForm({ resort }) {
  const router = useRouter();
  const isEdit = !!resort;
  const [createResort, { isLoading: creating }] = useCreateResortMutation();
  const [updateResort, { isLoading: updating }] = useUpdateResortMutation();
  const saving = creating || updating;

  const [form, setForm] = useState({
    name: resort?.name || '',
    tagline: resort?.tagline || '',
    description: resort?.description || '',
    coverImage: resort?.coverImage || '',
    address: resort?.location?.address || '',
    city: resort?.location?.city || '',
    state: resort?.location?.state || '',
    mapLink: resort?.location?.mapLink || '',
    amenitiesText: (resort?.amenities || []).join(', '),
    checkIn: toDateInput(resort?.checkIn),
    checkOut: toDateInput(resort?.checkOut),
    checkInTime: resort?.checkInTime || '14:00',
    checkOutTime: resort?.checkOutTime || '11:00',
    policies: resort?.policies || '',
    isPublished: resort?.isPublished !== false,
    sortOrder: resort?.sortOrder ?? 0,
  });

  const [rooms, setRooms] = useState(
    resort?.roomTypes?.length ? resort.roomTypes.map(roomFromDoc) : [emptyRoom()]
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const setRoom = (i, k, v) => setRooms((rs) => rs.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const addRoom = () => setRooms((rs) => [...rs, emptyRoom()]);
  const removeRoom = (i) => setRooms((rs) => rs.filter((_, idx) => idx !== i));

  const toArr = (text) => text.split(',').map((s) => s.trim()).filter(Boolean);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Resort name is required');
    if (!form.checkIn || !form.checkOut) return toast.error('Check-in and check-out dates are required');
    if (new Date(form.checkOut) <= new Date(form.checkIn)) return toast.error('Check-out must be after check-in');
    const cleanRooms = rooms.filter((r) => r.name.trim());
    if (cleanRooms.length === 0) return toast.error('Add at least one room type');

    const body = {
      name: form.name.trim(),
      tagline: form.tagline,
      description: form.description,
      coverImage: form.coverImage,
      location: { address: form.address, city: form.city, state: form.state, mapLink: form.mapLink },
      amenities: toArr(form.amenitiesText),
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
      policies: form.policies,
      isPublished: form.isPublished,
      sortOrder: Number(form.sortOrder) || 0,
      roomTypes: cleanRooms.map((r) => ({
        ...(r._id ? { _id: r._id } : {}),
        name: r.name.trim(),
        description: r.description,
        pricePerNight: Number(r.pricePerNight) || 0,
        capacity: Number(r.capacity) || 1,
        totalRooms: Number(r.totalRooms) || 0,
        bedType: r.bedType,
        amenities: toArr(r.amenitiesText),
        images: r.image ? [r.image] : [],
      })),
    };

    try {
      if (isEdit) {
        await updateResort({ slug: resort.slug, body }).unwrap();
        toast.success('Resort updated');
      } else {
        await createResort(body).unwrap();
        toast.success('Resort created');
      }
      router.push('/admin/resorts');
    } catch (err) {
      toast.error(err?.data?.message || 'Save failed');
    }
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      {/* Basic details */}
      <div className="card p-6 space-y-4">
        <h3 className="font-display text-xl">Resort details</h3>
        <div>
          <label className="label">Resort name *</label>
          <input className="input" value={form.name} onChange={set('name')} required placeholder="e.g. Desert Dunes Camp" />
        </div>
        <div>
          <label className="label">Tagline</label>
          <input className="input" value={form.tagline} onChange={set('tagline')} placeholder="Luxury tents under the stars" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows="4" value={form.description} onChange={set('description')} />
        </div>
        <FileUpload label="Cover image" accept="image/*" value={form.coverImage} onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))} />
        <div>
          <label className="label">Amenities (comma separated)</label>
          <input className="input" value={form.amenitiesText} onChange={set('amenitiesText')} placeholder="Wi-Fi, Parking, Restaurant, Bonfire" />
        </div>
      </div>

      {/* Location */}
      <div className="card p-6 space-y-4">
        <h3 className="font-display text-xl">Location</h3>
        <div>
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={set('address')} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">City</label><input className="input" value={form.city} onChange={set('city')} /></div>
          <div><label className="label">State</label><input className="input" value={form.state} onChange={set('state')} /></div>
        </div>
        <div>
          <label className="label">Map link</label>
          <input className="input" value={form.mapLink} onChange={set('mapLink')} placeholder="https://maps.google.com/…" />
        </div>
      </div>

      {/* Stay window */}
      <div className="card p-6 space-y-4">
        <h3 className="font-display text-xl">Stay window (Trailstorm dates)</h3>
        <p className="text-xs text-charcoal-400">Every booking for this resort uses these fixed dates.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Check-in date *</label><input type="date" className="input" value={form.checkIn} onChange={set('checkIn')} required /></div>
          <div><label className="label">Check-out date *</label><input type="date" className="input" value={form.checkOut} onChange={set('checkOut')} required /></div>
          <div><label className="label">Check-in time</label><input type="time" className="input" value={form.checkInTime} onChange={set('checkInTime')} /></div>
          <div><label className="label">Check-out time</label><input type="time" className="input" value={form.checkOutTime} onChange={set('checkOutTime')} /></div>
        </div>
      </div>

      {/* Room types */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl">Room types</h3>
          <button type="button" onClick={addRoom} className="btn btn-outline text-xs px-3 py-1.5">+ Add room type</button>
        </div>

        {rooms.map((r, i) => (
          <div key={i} className="border border-charcoal-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-charcoal-500">Room type {i + 1}</span>
              {rooms.length > 1 && (
                <button type="button" onClick={() => removeRoom(i)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label">Name *</label><input className="input" value={r.name} onChange={(e) => setRoom(i, 'name', e.target.value)} placeholder="Deluxe Tent" /></div>
              <div><label className="label">Bed type</label><input className="input" value={r.bedType} onChange={(e) => setRoom(i, 'bedType', e.target.value)} placeholder="1 King" /></div>
              <div><label className="label">Price / night (₹) *</label><input type="number" min="0" className="input" value={r.pricePerNight} onChange={(e) => setRoom(i, 'pricePerNight', e.target.value)} /></div>
              <div><label className="label">Total rooms *</label><input type="number" min="0" className="input" value={r.totalRooms} onChange={(e) => setRoom(i, 'totalRooms', e.target.value)} /></div>
              <div><label className="label">Guests / room</label><input type="number" min="1" className="input" value={r.capacity} onChange={(e) => setRoom(i, 'capacity', e.target.value)} /></div>
            </div>
            <div><label className="label">Description</label><input className="input" value={r.description} onChange={(e) => setRoom(i, 'description', e.target.value)} /></div>
            <div><label className="label">Amenities (comma separated)</label><input className="input" value={r.amenitiesText} onChange={(e) => setRoom(i, 'amenitiesText', e.target.value)} placeholder="AC, Attached bath, Breakfast" /></div>
            <FileUpload label="Room image" accept="image/*" value={r.image} onChange={(url) => setRoom(i, 'image', url)} />
          </div>
        ))}
      </div>

      {/* Publish */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <input id="pub" type="checkbox" className="accent-terra-500 w-4 h-4" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
          <label htmlFor="pub" className="text-sm">Published (visible on the booking screen)</label>
        </div>
        <div className="max-w-[160px]">
          <label className="label">Sort order</label>
          <input type="number" className="input" value={form.sortOrder} onChange={set('sortOrder')} />
        </div>
        <div>
          <label className="label">Policies</label>
          <textarea className="input" rows="3" value={form.policies} onChange={set('policies')} placeholder="Cancellation, check-in rules, etc." />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn btn-gold">
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create resort'}
        </button>
        <button type="button" onClick={() => router.push('/admin/resorts')} className="btn btn-outline">Cancel</button>
      </div>
    </form>
  );
}
