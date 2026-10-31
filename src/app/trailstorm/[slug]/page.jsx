'use client';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGetEventQuery, useGetEventSlotsQuery } from '@/store/api';
import BookingWizard from '@/components/events/BookingWizard';
import EventGallerySlider from '@/components/events/EventGallerySlider';
import BrandsSlider from '@/components/events/BrandsSlider';
import TrailstormMark from '@/components/common/TrailstormMark';
import PageViewTracker from '@/components/common/PageViewTracker';
import Link from 'next/link';

const HERO_BG = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920';
const HERO_VIDEO = 'https://cdn.pixabay.com/video/2022/04/05/113748-697003906_large.mp4';

const RIDE_TRACKS = [
  { name: 'Touring Track', icon: '🛣', desc: 'Cruise dunes and desert highways with the main convoy.' },
  { name: 'Expert Off-Road', icon: '⛰', desc: 'Khaba trails, riverbeds, and the legendary Longewala route.' },
  { name: 'Visitor Convoy', icon: '🎟', desc: 'Ride along in a support vehicle and soak in the festival.' },
];

const STATS = [
  { v: '2', l: 'Days Event' },
  { v: '2500+', l: 'Riders expected' },
  { v: '5000+', l: 'Visitors' },
  { v: '100+', l: 'Brand booths' },
];

const MOMENTS = [
  '/images/moment-1.jpg',
  '/images/moment-2.jpg',
  '/images/moment-3.png',
];

const EVENT_HIGHLIGHTS = [
  { icon: '/images/1.svg', name: 'Offroad Racing', desc: 'Dakar-style desert experience' },
  { icon: '/images/2.svg', name: 'Biker Strength Challenge', desc: 'Test your endurance' },
  { icon: '/images/3.svg', name: 'Stunt Arena', desc: 'Professional stunt shows' },
  { icon: '/images/4.svg', name: 'Concert Night', desc: 'Live music & camping vibes' },
  { icon: '/images/5.svg', name: 'Expo Zone', desc: '60+ adventure brand booths' },
  { icon: '/images/6.svg', name: 'Training Workshops', desc: 'Riding sessions & workshops' },
  { icon: '/images/7.svg', name: 'Food & Music Festival', desc: 'Culinary delights' },
  { icon: '/images/8.svg', name: 'Rider Community', desc: 'Biker networking & clubs' },
  { icon: '/images/9.svg', name: 'Adventure Talks', desc: 'Inspiring stories' },
  { icon: '/images/10.svg', name: 'Desert Sunsets', desc: 'Cinematic landscapes' },
];

const WHY_ATTEND = [
  'Dakar-style desert experience',
  'Off-road racing tracks',
  'Motorcycle stunt arena',
  'Rider fitness & endurance challenges',
  'Concert nights & camping vibes',
  'Biker networking & clubs',
  'Workshops & riding sessions',
  'Adventure tourism experience',
  'Brand expo zone',
  'Desert sunsets & cinematic landscapes',
];

const SAFETY_FEATURES = [
  { icon: '🏥', title: 'Medical Support Teams', desc: 'On-site medical professionals' },
  { icon: '🚑', title: 'Recovery Vehicles', desc: '24/7 emergency response' },
  { icon: '🔧', title: 'Technical Assistance', desc: 'Mechanical support crew' },
  { icon: '💧', title: 'Hydration & Rest Zones', desc: 'Multiple pit stops' },
  { icon: '👮', title: 'Route Marshals', desc: 'Experienced guides' },
  { icon: '📡', title: 'Emergency Response', desc: 'Rapid response team' },
];

const FAQS = [
  { q: 'Who can participate in Trailstorm?', a: 'Trailstorm is open to all motorcycle riders aged 18+ with a valid riding license. Beginners are welcome in the touring track,professional racers and dirt bikes are not allowed. Street legal bikes are only allowed.' },
  { q: 'Is off-road experience required?', a: 'Not for all tracks. We have two categories: Touring Track (beginners welcome) and Visitor Convoy (no riding required).' },
  { q: 'What motorcycles are allowed?', a: 'All street legal motorcycles 150cc and above are allowed. All Adventure and touring bikes are allowed.' },
  { q: 'Can beginners join?', a: 'Absolutely! The Touring Track is designed for everyday riders and beginners. You\'ll ride with the main convoy on manageable terrain.' },
  { q: 'Is accommodation included?', a: 'Camping facilities are available at the base camp. Hotel options in Jaisalmer city are also nearby. Details provided upon registration.' },
  { q: 'Are riding gears mandatory?', a: 'Yes. Helmet, riding jacket, gloves, and boots are mandatory for all participants. Knee guards recommended for off-road tracks.' },
  { q: 'Is camping available?', a: 'Yes! Desert camping is part of the Trailstorm experience. Tents, bonfire, and music under the stars.' },
  { q: 'Can clubs register as teams?', a: 'Yes! We encourage riding clubs to register as groups. Special club packages and team competitions available.' },
  { q: 'What are the competition categories?', a: 'Off-road racing, stunt competitions, endurance challenges, and biker strength events. Prizes for top performers.' },
  { q: 'How do I reach Jaisalmer?', a: 'Jaisalmer is accessible by train, bus, and air. Nearest airport is Jodhpur (285km). We\'ll share detailed travel guides after registration.' },
];

// ---- Official Competition Guidelines (sourced from the Trailstorm 2026 rulebook) ----
const GEAR_COMPULSORY = [
  'ISI / DOT / ECE certified helmet',
  'Riding gloves',
  'Riding boots/shoes covering the ankles',
  'Full sleeves & full-length pants',
  'Knee guards or riding pants',
  'Elbow guards or riding jacket',
];
const GEAR_RECOMMENDED = ['Chest protection', 'Hydration pack', 'Auxiliary lights for the night event'];

const GUIDE_EVENTS = [
  {
    no: 'Event 1', name: 'Trailstorm Fury Circuit', type: 'Timed artificial sand circuit',
    when: '30 Oct 2026 · 09:00 AM onwards',
    desc: 'A man-made technical off-road sand circuit — berms, sand pits, tight turns, uneven sections and recovery zones. Fastest clean lap wins.',
    points: [100, 90, 80, 72, 65, 60, 55, 50, 46, 42], finish: 'Participation finish: 25',
    penalties: ['Route cut: +30 sec', 'Crash requiring marshal: +45 sec', 'Dangerous riding: disqualification possible'],
  },
  {
    no: 'Event 2', name: 'Trailstorm Shadow Run', type: 'Night navigation & desert endurance',
    when: '30 Oct 2026 · 06:30 PM onwards',
    desc: 'Riders leave the arena for natural desert terrain with directional clues, no GPS guidance, 3 checkpoints and a finish over a 4–5 km circuit. Fastest verified completion wins.',
    points: [120, 108, 96, 86, 78, 72, 66, 60, 54, 48], finish: 'Finishers: 30',
    penalties: ['Missed checkpoint: +5 min', 'Outside assistance: +10 min', 'No night lights: −10 points', 'Unsafe riding: DQ possible'],
  },
  {
    no: 'Event 3', name: 'Trailstorm Dune Raid', type: 'Day desert navigation & technical endurance',
    when: '31 Oct 2026 · 09:30 AM onwards',
    desc: 'A longer, harder run with technical dune crossings, deeper sand and tougher navigation over a 6–7 km route — the championship’s most important endurance stage.',
    points: [150, 135, 120, 108, 96, 88, 80, 72, 64, 56], finish: 'Finishers: 35',
    penalties: ['Missed checkpoint: +5 min', 'Outside assistance: +4 min', 'Unsafe riding: DQ possible'],
  },
  {
    no: 'Event 4', name: 'Sand Survivor — Machine Recovery', type: 'Manual motorcycle recovery challenge',
    when: '31 Oct 2026 · 03:30 PM onwards',
    desc: 'Bikes are parked in deep sand, engine off, keys at the start line. Run for the key, reach the bike and push it through the recovery route to the finish — without starting the engine.',
    points: [110, 100, 90, 82, 75, 68, 62, 56, 50, 45], finish: 'Finishers: 25',
    penalties: ['Engine start: automatic disqualification', 'Outside assistance: disqualification'],
  },
];

const MACHINE_ALLOWED = [
  'Street-legal motorcycles 150cc and above',
  'Adventure & touring motorcycles',
  'Street-legal dual-sport motorcycles',
  'Bikes that are mechanically fit and clear technical inspection',
];
const MACHINE_NOT_ALLOWED = [
  'Dirt bikes / off-road-only race bikes',
  'Heavily modified motorcycles',
  'Motorcycles below 150cc',
  'Electric motorcycles, scooters & mopeds',
  'Unsafe, leaking or heavily damaged motorcycles',
];

const DQ_TRIGGERS = [
  'Dangerous or reckless riding',
  'Ignoring a red flag or emergency signal',
  'Route cutting or bypassing checkpoints',
  'Riding under the influence of alcohol/substances',
  'Tampering with timing or checkpoint systems',
  'Starting the engine during Sand Survivor',
  'Physical misconduct, violence or verbal abuse of officials',
  'Falsifying rider or motorcycle information',
];

const AWARDS = [
  'Overall Champion', 'Fastest Rider', 'Best Recovery Specialist', 'Night Raider Award',
  'Desert Dominator', 'Most Consistent Rider', 'Best Female Rider', 'Best Riding Club in India',
];

function Bullets({ items, tone = 'terra' }) {
  const dot = tone === 'red' ? 'text-red-400' : tone === 'green' ? 'text-emerald-400' : 'text-terra-400';
  return (
    <ul className="space-y-1.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2 text-sm text-charcoal-200">
          <span className={`${dot} mt-0.5`}>{tone === 'red' ? '✕' : '✓'}</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function GuideSection({ eyebrow, title, children }) {
  return (
    <section className="card p-5 sm:p-6">
      {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
      <h3 className="font-display text-xl sm:text-2xl mb-3">{title}</h3>
      {children}
    </section>
  );
}

/** Full competition guidelines, rendered in-app (on-brand) from the official
 * Trailstorm 2026 rulebook. Machine eligibility reflects the current policy —
 * street-legal 150cc+ only; dirt and modified bikes are not permitted. */
function GuidelinesModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center p-0 sm:p-4 bg-charcoal-950/85 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="bg-charcoal-950 w-full max-w-4xl h-full sm:h-auto sm:max-h-[92vh] sm:rounded-3xl border border-charcoal-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-7 py-4 border-b border-charcoal-800 bg-charcoal-950/95 backdrop-blur">
          <div>
            <p className="eyebrow mb-0.5">RULEBOOK · VERSION 1.0</p>
            <h2 className="font-display text-xl sm:text-2xl">Trailstorm 2026 — Competition Guidelines</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="shrink-0 w-10 h-10 rounded-full border border-charcoal-700 hover:border-terra-500 hover:text-terra-400 transition">✕</button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 sm:px-7 py-6 space-y-5">
          <GuideSection eyebrow="COMPETITION FORMAT" title="A multi-event off-road championship">
            <Bullets items={[
              'Trailstorm 2026 is a multi-event off-road endurance and skill championship.',
              'Every registered riding club may nominate up to 4 riders (“Club Champions”).',
              'Riders compete individually in all official events.',
              'Points earned across events count toward both individual rider rankings and club championship rankings.',
            ]} />
          </GuideSection>

          <GuideSection eyebrow="RIDER ELIGIBILITY" title="What every rider must do">
            <Bullets items={[
              'Possess a valid motorcycle driving license.',
              'Wear mandatory riding safety gear at all times.',
              'Use a mechanically fit motorcycle.',
              'Follow marshal instructions without argument or delay.',
              'Sign the event waiver and safety declaration before participation.',
            ]} />
          </GuideSection>

          <GuideSection eyebrow="MANDATORY RIDING GEAR" title="Gear & protection">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-charcoal-500 mb-2">Compulsory</p>
                <Bullets items={GEAR_COMPULSORY} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-charcoal-500 mb-2">Recommended</p>
                <Bullets items={GEAR_RECOMMENDED} tone="green" />
              </div>
            </div>
            <p className="text-xs text-charcoal-400 mt-4">Failure to comply may lead to time penalties, point deductions or disqualification. Riders without mandatory gear may not be permitted to start.</p>
          </GuideSection>

          <GuideSection eyebrow="THE EVENTS" title="Structure, scoring & penalties">
            <div className="space-y-4">
              {GUIDE_EVENTS.map((ev) => (
                <div key={ev.no} className="rounded-2xl border border-charcoal-800 p-4 sm:p-5 bg-charcoal-900/40">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                    <span className="badge bg-terra-500/20 text-terra-300 uppercase text-[10px]">{ev.no}</span>
                    <h4 className="font-display text-lg">{ev.name}</h4>
                  </div>
                  <p className="text-xs text-charcoal-400">{ev.type} · {ev.when}</p>
                  <p className="text-sm text-charcoal-200 mt-2">{ev.desc}</p>

                  <p className="text-xs uppercase tracking-wider text-charcoal-500 mt-4 mb-2">Points by position</p>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 text-center">
                    {ev.points.map((p, i) => (
                      <div key={i} className="rounded-md bg-charcoal-800/70 py-1.5">
                        <div className="text-[10px] text-charcoal-500">{i + 1}{['st', 'nd', 'rd'][i] || 'th'}</div>
                        <div className="text-sm font-semibold text-terra-300 tabular-nums">{p}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-charcoal-400 mt-2">{ev.finish}</p>

                  <p className="text-xs uppercase tracking-wider text-charcoal-500 mt-4 mb-1.5">Penalties</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ev.penalties.map((p, i) => (
                      <span key={i} className="text-[11px] px-2 py-1 rounded-md border border-charcoal-700 text-charcoal-300">{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection eyebrow="MACHINE ELIGIBILITY" title="Which motorcycles can ride">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-emerald-400/80 mb-2">Allowed</p>
                <Bullets items={MACHINE_ALLOWED} tone="green" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-red-400/80 mb-2">Not allowed</p>
                <Bullets items={MACHINE_NOT_ALLOWED} tone="red" />
              </div>
            </div>
            <p className="text-xs text-charcoal-400 mt-4">All motorcycles must pass official technical inspection — brakes, tyres, throttle, controls, headlight, fuel system and electricals. A functional headlight is compulsory for the night event.</p>
          </GuideSection>

          <GuideSection eyebrow="FAIR PLAY & TIMING" title="Conduct, penalties & the clock">
            <Bullets items={[
              'All events are officially timed — timing starts at the start gate and stops only at the official finish line.',
              'Route cutting, intentional obstruction, ignoring checkpoints, unapproved external assistance and tampering with the timing system lead to penalties or disqualification.',
              'Published timings are provisional until timing verification, penalty confirmation and protest review close.',
              'Decisions of the race marshals and chief judges are final.',
            ]} />
          </GuideSection>

          <GuideSection eyebrow="SAFETY & MEDICAL" title="Rider safety comes first">
            <Bullets items={[
              'First-aid stations, on-ground medical teams, ambulance support and recovery marshals operate throughout competition hours.',
              'Riders are personally responsible for bike fitness, fuel, brakes, tyres and hydration.',
              'Marshals and safety teams may neutralise a stage, pause timing, divert routes or suspend an event at any time.',
              'Zero tolerance: riding under the influence, intentionally dangerous riding, ignoring emergency signals, or tampering with safety equipment means immediate disqualification.',
            ]} tone="red" />
          </GuideSection>

          <GuideSection eyebrow="OFFICIALS & PROTESTS" title="Marshals, protests & appeals">
            <Bullets items={[
              'Marshal instructions during competition, inspections, checkpoints and emergencies must be followed immediately.',
              'Official protests are filed in person at the Control Desk within 30 minutes of a provisional result, by a registered rider, club captain or team representative, with supporting evidence.',
              'Verbal complaints alone, social-media allegations and protests after the deadline are not accepted.',
              'The Trailstorm Competition Committee’s ruling is final, binding and non-negotiable.',
            ]} />
          </GuideSection>

          <GuideSection eyebrow="DISQUALIFICATION" title="What can end your championship">
            <Bullets items={DQ_TRIGGERS} tone="red" />
          </GuideSection>

          <GuideSection eyebrow="CHAMPIONSHIP & AWARDS" title="How titles are decided">
            <Bullets items={[
              'Individual: highest total points across all 4 events wins the Trailstorm Overall Champion title.',
              'Club: for each event the top 3 of a club’s 4 rider scores count; the lowest is dropped. Highest cumulative points across all events wins Best Riding Club.',
            ]} />
            <p className="text-xs uppercase tracking-wider text-charcoal-500 mt-4 mb-2">Awards</p>
            <div className="flex flex-wrap gap-1.5">
              {AWARDS.map((a, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-full border border-gold-500/30 text-gold-300">{a}</span>
              ))}
            </div>
          </GuideSection>

          <GuideSection eyebrow="CONTACT & SUPPORT" title="Questions about the rules?">
            <div className="space-y-1.5 text-sm text-charcoal-200">
              <p>📞 <a href="tel:+918384099474" className="text-terra-400 hover:text-terra-300">+91-8384099474</a></p>
              <p>✉️ <a href="mailto:support@angelsandroadsters.com" className="text-terra-400 hover:text-terra-300">support@angelsandroadsters.com</a></p>
              <p>🌐 www.angelsandroadsters.com</p>
            </div>
          </GuideSection>

          <p className="text-[11px] text-charcoal-600 text-center pt-2">
            Trailstorm 2026 · Jaisalmer Desert Edition · Rulebook Version 1.0. Organisers reserve the right to modify schedules, routes and procedures in the interest of rider safety and event integrity.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TrailstormEventPage() {
  const { slug } = useParams();
  const { data, isLoading } = useGetEventQuery(slug);
  const { data: slotData } = useGetEventSlotsQuery(slug, { pollingInterval: 30000 });
  const event = data?.event;
  const slots = slotData?.slots || {};
  const [showGuidelines, setShowGuidelines] = useState(false);

  if (isLoading) {
    return <div className="container-x pt-32 pb-20 text-charcoal-300">Loading Trailstorm...</div>;
  }
  if (!event) {
    return (
      <div className="container-x pt-32 pb-20 text-center">
        <h1 className="section-title">Event not found</h1>
        <p className="text-charcoal-400 mt-2">Run <code className="text-terra-400">node scripts/add-trailstorm.js</code> to seed it.</p>
      </div>
    );
  }

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  return (
    <div>
      <PageViewTracker page="trailstorm" />
      {/* HERO */}
      <section className="relative h-[100svh] min-h-[640px] overflow-hidden">
        <video
          autoPlay muted loop playsInline preload="metadata"
          poster={HERO_BG}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 hero-veil" />
        <div className="absolute inset-0 bg-grain opacity-[0.08] mix-blend-overlay pointer-events-none" />

        {/* Large Trailstorm Logo - Right Side */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute right-8 top-1/3 -translate-y-1/2 z-20 hidden lg:block"
        >
          <img 
            src="/logos/trailstorm.png" 
            alt="Trailstorm" 
            className="h-96 sm:h-[28rem] w-auto object-contain drop-shadow-2xl opacity-90" 
          />
        </motion.div>

        <div className="relative z-10 container-x h-full flex flex-col justify-end pb-12 sm:pb-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-4xl">
            <p className="eyebrow mb-2">FLAGSHIP EVENT · POWERED BY ANGELS &amp; ROADSTERS</p>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-display leading-[0.95] max-w-4xl">
              INDIA'S MOST IMMERSIVE<br />
              <span className="gradient-text">MOTORSPORT EXPERIENCE</span>
            </h1>
            <p className="mt-5 text-base sm:text-xl text-charcoal-200 max-w-3xl leading-relaxed">
              2 Days. Endless Dunes. Adrenaline Challenges. Concert Nights. Brotherhood.<br />
              <span className="text-terra-400 font-semibold">TRAILSTORM 2026</span> brings everyday riders into the heart of Rajasthan's desert battlefield.
            </p>
            <p className="mt-3 text-sm sm:text-base text-charcoal-300">
              📍 October 30<sup>th</sup> & 31<sup>st</sup> 2026 · Jaisalmer, Rajasthan
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <a href="#book" className="btn btn-gold text-base px-7 h-12">Register Now →</a>
              <a href="/trailstorm/booking" className="btn btn-outline text-base px-7 h-12">🏨 Book Your Stay</a>
              <a href="#details" className="btn btn-outline text-base px-7 h-12">Watch The Story</a>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-10 card-glass max-w-2xl grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10"
            >
              {STATS.map((s) => (
                <div key={s.l} className="px-3 sm:px-5 py-4 text-center sm:text-left">
                  <div className="text-2xl sm:text-3xl font-display text-terra-400">{s.v}</div>
                  <div className="text-[10px] sm:text-xs text-charcoal-300 uppercase tracking-wider mt-1">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* EVENT GALLERY SLIDER (admin-uploaded) */}
      <EventGallerySlider images={event.gallery} title={event.galleryTitle} />

      {/* BRANDS SLIDER (admin-uploaded) */}
      <BrandsSlider logos={event.brands} title={event.brandsTitle} />

      {/* ABOUT */}
      <section id="details" className="container-x py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-16 items-start">
          <div>
            <p className="eyebrow mb-3">WHAT IS TRAILSTORM</p>
            <h2 className="section-title mb-5">2ND ANNUAL TRAILSTORM 2026<br /><span className="gradient-text">JAISALMER - DESERT EDITION</span></h2>
            <div className="text-charcoal-200 leading-relaxed text-base sm:text-lg space-y-4">
              <p>
                <strong className="text-terra-400">TRAILSTORM</strong> is India's ultimate amateur rider motorsport and adventure festival created for everyday riders who dream of experiencing the thrill of desert racing, off-road challenges, stunt arenas, endurance activities, and biker brotherhood — all in one massive destination event.
              </p>
              <p>
                Built by riders, for riders. Whether you're a weekend warrior, an adventure seeker, or part of a riding club — Trailstorm is your stage.
              </p>
              <p className="text-charcoal-300 text-sm italic">
                {event.description}
              </p>
            </div>
          </div>
          <div className="w-full rounded-3xl overflow-hidden border border-charcoal-800 bg-charcoal-950">
            <img
              src="/images/trailstorm-l.jpg"
              alt="Trailstorm 2026 — Jaisalmer Desert Edition"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* RIDE TRACKS */}
      <section className="container-x py-12 sm:py-16">
        <p className="eyebrow mb-2">PICK YOUR LANE</p>
        <h2 className="section-title mb-8">RIDE TRACKS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {RIDE_TRACKS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card p-6"
            >
              <div className="text-4xl mb-3">{t.icon}</div>
              <h3 className="font-display text-2xl">{t.name}</h3>
              <p className="text-charcoal-400 text-sm mt-2">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HIGHLIGHTS + SCHEDULE + BOOKING */}
      <section id="book" className="container-x py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-8 lg:gap-12">
          <div className="space-y-10">
            <div>
              <p className="eyebrow mb-2">EVENT HIGHLIGHTS</p>
              <h3 className="section-title mb-5">What's Inside</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {EVENT_HIGHLIGHTS.map((h, i) => (
                  <div key={i} className="card p-4 text-center">
                    <img src={h.icon} alt={h.name} className="w-14 h-14 mx-auto mb-2 object-contain" />
                    <div className="font-semibold text-sm">{h.name}</div>
                    <div className="text-xs text-charcoal-400 mt-1">{h.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-glass p-5 sm:p-6 border-terra-500/20">
              <p className="eyebrow mb-2">ELIGIBILITY</p>
              <p className="text-sm text-charcoal-200">{event.eligibility || 'Open to all riders 18+. Visitors of all ages welcome.'}</p>
            </div>

            {/* OFFICIAL GUIDELINES */}
            <div className="card-glass p-5 sm:p-6 border-gold-500/20">
              <p className="eyebrow mb-2">RULEBOOK</p>
              <h3 className="font-display text-xl mb-1">Official Competition Guidelines</h3>
              <p className="text-sm text-charcoal-300 mb-3">
                Format, eligibility, mandatory gear, the four events and their points, safety, timing, penalties and the championship system — everything that governs Trailstorm 2026.
              </p>
              <button
                type="button"
                onClick={() => setShowGuidelines(true)}
                className="inline-flex items-center gap-1.5 text-terra-400 hover:text-terra-300 font-semibold text-sm underline underline-offset-4 decoration-terra-500/50"
              >
                📖 Read our guidelines <span aria-hidden>→</span>
              </button>
            </div>
          </div>

          <div>
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="text-center hidden lg:block">
                <TrailstormMark size="md" href={null} className="mx-auto" />
              </div>
              <BookingWizard event={event} />
            </div>
          </div>
        </div>
      </section>

      {/* WHY YOU SHOULD ATTEND */}
      <section className="bg-charcoal-950 py-16 sm:py-20">
        <div className="container-x">
          <p className="eyebrow mb-2 text-center">WHY RIDERS LOVE TRAILSTORM</p>
          <h2 className="section-title text-center mb-10">Why You Should Attend</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {WHY_ATTEND.map((reason, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card p-4 text-center"
              >
                <div className="text-terra-400 text-2xl mb-2">✓</div>
                <div className="text-sm font-semibold">{reason}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EVENT EXPERIENCE STORY */}
      <section className="container-x py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="eyebrow mb-3">THE EXPERIENCE</p>
          <h2 className="section-title mb-6">Feel The Desert Calling</h2>
          <div className="text-lg sm:text-xl text-charcoal-200 leading-relaxed space-y-4">
            <p>
              Imagine riding through endless golden dunes with hundreds of riders around you. Engines roaring. Sand flying. Sunset hitting the desert horizon.
            </p>
            <p>
              Music echoing through the night while riders from across India celebrate one shared passion — <span className="text-terra-400 font-semibold">motorcycles, adventure, and freedom</span>.
            </p>
            <p className="text-base text-charcoal-300 mt-6">
              TRAILSTORM isn't just an event. It's a memory that outlives the miles. A story you'll tell for years. A brotherhood forged in sand and adrenaline.
            </p>
          </div>
        </div>
      </section>

      {/* CLUB PARTICIPATION */}
      <section className="bg-gradient-to-br from-terra-900/20 to-charcoal-950 py-16 sm:py-20 border-y border-terra-500/20">
        <div className="container-x">
          <div className="max-w-3xl mx-auto text-center">
            <p className="eyebrow mb-3">CALLING RIDING CLUBS ACROSS INDIA</p>
            <h2 className="section-title mb-5">Bring Your Club. Represent Your City.</h2>
            <p className="text-lg text-charcoal-200 mb-8">
              TRAILSTORM is not just an event. It's a battleground for riding communities.<br />
              Bring your club. Compete. Collaborate. Create memories together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#book" className="btn btn-gold px-8 h-12">Register Your Club</a>
              <a href="/contact" className="btn btn-outline px-8 h-12">PARTNER WITH US <span className="text-charcoal-400">(for Brands)</span></a>
            </div>
          </div>
        </div>
      </section>

      {/* SAFETY & TRUST */}
      <section className="container-x py-16 sm:py-20">
        <p className="eyebrow mb-2 text-center">RIDER SAFETY & SUPPORT</p>
        <h2 className="section-title text-center mb-10">Your Safety is Our Priority</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SAFETY_FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card p-6"
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="font-display text-xl mb-2">{feature.title}</h3>
              <p className="text-sm text-charcoal-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-charcoal-950 py-16 sm:py-20">
        <div className="container-x max-w-4xl">
          <p className="eyebrow mb-2 text-center">GOT QUESTIONS?</p>
          <h2 className="section-title text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <motion.details
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card p-5 group"
              >
                <summary className="cursor-pointer font-semibold text-base sm:text-lg list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="text-terra-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-charcoal-300 text-sm sm:text-base mt-3 leading-relaxed">{faq.a}</p>
              </motion.details>
            ))}
          </div>

          {/* Help & Support CTA */}
          <div className="mt-10 card p-6 bg-gradient-to-r from-terra-500/10 to-gold-500/5 border border-terra-500/25 text-center">
            <p className="text-lg font-display mb-1">Still have questions?</p>
            <p className="text-charcoal-400 text-sm mb-4">
              Our support team is happy to help — reach out anytime and we'll respond within 24 hours.
            </p>
            <Link href="/help" className="btn btn-gold inline-flex items-center gap-2 px-6">
              🆘 Help & Support
            </Link>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="container-x py-12 sm:py-16">
        <p className="eyebrow mb-2">FROM PREVIOUS EDITIONS</p>
        <h3 className="section-title mb-6">Trailstorm moments</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {MOMENTS.map((g, i) => (
            <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-charcoal-800">
              <img src={g} alt={`Trailstorm moment ${i + 1}`} className="w-full h-full object-cover hover:scale-110 transition duration-700" />
            </div>
          ))}
        </div>
      </section>

      {showGuidelines && <GuidelinesModal onClose={() => setShowGuidelines(false)} />}
    </div>
  );
}
