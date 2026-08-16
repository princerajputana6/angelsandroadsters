'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useListResortsQuery,
  useGetResortQuery,
  useCreateResortBookingMutation,
  useValidateRegistrationMutation,
  useMeQuery,
} from '@/store/api';
import { payWithRazorpay } from '@/lib/razorpayClient';
import { MAX_BOOKING_NIGHTS } from '@/lib/bookingConstants';
import toast from 'react-hot-toast';

const REG_TYPES = ['individual', 'group', 'visitor', 'staff', 'volunteer', 'organizer'];

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const nightsBetween = (a, b) => {
  if (!a || !b) return 1;
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24)));
};
const addDays = (d, n) => {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
};
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const blankGuest = (seed = {}) => ({
  registrationId: '', name: seed.name || '', email: seed.email || '', phone: seed.phone || '',
  status: 'idle', message: '', groupKey: null,
});

export default function ResortBookingWizard() {
  const { data: meData } = useMeQuery();
  const user = meData?.user;
  const { data: resortsData, isLoading: loadingResorts } = useListResortsQuery();
  const resorts = resortsData?.resorts || [];

  const [step, setStep] = useState(1);
  const [resortSlug, setResortSlug] = useState(null);
  const [roomTypeId, setRoomTypeId] = useState(null);
  const [registrationType, setRegistrationType] = useState('individual');
  const [guests, setGuests] = useState(1);
  const [nights, setNights] = useState(1);
  const [guestRegs, setGuestRegs] = useState([blankGuest()]);
  const [notes, setNotes] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [paying, setPaying] = useState(false);

  const [createBooking, { isLoading: creating }] = useCreateResortBookingMutation();
  const [validateRegistration] = useValidateRegistrationMutation();

  const { data: detailData, isFetching: loadingDetail } = useGetResortQuery(resortSlug, { skip: !resortSlug });
  const resort = detailData?.resort;
  const availability = detailData?.availability || {};

  const windowNights = resort ? nightsBetween(resort.checkIn, resort.checkOut) : 1;
  const maxNights = Math.min(MAX_BOOKING_NIGHTS, windowNights);
  const checkOutDate = resort ? addDays(resort.checkIn, nights) : null;

  const roomType = useMemo(
    () => resort?.roomTypes?.find((rt) => String(rt._id) === String(roomTypeId)) || null,
    [resort, roomTypeId]
  );
  const capacity = Math.max(1, roomType?.capacity || 1);
  const remaining = roomType ? (availability[String(roomType._id)] ?? roomType.totalRooms) : 0;
  const maxGuests = Math.max(1, remaining * capacity); // can't need more rooms than are left
  const roomsNeeded = roomType ? Math.ceil(guests / capacity) : 0;
  const price = roomType ? roomType.pricePerNight * nights * roomsNeeded : 0;

  // Resize the per-guest list when the guest count changes, preserving entries.
  const setGuestCount = (nRaw) => {
    const n = Math.min(Math.max(1, Number(nRaw) || 1), maxGuests);
    setGuests(n);
    setGuestRegs((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push(blankGuest());
      return next;
    });
  };

  const setGuestField = (i, patch) =>
    setGuestRegs((prev) => prev.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));

  const chooseResort = (r) => {
    setResortSlug(r.slug);
    setRoomTypeId(null);
    setRegistrationType('individual');
    setGuests(1);
    setNights(1);
    setGuestRegs([blankGuest()]);
    setStep(2);
  };

  const chooseRoom = (rt) => {
    setRoomTypeId(String(rt._id));
    setGuestCount(1);
  };

  const goToDetails = () => {
    if (!roomType) return toast.error('Please select a room type');
    if (remaining <= 0) return toast.error('This room is fully booked');
    // Seed the first guest's contact from the logged-in account; a registration
    // ID still overrides it once entered.
    setGuestRegs((prev) => prev.map((g, i) =>
      i === 0 && !g.registrationId
        ? { ...g, name: g.name || user?.name || '', email: g.email || user?.email || '', phone: g.phone || user?.phone || '' }
        : g
    ));
    setStep(3);
  };

  const validateGuest = async (i) => {
    const id = String(guestRegs[i]?.registrationId || '').trim();
    if (!id) return;
    setGuestField(i, { status: 'checking', message: '' });
    try {
      const res = await validateRegistration({ registrationId: id }).unwrap();
      if (res.type !== registrationType) {
        setGuestField(i, { status: 'error', message: `That ID is a ${res.type} registration, not ${registrationType}`, name: '', email: '', phone: '', groupKey: null });
        return;
      }
      setGuestField(i, {
        status: 'valid', message: '',
        name: res.person?.name || '', email: res.person?.email || '', phone: res.person?.phone || '',
        groupKey: res.groupKey,
      });
    } catch (err) {
      setGuestField(i, { status: 'error', message: err?.data?.message || 'Invalid registration ID', name: '', email: '', phone: '', groupKey: null });
    }
  };

  const allValid = guestRegs.length > 0 && guestRegs.every((g) => g.status === 'valid');
  const sameGroupOk = registrationType !== 'group' ||
    new Set(guestRegs.filter((g) => g.status === 'valid').map((g) => g.groupKey)).size <= 1;

  const submit = async () => {
    if (!allValid) return toast.error('Enter and verify a registration ID for every guest');
    if (!sameGroupOk) return toast.error('All group guests must belong to the same group');
    try {
      setPaying(true);
      const res = await createBooking({
        resortId: resort._id,
        roomTypeId: roomType._id,
        registrationType,
        nights,
        guestRegistrations: guestRegs.map((g) => ({ registrationId: g.registrationId.trim() })),
        notes,
      }).unwrap();

      const booking = res.booking;

      await payWithRazorpay({
        amount: booking.totalAmount, // server-computed, authoritative
        receipt: booking.bookingId,
        notes: { bookingId: booking.bookingId, resort: booking.resortName },
        name: 'Angels & Roadsters',
        description: `${booking.resortName} · ${booking.roomTypeName}`,
        prefill: { name: booking.guestName, email: booking.guestEmail, contact: booking.guestPhone },
        kind: 'resortBooking',
        referenceId: booking._id,
        onSuccess: () => {
          toast.success(`Room booked! ${booking.bookingId}`);
          setConfirmation({ ...booking, status: 'confirmed', paymentStatus: 'paid' });
        },
        onFailure: (err) => {
          toast.error(err.message || 'Payment cancelled. Booking saved as pending.');
        },
      });
    } catch (err) {
      if (err?.data?.soldOut) {
        toast.error(err.data.message);
        setStep(2);
      } else {
        toast.error(err?.data?.message || 'Booking failed');
      }
    } finally {
      setPaying(false);
    }
  };

  // ---------- Confirmation ----------
  if (confirmation) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card-glass p-6 sm:p-8 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 mx-auto rounded-full bg-terra-500 flex items-center justify-center text-2xl mb-3">✓</div>
        <h3 className="font-display text-3xl">Booking Confirmed!</h3>
        <p className="text-sm text-charcoal-300 mt-1">A confirmation email is on its way.</p>

        <div className="text-xs text-charcoal-400 mt-4">Booking ID</div>
        <div className="font-mono text-terra-400 font-bold tracking-wider text-lg">{confirmation.bookingId}</div>

        <div className="card bg-charcoal-900/50 p-4 mt-5 text-left space-y-2 text-sm">
          <Row label="Resort" value={confirmation.resortName} />
          <Row label="Room" value={confirmation.roomTypeName} />
          <Row label="Rooms" value={confirmation.rooms} />
          <Row label="Guests" value={confirmation.guests} />
          <Row label="Check-in" value={fmtDate(confirmation.checkIn)} />
          <Row label="Check-out" value={fmtDate(confirmation.checkOut)} />
          <div className="flex justify-between border-t border-charcoal-800 pt-2 mt-2">
            <span className="text-charcoal-400">Total paid</span>
            <span className="font-bold text-terra-400">{inr(confirmation.totalAmount)}</span>
          </div>
        </div>

        <a href="/dashboard" className="btn btn-outline mt-6 inline-block">Go to dashboard</a>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Stepper step={step} />

      <AnimatePresence mode="wait">
        {/* Step 1 — choose resort */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {loadingResorts ? (
              <div className="text-charcoal-400 text-sm">Loading resorts…</div>
            ) : resorts.length === 0 ? (
              <div className="card p-8 text-center text-charcoal-400">No resorts available yet. Check back soon.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {resorts.map((r) => (
                  <button key={r._id} onClick={() => chooseResort(r)} className="card p-0 overflow-hidden text-left hover:border-terra-500/60 transition group">
                    {r.coverImage ? (
                      <img src={r.coverImage} alt={r.name} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-charcoal-800 flex items-center justify-center text-4xl">🏨</div>
                    )}
                    <div className="p-4">
                      <div className="font-semibold group-hover:text-terra-400">{r.name}</div>
                      <div className="text-xs text-charcoal-500 mt-2">
                        {r.location?.city && <>{r.location.city} · </>}
                        {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2 — choose room + party */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {loadingDetail || !resort ? (
              <div className="text-charcoal-400 text-sm">Loading rooms…</div>
            ) : (
              <>
                <div className="mb-4">
                  <h3 className="font-display text-2xl">{resort.name}</h3>
                  <p className="text-xs text-charcoal-400">
                    Check-in {fmtDate(resort.checkIn)} · stay up to {maxNights} night(s)
                  </p>
                </div>

                <div className="space-y-3">
                  {resort.roomTypes.map((rt) => {
                    const left = availability[String(rt._id)] ?? rt.totalRooms;
                    const selected = String(rt._id) === String(roomTypeId);
                    const soldOut = left <= 0;
                    return (
                      <div
                        key={rt._id}
                        className={`card p-4 ${selected ? 'border-terra-500' : ''} ${soldOut ? 'opacity-60' : 'cursor-pointer hover:border-terra-500/50'}`}
                        onClick={() => !soldOut && chooseRoom(rt)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{rt.name}</span>
                              {soldOut ? (
                                <span className="badge text-xs bg-red-500/20 text-red-400 border border-red-500/30">Sold out</span>
                              ) : (
                                <span className="badge text-xs bg-green-500/20 text-green-400 border border-green-500/30">{left} room(s) left</span>
                              )}
                            </div>
                            {rt.description && <div className="text-xs text-charcoal-400 mt-0.5">{rt.description}</div>}
                            <div className="text-xs text-charcoal-500 mt-1">
                              Up to {rt.capacity} share a room{rt.bedType && <> · {rt.bedType}</>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-terra-400">{inr(rt.pricePerNight)}</div>
                            <div className="text-[10px] text-charcoal-500">/ room / night</div>
                          </div>
                        </div>

                        {selected && !soldOut && (
                          <div className="mt-4 pt-4 border-t border-charcoal-800 space-y-3" onClick={(e) => e.stopPropagation()}>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="label">Type of registration</label>
                                <select className="input capitalize" value={registrationType} onChange={(e) => {
                                  setRegistrationType(e.target.value);
                                  // Force re-verification against the new type.
                                  setGuestRegs((prev) => prev.map((g) => ({ ...g, status: 'idle', message: '', groupKey: null })));
                                }}>
                                  {REG_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="label">Nights</label>
                                <select className="input" value={nights} onChange={(e) => setNights(Number(e.target.value))}>
                                  {Array.from({ length: maxNights }, (_, i) => i + 1).map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="label">No. of guests</label>
                                <input type="number" min="1" max={maxGuests} className="input" value={guests}
                                  onChange={(e) => setGuestCount(e.target.value)} />
                              </div>
                            </div>
                            <p className="text-xs text-charcoal-500">
                              {roomsNeeded} room(s) · {fmtDate(resort.checkIn)} → {fmtDate(checkOutDate)} · {nights} night(s)
                              {' '}· up to {rt.capacity} per room
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-6">
                  <button onClick={() => setStep(1)} className="btn btn-outline">← Back</button>
                  <div className="flex items-center gap-4">
                    {roomType && <span className="font-bold text-lg">{inr(price)}</span>}
                    <button onClick={goToDetails} disabled={!roomType || remaining <= 0} className="btn btn-gold disabled:opacity-50">Continue</button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Step 3 — per-guest registration IDs + pay */}
        {step === 3 && roomType && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="card p-5 mb-4">
              <h3 className="font-display text-xl mb-1">Guest registrations</h3>
              <p className="text-xs text-charcoal-400 mb-4">
                Enter each guest's registration ID (TR-…). Details are fetched automatically.
                {registrationType === 'group' && ' All guests must belong to the same group.'}
              </p>

              <div className="space-y-3">
                {guestRegs.map((g, i) => (
                  <div key={i} className="border border-charcoal-700 rounded-xl p-3">
                    <label className="label">Guest {i + 1} — Registration ID *</label>
                    <div className="flex gap-2">
                      <input
                        className="input flex-1 font-mono uppercase"
                        placeholder="TR-XXXXXXXXXXXX"
                        value={g.registrationId}
                        onChange={(e) => setGuestField(i, { registrationId: e.target.value.toUpperCase(), status: 'idle', message: '' })}
                        onBlur={() => validateGuest(i)}
                      />
                      <button type="button" onClick={() => validateGuest(i)} className="btn btn-outline text-xs px-3">Verify</button>
                    </div>
                    {g.status === 'checking' && <p className="text-xs text-charcoal-400 mt-1">Checking…</p>}
                    {g.status === 'valid' && (
                      <p className="text-xs text-green-400 mt-1">✓ {g.name || 'Verified'}{g.email && <span className="text-charcoal-400"> · {g.email}</span>}{g.phone && <span className="text-charcoal-400"> · {g.phone}</span>}</p>
                    )}
                    {g.status === 'error' && <p className="text-xs text-red-400 mt-1">{g.message}</p>}
                  </div>
                ))}
              </div>

              <div className="mt-4"><label className="label">Notes (optional)</label><textarea className="input" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special requests" /></div>
            </div>

            <div className="card bg-charcoal-900/50 p-5 mb-4 space-y-2 text-sm">
              <h4 className="font-display text-lg mb-2">Summary</h4>
              <Row label="Resort" value={resort.name} />
              <Row label="Room" value={roomType.name} />
              <Row label="Registration" value={registrationType} />
              <Row label="Dates" value={`${fmtDate(resort.checkIn)} → ${fmtDate(checkOutDate)}`} />
              <Row label="Rooms × nights" value={`${roomsNeeded} × ${nights}`} />
              <Row label="Guests" value={guests} />
              <Row label="Rate" value={`${inr(roomType.pricePerNight)} / room / night`} />
              <div className="flex justify-between border-t border-charcoal-800 pt-2 mt-2">
                <span className="text-charcoal-400">Total</span>
                <span className="font-bold text-terra-400 text-lg">{inr(price)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setStep(2)} className="btn btn-outline" disabled={paying || creating}>← Back</button>
              <button onClick={submit} disabled={paying || creating || !allValid} className="btn btn-gold disabled:opacity-50">
                {paying || creating ? 'Processing…' : `Pay ${inr(price)}`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-charcoal-400">{label}</span>
      <span className="font-semibold capitalize">{value}</span>
    </div>
  );
}

function Stepper({ step }) {
  const steps = ['Resort', 'Room', 'Pay'];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${active ? 'bg-terra-500 text-charcoal-950' : done ? 'bg-terra-500/30 text-terra-400' : 'bg-charcoal-800 text-charcoal-500'}`}>
              {done ? '✓' : n}
            </div>
            <span className={`text-xs ${active ? 'text-terra-400' : 'text-charcoal-500'}`}>{label}</span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-charcoal-800" />}
          </div>
        );
      })}
    </div>
  );
}
