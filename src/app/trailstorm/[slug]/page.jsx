'use client';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGetEventQuery, useGetEventSlotsQuery } from '@/store/api';
import BookingWizard from '@/components/events/BookingWizard';
import EventGallerySlider from '@/components/events/EventGallerySlider';
import BrandsSlider from '@/components/events/BrandsSlider';
import TrailstormMark from '@/components/common/TrailstormMark';
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
  { q: 'Who can participate in Trailstorm?', a: 'Trailstorm is open to all motorcycle riders aged 18+ with a valid riding license. Beginners are welcome in the touring track, while the expert track requires off-road experience.' },
  { q: 'Is off-road experience required?', a: 'Not for all tracks. We have three categories: Touring Track (beginners welcome), Expert Off-Road (experience required), and Visitor Convoy (no riding required).' },
  { q: 'What motorcycles are allowed?', a: 'All motorcycles 150cc and above are allowed. Adventure bikes, dual-sport, and dirt bikes are recommended for off-road tracks.' },
  { q: 'Can beginners join?', a: 'Absolutely! The Touring Track is designed for everyday riders and beginners. You\'ll ride with the main convoy on manageable terrain.' },
  { q: 'Is accommodation included?', a: 'Camping facilities are available at the base camp. Hotel options in Jaisalmer city are also nearby. Details provided upon registration.' },
  { q: 'Are riding gears mandatory?', a: 'Yes. Helmet, riding jacket, gloves, and boots are mandatory for all participants. Knee guards recommended for off-road tracks.' },
  { q: 'Is camping available?', a: 'Yes! Desert camping is part of the Trailstorm experience. Tents, bonfire, and music under the stars.' },
  { q: 'Can clubs register as teams?', a: 'Yes! We encourage riding clubs to register as groups. Special club packages and team competitions available.' },
  { q: 'What are the competition categories?', a: 'Off-road racing, stunt competitions, endurance challenges, and biker strength events. Prizes for top performers.' },
  { q: 'How do I reach Jaisalmer?', a: 'Jaisalmer is accessible by train, bus, and air. Nearest airport is Jodhpur (285km). We\'ll share detailed travel guides after registration.' },
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
    </div>
  );
}
