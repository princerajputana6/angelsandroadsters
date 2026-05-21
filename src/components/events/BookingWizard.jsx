'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateRegistrationMutation, useMeQuery, useGetEventSlotsQuery } from '@/store/api';
import { payWithRazorpay } from '@/lib/razorpayClient';
import toast from 'react-hot-toast';

const TYPES = [
  { id: 'individual', label: 'Individual', icon: '🧍', tag: 'Solo registration' },
  { id: 'group', label: 'Group', icon: '👥', tag: '2–20 members' },
  { id: 'visitor', label: 'Visitor', icon: '👁️', tag: 'Spectator pass' },
];

export default function BookingWizard({ event, onDone }) {
  const router = useRouter();
  const { data: meData } = useMeQuery();
  const { data: slotData, refetch: refetchSlots } = useGetEventSlotsQuery(event.slug, { pollingInterval: 30000 });
  const [register, { isLoading }] = useCreateRegistrationMutation();
  const [step, setStep] = useState(1);
  const [type, setType] = useState('individual');
  const [confirmation, setConfirmation] = useState(null);
  const [agreedWaiver, setAgreedWaiver] = useState(false);

  const slots = slotData?.slots || {};
  const slotsFor = (t) => slots[t] || { capacity: 0, booked: 0, remaining: 0 };
  const isSoldOut = (t) => {
    const s = slotsFor(t);
    return s.capacity > 0 && s.remaining <= 0;
  };
  const allSoldOut = ['individual', 'group', 'visitor'].every(isSoldOut);

  // If currently selected type is sold out, switch to first available type
  useEffect(() => {
    if (!slotData) return;
    if (isSoldOut(type)) {
      const fallback = ['individual', 'group', 'visitor'].find((t) => !isSoldOut(t));
      if (fallback) setType(fallback);
    }
  }, [slotData]); // eslint-disable-line react-hooks/exhaustive-deps
  const [form, setForm] = useState({
    name: '', email: '', phone: '', age: '', emergencyContact: '',
    bikeDetails: '', visitDate: '',
    groupName: '', members: Array.from({ length: 2 }, () => ({ name: '', email: '', phone: '', bikeDetails: '' })),
    groupSize: 2,
    visitorCount: 1,
    passDuration: 'all',  // 'all' = every event day, 'single' = one day
    visitDay: '',         // ISO date string when passDuration === 'single'
  });

  // Initialize members array when group type is selected
  useEffect(() => {
    if (type === 'group' && form.members.length === 0) {
      setForm(prev => ({
        ...prev,
        members: Array.from({ length: 2 }, () => ({ name: '', email: '', phone: '', bikeDetails: '' }))
      }));
    }
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  const isEarlyBird = useMemo(() => {
    if (!event.earlyBirdDeadline) return false;
    return new Date() < new Date(event.earlyBirdDeadline);
  }, [event.earlyBirdDeadline]);

  // All calendar days the event spans (capped at 14 for safety).
  const eventDays = useMemo(() => {
    const days = [];
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    if (isNaN(start) || isNaN(end)) return days;
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    const last = new Date(end);
    last.setHours(0, 0, 0, 0);
    while (cur <= last && days.length < 14) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }, [event.startDate, event.endDate]);

  const dayLabel = (d) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  const visitorPerDay = isEarlyBird
    ? (event.pricing?.visitorEarlyBird || event.pricing?.visitor || 0)
    : (event.pricing?.visitor || 0);

  const individualPrice = isEarlyBird
    ? (event.pricing?.individualEarlyBird || event.pricing?.individual || 0)
    : (event.pricing?.individual || 0);

  const groupPrice = isEarlyBird
    ? (event.pricing?.groupEarlyBird || event.pricing?.groupBase || 0)
    : (event.pricing?.groupBase || event.pricing?.individual || 0);

  const visitorNumDays = form.passDuration === 'single' ? 1 : Math.max(1, eventDays.length);

  const price = useMemo(() => {
    if (type === 'individual') return individualPrice;
    if (type === 'group') return groupPrice;
    if (type === 'visitor') {
      const count = Number(form.visitorCount || 1);
      return visitorPerDay * visitorNumDays * count;
    }
    return 0;
  }, [type, form.visitorCount, individualPrice, groupPrice, visitorPerDay, visitorNumDays]);

  const setMember = (i, key, val) => {
    const members = [...form.members];
    members[i] = { ...members[i], [key]: val };
    setForm({ ...form, members });
  };

  const setGroupSize = (n) => {
    const size = Math.max(2, Math.min(4, n));
    const members = Array.from({ length: size }, (_, i) => form.members?.[i] || { name: '', email: '', phone: '', bikeDetails: '' });
    setForm({ ...form, groupSize: size, members });
  };

  const stepValid = () => {
    if (step === 1) return !!type && !isSoldOut(type);
    if (step === 2) {
      if (type === 'individual') return form.name && form.email && form.phone;
      if (type === 'visitor') return form.name && form.email && form.phone && form.visitorCount >= 1
        && (form.passDuration !== 'single' || !!form.visitDay);
      if (type === 'group') return form.groupName && form.groupSize >= 2 && form.members.every(m => m.name && m.email);
    }
    return true;
  };

  const submit = async () => {
    if (isSoldOut(type)) {
      toast.error(`${type} slots are sold out. Pick a different pass.`);
      return;
    }
    if (!agreedWaiver) {
      toast.error('Please accept the liability waiver to continue.');
      return;
    }
    try {
      const visitDays = type === 'visitor'
        ? (form.passDuration === 'single'
            ? [form.visitDay].filter(Boolean)
            : eventDays.map((d) => d.toISOString()))
        : undefined;
      const payload = {
        eventId: event._id,
        registrationType: type,
        ...form,
        visitDays,
        age: form.age ? Number(form.age) : undefined,
      };
      const res = await register(payload).unwrap();
      const reg = res.registration;
      refetchSlots();

      // Free registration — confirm immediately
      if (!price || price <= 0) {
        toast.success(`Booked! Ticket: ${reg.ticketId}`);
        onDone?.(reg);
        setConfirmation(reg);
        return;
      }

      // Paid registration — open Razorpay
      await payWithRazorpay({
        amount: price,
        receipt: reg.ticketId,
        notes: { eventId: event._id, type, ticketId: reg.ticketId },
        name: 'Angels & Roadsters',
        description: `${event.title} · ${type}`,
        prefill: {
          name: form.name || form.members?.[0]?.name || '',
          email: form.email || form.members?.[0]?.email || '',
          contact: form.phone || form.members?.[0]?.phone || '',
        },
        kind: 'registration',
        referenceId: reg._id,
        onSuccess: () => {
          toast.success(`Payment confirmed! Ticket: ${reg.ticketId}`);
          onDone?.(reg);
          setConfirmation({ ...reg, paymentStatus: 'paid', status: 'confirmed' });
        },
        onFailure: (err) => {
          toast.error(err.message || 'Payment cancelled. Your booking is saved but pending payment.');
          onDone?.(reg);
          // Don't show confirmation on payment failure - user can retry from dashboard
          setStep(1);
          setAgreedWaiver(false);
          setForm({ name: '', email: '', phone: '', age: '', emergencyContact: '', bikeDetails: '', visitDate: '', groupName: '', members: [], groupSize: 2, visitorCount: 1, passDuration: 'all', visitDay: '' });
        },
      });
    } catch (err) {
      if (err?.data?.soldOut) {
        toast.error(err.data.message);
        refetchSlots();
        setStep(1);
      } else {
        toast.error(err?.data?.message || 'Booking failed');
      }
    }
  };

  if (confirmation) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card-glass p-6 sm:p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-terra-500 flex items-center justify-center text-2xl mb-3">✓</div>
        <h3 className="font-display text-3xl">You're in.</h3>
        <p className="text-sm text-charcoal-300 mt-1">Your QR ticket is ready.</p>

        {confirmation.qrCode && (
          <div className="bg-white p-3 inline-block rounded-xl mt-5">
            <img src={confirmation.qrCode} alt="QR Ticket" className="w-44 h-44" />
          </div>
        )}

        <div className="text-xs text-charcoal-400 mt-3">Ticket ID</div>
        <div className="font-mono text-terra-400 font-bold tracking-wider">{confirmation.ticketId}</div>

        <div className="card bg-charcoal-900/50 p-4 mt-5 text-left">
          <div className="text-xs text-charcoal-400 uppercase tracking-wider mb-3">Registration Details</div>
          <div className="space-y-2 text-sm">
            {confirmation.registrationType === 'individual' && (
              <>
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Name:</span>
                  <span className="font-semibold">{confirmation.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Email:</span>
                  <span className="font-semibold">{confirmation.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Phone:</span>
                  <span className="font-semibold">{confirmation.phone}</span>
                </div>
              </>
            )}
            {confirmation.registrationType === 'visitor' && (
              <>
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Name:</span>
                  <span className="font-semibold">{confirmation.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Email:</span>
                  <span className="font-semibold">{confirmation.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Phone:</span>
                  <span className="font-semibold">{confirmation.phone}</span>
                </div>
                {confirmation.visitDays?.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-charcoal-400">Pass:</span>
                    <span className="font-semibold text-right">
                      {confirmation.visitDays.map((d) => dayLabel(d)).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Tickets:</span>
                  <span className="font-semibold">{confirmation.visitorCount || 1}</span>
                </div>
              </>
            )}
            {confirmation.registrationType === 'group' && (
              <>
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Group Name:</span>
                  <span className="font-semibold">{confirmation.groupName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Total Members:</span>
                  <span className="font-semibold">{confirmation.groupSize || confirmation.members?.length || 0}</span>
                </div>
                {confirmation.members && confirmation.members.length > 0 && (
                  <div className="border-t border-charcoal-800 pt-2 mt-2">
                    <div className="text-xs text-charcoal-500 mb-2">All Members:</div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {confirmation.members.map((member, i) => (
                        <div key={i} className="bg-charcoal-950/50 p-2 rounded text-xs">
                          <div className="font-semibold text-terra-400">Member {i + 1}</div>
                          <div className="text-charcoal-300">{member.name}</div>
                          <div className="text-charcoal-400">{member.email}</div>
                          {member.phone && <div className="text-charcoal-400">{member.phone}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between border-t border-charcoal-800 pt-2 mt-2">
              <span className="text-charcoal-400">Type:</span>
              <span className="font-semibold capitalize">{confirmation.registrationType}</span>
            </div>
            {confirmation.amount > 0 && (
              <div className="flex justify-between">
                <span className="text-charcoal-400">Amount:</span>
                <span className="font-bold text-terra-400">₹{confirmation.amount}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          {meData?.user ? (
            <button onClick={() => router.push('/dashboard/registrations')} className="btn btn-gold flex-1">View My Tickets</button>
          ) : (
            <button onClick={() => router.push('/register')} className="btn btn-gold flex-1">Save to Account</button>
          )}
          <button
            onClick={() => { setConfirmation(null); setStep(1); setAgreedWaiver(false); setForm({ ...form, name: '', email: '', phone: '' }); }}
            className="btn btn-outline flex-1"
          >Book another</button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="card-glass p-5 sm:p-7">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
              step >= s ? 'bg-terra-500 text-white' : 'bg-charcoal-800 text-charcoal-400'
            }`}>{s}</div>
            <div className="hidden sm:block text-xs text-charcoal-300">
              {s === 1 ? 'Type' : s === 2 ? 'Details' : 'Confirm'}
            </div>
            {s < 3 && <div className={`flex-1 h-px ${step > s ? 'bg-terra-500' : 'bg-charcoal-800'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h3 className="font-display text-2xl mb-1">Pick a pass</h3>
            <p className="text-xs text-charcoal-400 mb-4">Choose how you'd like to register for this event.</p>

            {allSoldOut && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300">
                🚫 All passes for this event are sold out. Stay tuned for the next edition.
              </div>
            )}

            {isEarlyBird && !allSoldOut && (
              <div className="mb-4 p-3 rounded-xl bg-terra-500/10 border border-terra-500/30 text-sm text-terra-300">
                🐦 Early bird pricing is live! Book before{' '}
                {new Date(event.earlyBirdDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' '}to lock in the discounted rate.
              </div>
            )}

            <div className="space-y-3">
              {TYPES.map((t) => {
                const p = t.id === 'individual' ? individualPrice
                  : t.id === 'visitor' ? visitorPerDay
                  : groupPrice;
                const regularP = t.id === 'individual' ? event.pricing?.individual
                  : t.id === 'visitor' ? event.pricing?.visitor
                  : event.pricing?.groupBase;
                const showStrike = isEarlyBird && regularP > p;
                const active = type === t.id;
                const soldOut = isSoldOut(t.id);
                const s = slotsFor(t.id);
                const lowStock = !soldOut && s.capacity > 0 && s.remaining <= Math.max(5, Math.ceil(s.capacity * 0.1));

                return (
                  <button
                    key={t.id}
                    onClick={() => !soldOut && setType(t.id)}
                    disabled={soldOut}
                    className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border transition ${
                      soldOut ? 'border-charcoal-800 bg-charcoal-900/40 opacity-60 cursor-not-allowed' :
                      active ? 'border-terra-500 bg-terra-500/10' : 'border-charcoal-800 hover:border-charcoal-700'
                    }`}
                  >
                    <span className="text-3xl">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-xl">{t.label}</span>
                        {soldOut && <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">Sold out</span>}
                        {lowStock && <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/30">Only {s.remaining} left</span>}
                      </div>
                      <div className="text-xs text-charcoal-400">{t.tag}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-charcoal-500">{t.id === 'visitor' ? 'Per day' : 'From'}</div>
                      {showStrike && (
                        <div className="text-[11px] text-charcoal-500 line-through">₹{regularP?.toLocaleString()}</div>
                      )}
                      <div className="text-terra-400 font-bold text-sm">{p ? `₹${p.toLocaleString()}` : 'Free'}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h3 className="font-display text-2xl mb-1">Your details</h3>
            <p className="text-xs text-charcoal-400 mb-4 capitalize">{type} registration</p>

            {(type === 'individual' || type === 'visitor') && (
              <div className="space-y-3">
                <div>
                  <label className="label">Full name</label>
                  <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Email</label>
                    <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                {type === 'individual' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Age</label>
                        <input className="input" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">Emergency contact</label>
                        <input className="input" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
                      </div>
                    </div>
                    {(event.eventType === 'rally' || event.eventType === 'expedition') && (
                      <div>
                        <label className="label">Bike details</label>
                        <input className="input" placeholder="Make / Model / Year" value={form.bikeDetails} onChange={(e) => setForm({ ...form, bikeDetails: e.target.value })} />
                      </div>
                    )}
                  </>
                )}
                {type === 'visitor' && (
                  <>
                    {eventDays.length > 1 && (
                      <div>
                        <label className="label">Choose your pass</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, passDuration: 'all', visitDay: '' })}
                            className={`text-left p-3 rounded-xl border transition ${
                              form.passDuration === 'all'
                                ? 'border-terra-500 bg-terra-500/10'
                                : 'border-charcoal-800 hover:border-charcoal-700'
                            }`}
                          >
                            <div className="font-semibold text-sm">All {eventDays.length} Days</div>
                            <div className="text-xs text-terra-400 font-bold mt-0.5">
                              ₹{(visitorPerDay * eventDays.length).toLocaleString()}/ticket
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, passDuration: 'single' })}
                            className={`text-left p-3 rounded-xl border transition ${
                              form.passDuration === 'single'
                                ? 'border-terra-500 bg-terra-500/10'
                                : 'border-charcoal-800 hover:border-charcoal-700'
                            }`}
                          >
                            <div className="font-semibold text-sm">Single Day</div>
                            <div className="text-xs text-terra-400 font-bold mt-0.5">
                              ₹{visitorPerDay.toLocaleString()}/ticket
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {form.passDuration === 'single' && eventDays.length > 1 && (
                      <div>
                        <label className="label">Pick a day</label>
                        <div className="grid grid-cols-2 gap-2">
                          {eventDays.map((d) => {
                            const iso = d.toISOString();
                            const active = form.visitDay === iso;
                            return (
                              <button
                                key={iso}
                                type="button"
                                onClick={() => setForm({ ...form, visitDay: iso })}
                                className={`p-3 rounded-xl border text-sm font-semibold transition ${
                                  active
                                    ? 'border-terra-500 bg-terra-500/10 text-terra-400'
                                    : 'border-charcoal-800 hover:border-charcoal-700'
                                }`}
                              >
                                {dayLabel(d)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="label">Number of tickets (max 100)</label>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        max="100"
                        value={form.visitorCount}
                        onChange={(e) => setForm({ ...form, visitorCount: Math.max(1, Math.min(100, Number(e.target.value))) })}
                      />
                      <p className="text-xs text-charcoal-400 mt-1">
                        ₹{visitorPerDay.toLocaleString()} per day · {visitorNumDays} day{visitorNumDays > 1 ? 's' : ''} = ₹{(visitorPerDay * visitorNumDays).toLocaleString()} per ticket
                        {isEarlyBird && <span className="text-terra-400 font-semibold"> · Early bird</span>}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {type === 'group' && (
              <div className="space-y-3">
                <div>
                  <label className="label">Group name</label>
                  <input className="input" required value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} />
                </div>
                <div>
                  <label className="label">Group size (2-4 members)</label>
                  <div className="flex items-center gap-3">
                    <button type="button" className="btn btn-outline w-10 h-10 p-0" onClick={() => setGroupSize(form.groupSize - 1)}>−</button>
                    <span className="text-2xl font-display w-12 text-center">{form.groupSize}</span>
                    <button type="button" className="btn btn-outline w-10 h-10 p-0" onClick={() => setGroupSize(form.groupSize + 1)}>+</button>
                  </div>
                  <p className="text-xs text-charcoal-400 mt-1">Flat rate: ₹{(event.pricing?.groupBase || event.pricing?.individual || 0).toLocaleString()} for entire group</p>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  <div className="text-xs font-bold text-terra-400 uppercase tracking-wider">All Members</div>
                  {form.members.map((m, i) => (
                    <div key={i} className="card border-charcoal-800/70 p-3 space-y-2">
                      <div className="text-xs font-semibold text-charcoal-300">Member {i + 1}</div>
                      <input className="input py-2" placeholder="Full name" required value={m.name || ''} onChange={(e) => setMember(i, 'name', e.target.value)} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input className="input py-2" type="email" placeholder="Email" required value={m.email || ''} onChange={(e) => setMember(i, 'email', e.target.value)} />
                        <input className="input py-2" placeholder="Phone" value={m.phone || ''} onChange={(e) => setMember(i, 'phone', e.target.value)} />
                      </div>
                      <input className="input py-2" placeholder="Bike details (optional)" value={m.bikeDetails || ''} onChange={(e) => setMember(i, 'bikeDetails', e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h3 className="font-display text-2xl mb-1">Review &amp; confirm</h3>
            <p className="text-xs text-charcoal-400 mb-4">Double-check your booking before locking it in.</p>

            <div className="card p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-charcoal-400">Event</span><span className="text-right">{event.title}</span></div>
              <div className="flex justify-between"><span className="text-charcoal-400">Type</span><span className="capitalize">{type}</span></div>
              {type === 'individual' && (
                <>
                  <div className="flex justify-between"><span className="text-charcoal-400">Name</span><span>{form.name || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-charcoal-400">Email</span><span className="text-right break-all">{form.email || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-charcoal-400">Phone</span><span>{form.phone || '—'}</span></div>
                </>
              )}
              {type === 'visitor' && (
                <>
                  <div className="flex justify-between"><span className="text-charcoal-400">Name</span><span>{form.name || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-charcoal-400">Email</span><span className="text-right break-all">{form.email || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-charcoal-400">Phone</span><span>{form.phone || '—'}</span></div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-400">Pass</span>
                    <span className="text-right">
                      {form.passDuration === 'single'
                        ? (form.visitDay ? dayLabel(form.visitDay) : 'Single day')
                        : `All ${visitorNumDays} days`}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-charcoal-400">Tickets</span><span>{form.visitorCount}</span></div>
                </>
              )}
              {type === 'group' && (
                <>
                  <div className="flex justify-between"><span className="text-charcoal-400">Group</span><span>{form.groupName || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-charcoal-400">Members</span><span>{form.groupSize}</span></div>
                  <div className="text-xs text-charcoal-500 mt-2">
                    {form.members.map((m, i) => m.name).filter(Boolean).join(', ') || 'No members added'}
                  </div>
                </>
              )}
              <div className="border-t border-charcoal-800 my-2" />
              <div className="flex justify-between text-base font-bold">
                <span>Total payable</span>
                <span className="text-terra-400">{price > 0 ? `₹${price.toLocaleString()}` : 'Free'}</span>
              </div>
            </div>
            <label className="flex items-start gap-3 mt-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedWaiver}
                onChange={(e) => setAgreedWaiver(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-terra-500 shrink-0"
              />
              <span className="text-xs text-charcoal-300 leading-relaxed">
                I have read and accept the{' '}
                <a href="/liability-waiver" target="_blank" rel="noopener noreferrer" className="text-terra-400 underline">
                  Trailstorm 2026 Liability Waiver
                </a>{' '}
                and agree to the event terms. Tickets are non-transferable.
              </span>
            </label>
            <p className="text-[11px] text-charcoal-500 mt-3">
              Your QR ticket is generated instantly after confirmation.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-charcoal-800">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="btn btn-ghost text-sm disabled:opacity-30"
        >← Back</button>

        <div className="text-right mr-3 hidden sm:block">
          <div className="text-[10px] text-charcoal-500 uppercase tracking-wider">Total</div>
          <div className="text-terra-400 font-bold">{price > 0 ? `₹${price.toLocaleString()}` : 'Free'}</div>
        </div>

        {step < 3 ? (
          <button
            onClick={() => stepValid() && setStep((s) => s + 1)}
            disabled={!stepValid()}
            className="btn btn-gold disabled:opacity-40"
          >Continue →</button>
        ) : (
          <button onClick={submit} disabled={isLoading || !agreedWaiver} className="btn btn-gold disabled:opacity-40">
            {isLoading ? 'Booking...' : `Confirm — ${price > 0 ? `₹${price.toLocaleString()}` : 'Free'}`}
          </button>
        )}
      </div>

      <p className="text-center text-[11px] text-charcoal-500 mt-3">
        Tickets powered by{' '}
        <a
          href="https://trylinqr.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-terra-400 hover:underline"
        >
          Trylinqr.com
        </a>
      </p>
    </div>
  );
}
