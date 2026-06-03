'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useListProductsQuery, useListCategoriesQuery, useListEventsQuery } from '@/store/api';
import ProductCard from '@/components/shop/ProductCard';
import ProductCarousel from '@/components/shop/ProductCarousel';
import TrailstormMark from '@/components/common/TrailstormMark';
import LastRidesGallery from '@/components/common/LastRidesGallery';

const HERO_VIDEO = 'https://cdn.pixabay.com/video/2020/05/26/40478-422717417_large.mp4';
const HERO_FALLBACK = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1920';
const TRAILSTORM_HREF = '/trailstorm/2026-jaisalmer-trailstorm-event';

// Fallback gradient swatches when a category has no image set
const CATEGORY_FALLBACK_GRADIENTS = [
  'from-terra-500/30 via-charcoal-900 to-charcoal-950',
  'from-gold-500/25 via-charcoal-900 to-charcoal-950',
  'from-emerald-500/20 via-charcoal-900 to-charcoal-950',
  'from-sky-500/20 via-charcoal-900 to-charcoal-950',
];

const BRANDS = [
  'TerraGear', 'GripCo', 'TerraPack', 'BaseCamp', 'NaviX', 'HydroX',
  'SummitWear', 'RoadHawk', 'IronCrest', 'StormShield', 'MoonRider', 'DuskRiders',
];

const STATS = [
  { v: '26K+', l: 'Riders strong' },
  { v: '200+', l: 'Rides hosted' },
  { v: '50:50', l: 'Gender-equal' },
  { v: '15+', l: 'Cities' },
];

// Pillars that define the club identity (replacing generic "shop categories" framing)
const CLUB_PILLARS = [
  {
    icon: '🏍',
    title: 'Group Rides',
    desc: 'Weekend rides, breakfast runs, multi-day expeditions — across India, every month.',
  },
  {
    icon: '🏜',
    title: 'Flagship Events',
    desc: 'Trailstorm, Himalayan Bliss, Rider Mania convoys — big-stage moments for the crew.',
  },
  {
    icon: '🤝',
    title: 'A Gender-Equal Club',
    desc: 'India\'s first 50:50 riding community. Built loud, proud and united.',
  },
  {
    icon: '🛠',
    title: 'Crew-Tested Gear',
    desc: 'Curated kit our riders actually use on the road — never sponsored, never gimmicky.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Aanya R.', city: 'Bengaluru',
    quote: 'My first Trailstorm and I rode in the desert at 1 AM with 800 other riders. Nothing felt safer or louder.',
  },
  {
    name: 'Karan D.', city: 'Pune',
    quote: 'I came for a Sunday breakfast ride. Two years later I\'ve led group runs across four states with this crew.',
  },
  {
    name: 'Mehak S.', city: 'Delhi',
    quote: 'A & R is the only club where I never had to prove I deserved a spot. Just helmet on and roll.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function HomePage() {
  const { data: featured } = useListProductsQuery({ featured: true, limit: 12 });
  const { data: newest } = useListProductsQuery({ limit: 12, sort: '-createdAt' });
  const { data: topRated } = useListProductsQuery({ limit: 12, sort: '-ratings.average' });
  const { data: catData } = useListCategoriesQuery({ topLevel: 'true', includeCounts: 'true' });
  const topCategories = (catData?.categories || []).slice(0, 4);
  const { data: eventsData } = useListEventsQuery({ upcoming: 'true' });
  const upcomingEvents = (eventsData?.events || []).slice(0, 3);

  const featuredProducts = featured?.products || [];
  const newProducts = newest?.products || [];
  const recommended = topRated?.products || [];
  const hotPicks = (featuredProducts.length ? featuredProducts : recommended).slice(0, 6);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef(null);

  useEffect(() => {
    if (hotPicks.length > 1) {
      slideInterval.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % hotPicks.length);
      }, 4000);
      return () => clearInterval(slideInterval.current);
    }
  }, [hotPicks.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
      slideInterval.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % hotPicks.length);
      }, 4000);
    }
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % hotPicks.length);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + hotPicks.length) % hotPicks.length);
  };

  return (
    <div>
      {/* HERO with video + hot products */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <video
          autoPlay muted loop playsInline preload="metadata"
          poster={HERO_FALLBACK}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 hero-veil" />
        <div className="absolute inset-0 bg-grain opacity-[0.07] mix-blend-overlay pointer-events-none" />

        <div className="relative z-10 container-x pt-28 sm:pt-32 pb-16 sm:pb-24 min-h-[100svh] flex flex-col justify-end">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-4xl">
            <p className="eyebrow mb-4">INDIA'S 1ST GENDER-EQUAL BIKE CLUB</p>
            <h1 className="text-[40px] sm:text-7xl md:text-[96px] font-display leading-[0.95] max-w-5xl">
              RIDE LOUD. <br />
              <span className="gradient-text">RIDE UNITED.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-charcoal-200 max-w-2xl">
              Angels &amp; Roadsters is a riding community of 26,000+ across India —
              weekend runs, multi-day expeditions, flagship festivals like Trailstorm,
              and a crew that rolls together no matter who's behind the bars.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link href={TRAILSTORM_HREF} className="btn btn-gold text-base px-7 h-12">🏜 Join Trailstorm 2026</Link>
              <Link href="#rides" className="btn btn-outline text-base px-7 h-12">See upcoming rides →</Link>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
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

          {/* Hot products slider — right side */}
          <motion.div
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
            className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-[420px]"
          >
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="eyebrow text-[10px]">🔥 HOT PICKS</span>
                  <Link href="/shop?featured=true" className="text-[11px] text-terra-400 hover:text-terra-300">All →</Link>
                </div>
                {hotPicks.length === 0 ? (
                  <div className="text-charcoal-400 text-sm">Seed products to see hot picks.</div>
                ) : (
                  <div className="relative">
                    <div className="overflow-hidden">
                      <div 
                        className="flex gap-4 transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${currentSlide * (100 / 1.5)}%)` }}
                      >
                        {hotPicks.map((p) => {
                          const price = p.discountedPrice || p.price;
                          const img = p.thumbnail || p.images?.[0] || `https://picsum.photos/seed/${p._id}/300`;
                          const discount = p.discountedPrice && p.price > p.discountedPrice
                            ? Math.round(((p.price - p.discountedPrice) / p.price) * 100)
                            : 0;
                          return (
                            <Link
                              key={p._id}
                              href={`/shop/${p.slug}`}
                              className="flex-shrink-0 w-[calc(66.666%-0.67rem)] flex flex-col rounded-xl bg-charcoal-900/40 backdrop-blur-sm border border-white/10 hover:border-terra-500/40 transition group overflow-hidden"
                            >
                              <div className="relative aspect-square overflow-hidden bg-charcoal-900">
                                <img src={img} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                {discount > 0 && (
                                  <span className="absolute top-2 left-2 badge bg-terra-500 text-white text-[10px]">-{discount}%</span>
                                )}
                              </div>
                              <div className="p-3 flex-1 flex flex-col">
                                <div className="text-[10px] text-charcoal-400 uppercase tracking-wider">{p.brand || 'A&R'}</div>
                                <div className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-terra-400 mt-1 flex-1">{p.name}</div>
                                <div className="mt-2">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-base font-bold text-terra-400">₹{price?.toLocaleString()}</span>
                                    {p.discountedPrice && (
                                      <span className="text-[10px] line-through text-charcoal-500">₹{p.price?.toLocaleString()}</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-yellow-400 mt-1">★ {(p.ratings?.average || 0).toFixed(1)}</div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                    {hotPicks.length > 1 && (
                      <>
                        <button
                          onClick={prevSlide}
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-9 h-9 rounded-full bg-charcoal-900/90 backdrop-blur-sm border border-charcoal-700 hover:border-terra-500 hover:text-terra-400 transition flex items-center justify-center text-base z-10"
                          aria-label="Previous"
                        >
                          ←
                        </button>
                        <button
                          onClick={nextSlide}
                          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-9 h-9 rounded-full bg-charcoal-900/90 backdrop-blur-sm border border-charcoal-700 hover:border-terra-500 hover:text-terra-400 transition flex items-center justify-center text-base z-10"
                          aria-label="Next"
                        >
                          →
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

          {/* Mobile hot picks - below hero */}
          {hotPicks.length > 0 && (
            <div className="lg:hidden mt-10">
              <div className="card-glass p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="eyebrow text-[10px]">🔥 HOT PICKS</span>
                  <Link href="/shop?featured=true" className="text-[11px] text-terra-400">All →</Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {hotPicks.map((p) => {
                    const price = p.discountedPrice || p.price;
                    const img = p.thumbnail || p.images?.[0] || `https://picsum.photos/seed/${p._id}/300`;
                    return (
                      <Link key={p._id} href={`/shop/${p.slug}`} className="block">
                        <img src={img} alt={p.name} className="w-full aspect-square rounded-lg object-cover" />
                        <div className="text-xs font-semibold mt-2 line-clamp-2">{p.name}</div>
                        <div className="text-sm font-bold text-terra-400">₹{price?.toLocaleString()}</div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Marquee brands strip */}
      <section className="border-y border-charcoal-800/60 bg-charcoal-950 overflow-hidden py-5">
        <div className="marquee-track gap-12 px-12 text-charcoal-500 font-display text-2xl sm:text-3xl whitespace-nowrap">
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <span key={i} className="hover:text-terra-400 transition">{b}</span>
          ))}
        </div>
      </section>

      {/* UPCOMING RIDES — community-first primary content */}
      <section id="rides" className="container-x py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="eyebrow mb-2">SADDLE UP</p>
            <h2 className="section-title">UPCOMING RIDES <br className="hidden sm:block" /><span className="gradient-text">&amp; EVENTS</span></h2>
          </div>
          <Link href="/events" className="btn btn-outline text-sm">All rides →</Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-charcoal-300 text-lg">Next ride drops soon.</p>
            <p className="text-charcoal-500 text-sm mt-2">Follow us on Instagram <a href="https://instagram.com/angels_roadsters" target="_blank" rel="noopener noreferrer" className="text-terra-400 hover:text-terra-300">@angels_roadsters</a> for first-hand updates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {upcomingEvents.map((ev) => {
              const cover = ev.coverImage || ev.gallery?.[0] || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200';
              const start = ev.startDate ? new Date(ev.startDate) : null;
              const isTrailstorm = ev.slug?.includes('trailstorm');
              const href = isTrailstorm ? `/trailstorm/${ev.slug}` : `/events/${ev.slug}`;
              return (
                <Link key={ev._id} href={href} className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-charcoal-800 hover:border-terra-500/40 transition">
                  <img src={cover} alt={ev.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-[800ms]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/40 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {ev.eventType && <span className="badge bg-terra-500/90 text-white uppercase">{ev.eventType}</span>}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    {start && (
                      <span className="text-[10px] text-terra-400 tracking-widest uppercase">
                        {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {ev.location?.city ? ` · ${ev.location.city}` : ''}
                      </span>
                    )}
                    <h3 className="font-display text-2xl sm:text-3xl mt-1 leading-tight">{ev.title}</h3>
                    <p className="text-xs text-charcoal-300 mt-2 line-clamp-2">{ev.description}</p>
                    <p className="text-xs text-terra-400 mt-2 group-hover:underline">Join the ride →</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* CLUB PILLARS — what makes the crew the crew */}
      <section className="bg-charcoal-950 py-16 sm:py-20 border-y border-charcoal-800/60">
        <div className="container-x">
          <div className="text-center mb-10">
            <p className="eyebrow mb-2">WHY 26K+ RIDERS ROLL WITH US</p>
            <h2 className="section-title">A CLUB. NOT A <span className="gradient-text">CHECKOUT.</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {CLUB_PILLARS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card p-6"
              >
                <div className="text-4xl mb-3">{p.icon}</div>
                <h3 className="font-display text-xl">{p.title}</h3>
                <p className="text-sm text-charcoal-400 mt-2">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRAILSTORM hero CTA — moved up as the flagship moment */}
      <section className="container-x py-16 sm:py-20">
        <div className="relative rounded-3xl overflow-hidden card border-terra-500/30">
          <img src="https://images.unsplash.com/photo-1542367592-8849eb950fd8?w=1800" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
          <div className="absolute inset-0 bg-gradient-to-br from-charcoal-950/90 via-charcoal-950/75 to-terra-900/80" />
          <div className="relative p-8 sm:p-14 md:p-20 max-w-3xl">
            <TrailstormMark size="md" href={null} className="mb-5" />
            <p className="eyebrow mb-3">FLAGSHIP EVENT · OCT 2026</p>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-display leading-[0.95]">
              PARTICIPATE IN <br /><span className="gradient-text">TRAILSTORM.</span>
            </h2>
            <p className="text-charcoal-200 mt-4 max-w-xl text-base sm:text-lg">
              2 days of desert riding, off-road tracks, stunt arenas, concert nights and brotherhood
              in Jaisalmer. India's most immersive motorsport experience — built for everyday riders.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <Link href={TRAILSTORM_HREF} className="btn btn-gold text-base px-7 h-12">Register for Trailstorm →</Link>
              <Link href={TRAILSTORM_HREF + '#details'} className="btn btn-outline text-base px-7 h-12">Read more</Link>
            </div>
          </div>
        </div>
      </section>

      {/* LAST RIDES — community moments */}
      <LastRidesGallery />

      {/* TESTIMONIALS — voices of the crew */}
      <section className="bg-charcoal-950 py-16 sm:py-20 border-y border-charcoal-800/60">
        <div className="container-x">
          <div className="text-center mb-10">
            <p className="eyebrow mb-2">VOICES FROM THE CREW</p>
            <h2 className="section-title">RIDERS OF <span className="gradient-text">ANGELS &amp; ROADSTERS</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="text-terra-400 text-3xl mb-3">"</div>
                <p className="text-charcoal-200 italic leading-relaxed">{t.quote}</p>
                <div className="mt-4 pt-4 border-t border-charcoal-800">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-charcoal-500">{t.city}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOIN THE CLUB CTA */}
      <section className="container-x py-16 sm:py-20">
        <div className="relative rounded-3xl overflow-hidden card border-gold-500/30">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/20 via-terra-900/40 to-charcoal-950" />
          <div className="relative p-8 sm:p-14 md:p-20 text-center max-w-3xl mx-auto">
            <p className="eyebrow mb-3">YOUR HELMET, OUR CONVOY</p>
            <h2 className="text-4xl sm:text-6xl font-display leading-[0.95]">
              READY TO <br /><span className="gradient-text">RIDE WITH US?</span>
            </h2>
            <p className="text-charcoal-200 mt-4 text-base sm:text-lg">
              Sign up free, get the next ride drop in your inbox, and roll into the largest
              gender-equal riding community in India.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-7 justify-center">
              <Link href="/register" className="btn btn-gold text-base px-7 h-12">Join the Crew →</Link>
              <a href="https://instagram.com/angels_roadsters" target="_blank" rel="noopener noreferrer" className="btn btn-outline text-base px-7 h-12">📷 Follow on Instagram</a>
            </div>
          </div>
        </div>
      </section>

      {/* CREW-TESTED GEAR — shop demoted to secondary, framed as crew gear */}
      {(recommended.length > 0 || featuredProducts.length > 0) && (
        <ProductCarousel
          eyebrow="CREW-TESTED · NEVER SPONSORED"
          title="GEAR THE CREW ACTUALLY USES"
          subtitle="A small, curated shop of riding kit our crew rolls with — no sponsored fillers."
          products={recommended.length ? recommended : featuredProducts}
          viewAllHref="/shop"
        />
      )}

      {/* Shop categories — kept but condensed and demoted */}
      {topCategories.length > 0 && (
        <section className="container-x py-12 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="eyebrow mb-2">BROWSE THE SHOP</p>
              <h3 className="text-2xl sm:text-3xl font-display">Or jump straight to a category</h3>
            </div>
            <Link href="/shop" className="btn btn-outline text-sm">Full shop →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {topCategories.map((c, i) => {
              const href = `/shop?category=${c._id}`;
              const gradient = CATEGORY_FALLBACK_GRADIENTS[i % CATEGORY_FALLBACK_GRADIENTS.length];
              return (
                <Link
                  key={c._id}
                  href={href}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden group border border-charcoal-800 hover:border-terra-500/40 transition"
                >
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-[800ms]" />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center text-4xl opacity-60`}>🗂</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <h3 className="font-display text-lg leading-tight">{c.name}</h3>
                    <span className="text-[10px] text-terra-400 uppercase tracking-wider">{c.productCount ?? 0} items</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
