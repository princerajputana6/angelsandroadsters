'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BIKE_CATEGORIES,
  SHIPPING_CITIES,
  calcShipping,
  formatINR,
} from '@/lib/bikeShipping';

const cityNames = SHIPPING_CITIES.map((c) => c.name).sort();

export default function BikeShippingPage() {
  const [form, setForm] = useState({
    fromCity: 'Delhi',
    toCity: 'Jaisalmer',
    category: 'cruiser',
    weight: '',
    declaredValue: '',
    pickupDate: '',
    express: false,
    insurance: true,
  });

  const set = (key) => (e) => {
    const value = e?.target?.type === 'checkbox' ? e.target.checked : e?.target?.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'category') {
        const cat = BIKE_CATEGORIES.find((b) => b.value === value);
        if (cat) next.weight = cat.weight;
      }
      return next;
    });
  };

  const quote = useMemo(
    () => calcShipping({
      fromCity: form.fromCity,
      toCity: form.toCity,
      weight: Number(form.weight) || 0,
      declaredValue: Number(form.declaredValue) || 0,
      express: form.express,
      insurance: form.insurance,
    }),
    [form]
  );

  const catLabel = BIKE_CATEGORIES.find((b) => b.value === form.category)?.label;
  const summary = quote
    ? `From ${form.fromCity} → ${form.toCity} · ${catLabel} (${form.weight || '?'} kg)`
    : '';
  const helpHref = `/help?subject=${encodeURIComponent('Bike shipping quote · ' + summary)}`;

  return (
    <div className="bg-charcoal-950 min-h-screen">
      <div className="container-x pt-28 sm:pt-32 pb-16">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="eyebrow mb-3">🚚 LOGISTICS FOR RIDERS</p>
          <h1 className="section-title">
            BIKE SHIPPING <br className="hidden sm:block" />
            <span className="gradient-text">COST CALCULATOR</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-charcoal-300 leading-relaxed">
            Shipping your bike to the start of a Trailstorm convoy, a Himalayan ride, or back
            home? Pick two cities, your bike, and get an instant indicative quote — finalised
            once our logistics team confirms carrier availability.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* FORM */}
          <div className="card p-5 sm:p-7 space-y-5">
            <div>
              <h2 className="font-display text-xl flex items-center gap-2">📋 Shipment details</h2>
              <p className="text-sm text-charcoal-400 mt-1">Update any field — the quote on the right recalculates live.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">📍 Pickup city</label>
                <select className="input" value={form.fromCity} onChange={set('fromCity')}>
                  {cityNames.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">📍 Drop-off city</label>
                <select className="input" value={form.toCity} onChange={set('toCity')}>
                  {cityNames.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">🏍 Bike category</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {BIKE_CATEGORIES.map((c) => {
                  const active = form.category === c.value;
                  return (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => set('category')({ target: { value: c.value } })}
                      className={`text-left rounded-xl border p-3 transition ${
                        active
                          ? 'border-terra-500 bg-terra-500/10'
                          : 'border-charcoal-800 hover:border-charcoal-700'
                      }`}
                    >
                      <p className="font-semibold text-sm">{c.label}</p>
                      <p className="text-xs text-charcoal-400 mt-1">{c.description}</p>
                      <p className="mt-1.5 text-[10px] uppercase tracking-wider text-terra-400">~ {c.weight} kg</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Bike weight (kg)</label>
                <input
                  type="number" min="50" max="500"
                  className="input"
                  placeholder="e.g. 200"
                  value={form.weight}
                  onChange={set('weight')}
                />
              </div>
              <div>
                <label className="label">Pickup date</label>
                <input
                  type="date"
                  className="input"
                  value={form.pickupDate}
                  onChange={set('pickupDate')}
                />
              </div>
            </div>

            <div>
              <label className="label">
                Declared value <span className="text-charcoal-500 normal-case font-normal">(used for insurance)</span>
              </label>
              <input
                type="number" min="0" step="10000"
                className="input"
                placeholder="e.g. 250000"
                value={form.declaredValue}
                onChange={set('declaredValue')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 rounded-xl border border-charcoal-800 bg-charcoal-900/40 p-4 cursor-pointer hover:border-charcoal-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={form.express}
                  onChange={set('express')}
                />
                <div>
                  <p className="text-sm font-semibold">⚡ Express delivery</p>
                  <p className="text-xs text-charcoal-400 mt-1">Priority handling, faster ETA. +35% surcharge.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-charcoal-800 bg-charcoal-900/40 p-4 cursor-pointer hover:border-charcoal-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={form.insurance}
                  onChange={set('insurance')}
                />
                <div>
                  <p className="text-sm font-semibold">🛡 Transit insurance</p>
                  <p className="text-xs text-charcoal-400 mt-1">1.5% of declared value (min ₹199). Full damage cover in transit.</p>
                </div>
              </label>
            </div>
          </div>

          {/* QUOTE */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <QuoteCard quote={quote} form={form} helpHref={helpHref} />
          </aside>
        </div>

        {/* How it works */}
        <section className="mt-20">
          <p className="eyebrow text-center">HOW IT WORKS</p>
          <h2 className="mt-2 text-center font-display text-2xl sm:text-3xl">From pickup to drop-off in 4 steps</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🧮', title: 'Get an instant quote', body: 'Use this calculator to estimate cost — pricing locks once we confirm carrier.' },
              { icon: '📦', title: 'We pick up your bike', body: 'A vetted logistics partner collects the bike at your scheduled time.' },
              { icon: '🚚', title: 'Door-to-door transit', body: 'Tracked transit with daily status updates on WhatsApp and email.' },
              { icon: '🤝', title: 'Deliver & inspect', body: 'Sign-off at the drop-off city after a full handover inspection.' },
            ].map((s) => (
              <div key={s.title} className="card p-5">
                <div className="text-3xl mb-2">{s.icon}</div>
                <p className="font-display text-base">{s.title}</p>
                <p className="text-sm text-charcoal-400 mt-1">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <p className="eyebrow text-center">FAQ</p>
          <h2 className="mt-2 text-center font-display text-2xl sm:text-3xl mb-8">Quick answers</h2>
          <div className="max-w-3xl mx-auto space-y-3">
            {[
              { q: 'Is this the final price?', a: 'It\'s an indicative quote. Once you confirm pickup we lock the price with our logistics partner; you only pay after carrier confirmation.' },
              { q: 'Is the bike drained of fuel?', a: 'We drain the fuel to under 1 litre at pickup as per IATA / road-transport safety standards. The battery is disconnected for non-EV bikes.' },
              { q: 'How is insurance settled if something happens?', a: 'You file a claim with us within 48 hours of delivery; payouts on approved claims hit your account within 7–10 business days.' },
              { q: 'Do you ship to / from any city?', a: 'We cover all major and most Tier-2 cities in India. If your city isn\'t in the dropdown, raise a quote ticket and our team will custom-route it.' },
            ].map((f, i) => (
              <details key={i} className="card p-5 group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                  <span className="font-semibold">{f.q}</span>
                  <span className="text-terra-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-sm text-charcoal-300 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function QuoteCard({ quote, form, helpHref }) {
  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-2xl border border-terra-500/30 bg-gradient-to-br from-charcoal-900 to-charcoal-950 p-6 shadow-2xl"
    >
      <div className="pointer-events-none absolute inset-2 rounded-[14px] border border-dashed border-terra-500/20" />

      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-terra-400/80">
          Indicative Quote
        </p>
        <h2 className="mt-2 font-display text-2xl">
          {form.fromCity} → {form.toCity}
        </h2>

        <AnimatePresence mode="wait">
          {!quote || quote.sameCity ? (
            <motion.div
              key="same"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 rounded-xl border border-dashed border-terra-500/30 bg-charcoal-900/60 p-4 text-sm text-charcoal-300"
            >
              Pick two different cities to get a quote.
            </motion.div>
          ) : (
            <motion.div
              key="quote"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Stat icon="📏" label="Distance" value={`${quote.distance.toLocaleString('en-IN')} km`} />
                <Stat
                  icon="📅"
                  label="Transit"
                  value={
                    form.express
                      ? `${quote.expressDays} day${quote.expressDays > 1 ? 's' : ''}`
                      : `${quote.transitDays} days`
                  }
                />
              </div>

              <div className="mt-5 space-y-2 rounded-xl border border-charcoal-800 bg-charcoal-900/40 p-4 text-sm">
                <Row label="Base handling" value={quote.base} />
                <Row label={`Distance · ${quote.distance} km`} value={quote.distanceCharge} />
                {quote.weightSurcharge > 0 && (
                  <Row label={`Weight surcharge (${Math.round(quote.surchargePct * 100)}%)`} value={quote.weightSurcharge} />
                )}
                {quote.expressSurcharge > 0 && (
                  <Row label="Express priority" value={quote.expressSurcharge} />
                )}
                {quote.insuranceFee > 0 && (
                  <Row label="Transit insurance" value={quote.insuranceFee} />
                )}
                <div className="my-2 border-t border-dashed border-charcoal-700" />
                <Row label="Subtotal" value={quote.subtotal} subtle />
                <Row label="GST · 18%" value={quote.gst} subtle />
                <div className="my-2 border-t border-dashed border-charcoal-700" />
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-charcoal-400">
                    Estimated total
                  </span>
                  <span className="font-display text-2xl text-terra-400">
                    {formatINR(quote.total)}
                  </span>
                </div>
              </div>

              <Link
                href={helpHref}
                className="btn btn-gold w-full mt-5 h-12 text-base"
              >
                🆘 Request Quote →
              </Link>
              <p className="mt-2 text-center text-[11px] text-charcoal-500">
                You'll be taken to a pre-filled support ticket so our team can confirm the carrier and finalize pricing.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 flex items-start gap-2 text-[11px] text-charcoal-500">
          <span className="text-terra-400">✨</span>
          Indicative pricing only. Final amount is confirmed after pickup location verification and may vary by ±10%.
        </p>
      </div>
    </motion.div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-charcoal-800 bg-charcoal-900/40 p-3">
      <div className="text-lg">{icon}</div>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-charcoal-500">{label}</p>
      <p className="font-display text-base">{value}</p>
    </div>
  );
}

function Row({ label, value, subtle }) {
  return (
    <div className={`flex items-center justify-between ${subtle ? 'text-charcoal-400' : 'text-charcoal-200'}`}>
      <span className="text-xs">{label}</span>
      <span className={`text-sm font-semibold ${subtle ? '' : 'text-white'}`}>
        {formatINR(value)}
      </span>
    </div>
  );
}
