'use client';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGetEventQuery, useGetEventSlotsQuery } from '@/store/api';
import BookingWizard from '@/components/events/BookingWizard';
import TrailstormMark from '@/components/common/TrailstormMark';

const HERO_BG = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920';
const HERO_VIDEO = 'https://cdn.pixabay.com/video/2022/04/05/113748-697003906_large.mp4';

const RIDE_TRACKS = [
  { name: 'Touring Track', icon: '🛣', desc: 'Cruise dunes and desert highways with the main convoy.' },
  { name: 'Expert Off-Road', icon: '⛰', desc: 'Khaba trails, riverbeds, and the legendary Longewala route.' },
  { name: 'Visitor Convoy', icon: '🎟', desc: 'Ride along in a support vehicle and soak in the festival.' },
];

const STATS = [
  { v: '2', l: 'Days Event' },
  { v: '1K+', l: 'Riders expected' },
  { v: '2K+', l: 'Visitors' },
  { v: '60+', l: 'Brand booths' },
];

const EVENT_HIGHLIGHTS = [
  { icon: '🏍️', name: 'Offroad Racing', desc: 'Competitive desert racing' },
  { icon: '💪', name: 'Biker Strength Challenge', desc: 'Test your endurance' },
  { icon: '🤸', name: 'Stunt Arena', desc: 'Professional stunt shows' },
  { icon: '🎵', name: 'Concert Night', desc: 'Live music performances' },
  { icon: '🏪', name: 'Expo Zone', desc: 'Gear and bike exhibitions' },
  { icon: '🎓', name: 'Training Workshops', desc: 'Learn from experts' },
  { icon: '🍔', name: 'Food & Music Festival', desc: 'Culinary delights' },
  { icon: '👥', name: 'Rider Community', desc: 'Network with riders' },
  { icon: '💬', name: 'Adventure Talks', desc: 'Inspiring stories' },
];

export default function TrailstormEventPage() {
  const { slug } = useParams();
  const { data, isLoading } = useGetEventQuery(slug);
  const { data: slotData } = useGetEventSlotsQuery(slug, { pollingInterval: 30000 });
  const event = data?.event;
  const slots = slotData?.slots || {};

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

        <div className="relative z-10 container-x h-full flex flex-col justify-end pb-12 sm:pb-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="eyebrow mb-2">FLAGSHIP EVENT · POWERED BY ANGELES &amp; ROADSTERS</p>
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-display leading-[0.9] max-w-4xl">
              THE DESERT IS <br /><span className="gradient-text">CALLING.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-charcoal-200 max-w-2xl">
              Everyday Riders. Chase the Adrenaline. Forge Your Legacy.
              <br />
              October 30<sup>th</sup> & 31<sup>st</sup> 2026 · Jaisalmer, Rajasthan
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <a href="#book" className="btn btn-gold text-base px-7 h-12">Register Now →</a>
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

      {/* ABOUT */}
      <section id="details" className="container-x py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-16 items-start">
          <div>
            <p className="eyebrow mb-3">WHAT IS TRAILSTORM</p>
            <h2 className="section-title mb-5">2ND ANNUAL TRAILSTORM 2026<br /><span className="gradient-text">JAISALMER - DESERT EDITION</span></h2>
            <p className="text-charcoal-200 whitespace-pre-line leading-relaxed text-base sm:text-lg">{event.description}</p>
          </div>
          <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-charcoal-800">
            <img src={event.gallery?.[0] || HERO_BG} alt="" className="w-full h-full object-cover" />
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
                    <div className="text-3xl mb-2">{h.icon}</div>
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

      {/* GALLERY */}
      {event.gallery?.length > 0 && (
        <section className="container-x py-12 sm:py-16">
          <p className="eyebrow mb-2">FROM PREVIOUS EDITIONS</p>
          <h3 className="section-title mb-6">Trailstorm moments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {event.gallery.map((g, i) => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-charcoal-800">
                <img src={g} alt="" className="w-full h-full object-cover hover:scale-110 transition duration-700" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
