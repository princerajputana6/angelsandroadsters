'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useListProductsQuery, useListEventsQuery } from '@/store/api';
import ProductCard from '@/components/shop/ProductCard';
import ProductCarousel from '@/components/shop/ProductCarousel';
import EventCard from '@/components/events/EventCard';

const HERO_VIDEO = 'https://cdn.pixabay.com/video/2020/05/26/40478-422717417_large.mp4';
const HERO_FALLBACK = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1920';

const CATEGORY_TILES = [
  { name: 'Helmets', img: 'https://images.unsplash.com/photo-1577128321998-da8fae0b9a0d?w=900', href: '/shop?q=helmet', count: '40+' },
  { name: 'Backpacks', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900', href: '/shop?q=backpack', count: '25+' },
  { name: 'Tents', img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=900', href: '/shop?q=tent', count: '18+' },
  { name: 'Riding Jackets', img: 'https://images.unsplash.com/photo-1591025207163-942350e47db2?w=900', href: '/shop?q=jacket', count: '32+' },
];

const BRANDS = [
  'TerraGear', 'GripCo', 'TerraPack', 'BaseCamp', 'NaviX', 'HydroX',
  'SummitWear', 'RoadHawk', 'IronCrest', 'StormShield', 'MoonRider', 'DuskRiders',
];

const TESTIMONIALS = [
  {
    name: 'Aarav Mehta',
    role: 'Rider · 14 yrs',
    quote: 'The Himalayan Sunrise Rally was a turning point. The gear, the routes, the people — all top-shelf.',
    img: 'https://i.pravatar.cc/120?img=12',
  },
  {
    name: 'Priya Iyer',
    role: 'Trekker · solo traveler',
    quote: 'Their backpacks survived a monsoon trek in Munnar. Build quality you can feel, designed by people who actually ride.',
    img: 'https://i.pravatar.cc/120?img=47',
  },
  {
    name: 'Karan Singh',
    role: 'Off-road enthusiast',
    quote: 'The expo was bonkers. Found gear I had been hunting for years. Now it is my default crew.',
    img: 'https://i.pravatar.cc/120?img=33',
  },
];

const STATS = [
  { v: '12K+', l: 'Riders & travelers' },
  { v: '200+', l: 'Events hosted' },
  { v: '80+', l: 'Curated brands' },
  { v: '4.9★', l: 'Avg member rating' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function HomePage() {
  const { data: featured } = useListProductsQuery({ featured: true, limit: 12 });
  const { data: newest } = useListProductsQuery({ limit: 12, sort: '-createdAt' });
  const { data: topRated } = useListProductsQuery({ limit: 12, sort: '-ratings.average' });
  const { data: eventData } = useListEventsQuery({ upcoming: true });

  const featuredProducts = featured?.products || [];
  const newProducts = newest?.products || [];
  const recommendedProducts = topRated?.products || [];
  const events = (eventData?.events || []).slice(0, 3);

  return (
    <div>
      {/* HERO with video background */}
      <section className="relative h-[100svh] min-h-[640px] overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={HERO_FALLBACK}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 hero-veil" />
        <div className="absolute inset-0 bg-grain opacity-[0.07] mix-blend-overlay pointer-events-none" />

        <div className="relative z-10 container-x h-full flex flex-col justify-end pb-16 sm:pb-24">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <p className="eyebrow mb-4">EST · 2018 · Made for the open road</p>
            <h1 className="text-[44px] sm:text-7xl md:text-[110px] font-display leading-[0.92] max-w-5xl">
              CHASE EVERY <br />
              <span className="gradient-text">HORIZON.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-charcoal-200 max-w-xl">
              Hand-picked riding & travel gear from <span className="text-white font-semibold">Angeles & Roadsters</span>.
              Plus rallies, treks and expos crafted for the wild at heart.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/shop" className="btn btn-gold text-base px-7 h-12">Shop the Drop →</Link>
              <Link href="/events" className="btn btn-outline text-base px-7 h-12">Find an Event</Link>
            </div>

            {/* Floating stats card */}
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
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 animate-float">
          <span className="text-[10px] tracking-[0.4em] text-charcoal-400 uppercase">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-terra-500 to-transparent" />
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

      {/* Category tiles */}
      <section className="container-x py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="eyebrow mb-2">SHOP BY CATEGORY</p>
            <h2 className="section-title">GEAR THAT GOES <br className="hidden sm:block" /> THE DISTANCE</h2>
          </div>
          <Link href="/shop" className="btn btn-outline text-sm">Browse all →</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {CATEGORY_TILES.map((c, i) => (
            <Link key={c.name} href={c.href} className="relative aspect-[3/4] rounded-2xl overflow-hidden group border border-charcoal-800 hover:border-terra-500/40 transition">
              <img src={c.img} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-[800ms]" />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <span className="text-[10px] text-terra-400 tracking-widest uppercase">{c.count} items</span>
                <h3 className="font-display text-2xl sm:text-3xl mt-1">{c.name}</h3>
                <p className="text-xs text-charcoal-400 mt-1 group-hover:text-terra-400 transition">Explore →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recommended Products carousel */}
      <ProductCarousel
        eyebrow="HAND-PICKED FOR YOU"
        title="RECOMMENDED FOR THE ROAD"
        subtitle="Top-rated gear from the Angeles & Roadsters crew — built, tested, and crew-approved on real rides."
        products={recommendedProducts.length ? recommendedProducts : featuredProducts}
        viewAllHref="/shop"
      />

      {/* Brand story split */}
      <section className="container-x py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="relative">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1612197527762-8cfb55b618d1?w=1200"
              alt="Riders on the road"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -right-6 card-glass p-5 max-w-[220px] hidden sm:block">
            <div className="font-script text-terra-400 text-3xl">Since 2018</div>
            <p className="text-xs text-charcoal-300 mt-1">Built by riders, for riders. Tested on the worst roads we could find.</p>
          </div>
        </div>
        <div>
          <p className="eyebrow mb-3">OUR STORY</p>
          <h2 className="section-title">BUILT BY THE CREW. <br /><span className="gradient-text">RIDDEN BY THE CREW.</span></h2>
          <p className="text-charcoal-300 mt-5 text-base sm:text-lg">
            Angeles & Roadsters started in a garage in Bangalore — three friends and a borrowed welder, fed up with gear that promised the world but quit at 4,000 meters.
          </p>
          <p className="text-charcoal-400 mt-3">
            Today, we curate gear from brands we ride with personally. We host the events we wish existed. Nothing on this site has been shipped without being tested on a real ride.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[
              { v: '24h', l: 'Fast dispatch' },
              { v: '30d', l: 'Easy returns' },
              { v: '∞', l: 'Crew support' },
            ].map((b) => (
              <div key={b.l} className="card p-4 text-center">
                <div className="font-display text-2xl text-terra-400">{b.v}</div>
                <div className="text-[11px] text-charcoal-400 mt-1 uppercase tracking-wider">{b.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="container-x py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="eyebrow mb-2">THIS SEASON</p>
              <h2 className="section-title">FEATURED GEAR</h2>
            </div>
            <Link href="/shop" className="btn btn-outline text-sm">All products →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {featuredProducts.slice(0, 8).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section className="container-x py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="eyebrow mb-2">UPCOMING ADVENTURES</p>
            <h2 className="section-title">RIDE WITH THE CREW</h2>
          </div>
          <Link href="/events" className="btn btn-outline text-sm">All events →</Link>
        </div>
        {events.length === 0 ? (
          <p className="text-charcoal-400">No upcoming events yet. Add some in the admin panel.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {events.map((e) => <EventCard key={e._id} event={e} />)}
          </div>
        )}
      </section>

      {/* New Arrivals carousel */}
      <ProductCarousel
        eyebrow="JUST IN"
        title="NEW ARRIVALS"
        subtitle="Freshly added gear — first dibs for our crew."
        products={newProducts}
        viewAllHref="/shop"
      />

      {/* Testimonials */}
      <section className="container-x py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="eyebrow mb-3">FROM THE CREW</p>
          <h2 className="section-title">RIDERS &amp; TRAVELERS WHO TRUST US</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card-glass p-6 sm:p-7 relative">
              <div className="text-terra-400 text-5xl font-display leading-none mb-3">"</div>
              <p className="text-charcoal-200 text-sm sm:text-base">{t.quote}</p>
              <div className="flex items-center gap-3 mt-5">
                <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-terra-500/40" />
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-[11px] text-charcoal-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-x py-20">
        <div className="relative rounded-3xl overflow-hidden card border-terra-500/30">
          <img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1800" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
          <div className="absolute inset-0 bg-gradient-to-br from-charcoal-950/90 via-charcoal-950/75 to-terra-900/80" />
          <div className="relative p-8 sm:p-14 md:p-20 max-w-3xl">
            <p className="eyebrow mb-3">THE CREW</p>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-display leading-[0.95]">JOIN ANGELES <br /><span className="gradient-text">&amp; ROADSTERS</span>.</h2>
            <p className="text-charcoal-200 mt-4 max-w-xl">Early drops, members-only event slots, and a real-rider community that shows up — on the road and in the chat.</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <Link href="/register" className="btn btn-gold text-base px-7 h-12">Create Account</Link>
              <Link href="/events" className="btn btn-outline text-base px-7 h-12">Browse Events</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
