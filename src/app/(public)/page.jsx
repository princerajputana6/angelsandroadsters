'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useListProductsQuery } from '@/store/api';
import ProductCard from '@/components/shop/ProductCard';
import ProductCarousel from '@/components/shop/ProductCarousel';
import TrailstormMark from '@/components/common/TrailstormMark';
import LastRidesGallery from '@/components/common/LastRidesGallery';

const HERO_VIDEO = 'https://cdn.pixabay.com/video/2020/05/26/40478-422717417_large.mp4';
const HERO_FALLBACK = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1920';
const TRAILSTORM_HREF = '/trailstorm/2026-jaisalmer-trailstorm-event';

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

const STATS = [
  { v: '12K+', l: 'Crew members' },
  { v: '200+', l: 'Events hosted' },
  { v: '80+', l: 'Curated brands' },
  { v: '4.9★', l: 'Avg rating' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function HomePage() {
  const { data: featured } = useListProductsQuery({ featured: true, limit: 12 });
  const { data: newest } = useListProductsQuery({ limit: 12, sort: '-createdAt' });
  const { data: topRated } = useListProductsQuery({ limit: 12, sort: '-ratings.average' });

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
            <p className="eyebrow mb-4">WHERE RIDERS BECOME LEGENDS</p>
            <h1 className="text-[40px] sm:text-7xl md:text-[96px] font-display leading-[0.95] max-w-5xl">
              CHASE EVERY <br />
              <span className="gradient-text">HORIZON.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-charcoal-200 max-w-2xl">
              Motorcycle rides, endurance journeys, off-road adventures, rider events,
              hand-picked gear — and a community built for those who live beyond ordinary.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link href="/shop" className="btn btn-gold text-base px-7 h-12">Shop the Drop →</Link>
              <Link href={TRAILSTORM_HREF} className="btn btn-outline text-base px-7 h-12">🏜 Join Trailstorm</Link>
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

      {/* Categories */}
      <section className="container-x py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="eyebrow mb-2">SHOP BY CATEGORY</p>
            <h2 className="section-title">GEAR THAT GOES <br className="hidden sm:block" /> THE DISTANCE</h2>
          </div>
          <Link href="/shop" className="btn btn-outline text-sm">Browse all →</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {CATEGORY_TILES.map((c) => (
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

      {/* Recommended carousel */}
      <ProductCarousel
        eyebrow="HAND-PICKED FOR YOU"
        title="RECOMMENDED FOR THE ROAD"
        subtitle="Top-rated gear from the Angeles & Roadsters crew — built, tested, and crew-approved on real rides."
        products={recommended.length ? recommended : featuredProducts}
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
            Today, we curate gear from brands we ride with personally and host events the wider community shows up for. Nothing on this site has been shipped without being tested on a real ride.
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

      {/* New Arrivals carousel */}
      <ProductCarousel
        eyebrow="JUST IN"
        title="NEW ARRIVALS"
        subtitle="Freshly added gear — first dibs for our crew."
        products={newProducts}
        viewAllHref="/shop"
      />

      {/* LAST RIDES — clickable gallery */}
      <LastRidesGallery />

      {/* TRAILSTROME CTA — replaces the old "Join Angeles & Roadsters" block */}
      <section className="container-x py-20">
        <div className="relative rounded-3xl overflow-hidden card border-terra-500/30">
          <img src="https://images.unsplash.com/photo-1542367592-8849eb950fd8?w=1800" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
          <div className="absolute inset-0 bg-gradient-to-br from-charcoal-950/90 via-charcoal-950/75 to-terra-900/80" />
          <div className="relative p-8 sm:p-14 md:p-20 max-w-3xl">
            <TrailstormMark size="md" href={null} className="mb-5" />
            <p className="eyebrow mb-3">FLAGSHIP EVENT · NOV 2026</p>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-display leading-[0.95]">
              PARTICIPATE IN <br /><span className="gradient-text">TRAILSTROME.</span>
            </h2>
            <p className="text-charcoal-200 mt-4 max-w-xl text-base sm:text-lg">
              5 days &middot; 4 nights of riding, music and stories under the Thar sky in Jaisalmer.
              Three ride tracks, 60+ brand booths, and the largest gathering of riders in Rajasthan.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <Link href={TRAILSTORM_HREF} className="btn btn-gold text-base px-7 h-12">Register for Trailstorm →</Link>
              <Link href={TRAILSTORM_HREF + '#details'} className="btn btn-outline text-base px-7 h-12">Read more</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
