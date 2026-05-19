'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const RIDES = [
  {
    id: 'himalayan-2025',
    title: 'Himalayan Sunrise Rally 2025',
    location: 'Manali → Leh',
    date: 'JUN 2025',
    riders: 142,
    cover: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200',
    story: 'Five days, 1,200 km, and one of the wildest weather windows we have ever ridden through. From the green ridges of Solang to the bone-dry passes of Tanglang La — every rider in the convoy made it home with a story they will tell for life.',
    gallery: [
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1600',
      'https://images.unsplash.com/photo-1612197527762-8cfb55b618d1?w=1600',
      'https://images.unsplash.com/photo-1551798507-629020c81463?w=1600',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1600',
      'https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=1600',
      'https://images.unsplash.com/photo-1518406432532-9cbef79b9e58?w=1600',
    ],
  },
  {
    id: 'western-ghats-2024',
    title: 'Western Ghats Monsoon Trek 2024',
    location: 'Munnar, Kerala',
    date: 'JUL 2024',
    riders: 64,
    cover: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200',
    story: 'Three days deep in the monsoon — waterfalls in every valley and a fog that ate the sun by mid-morning. Sixty four trekkers, two community leaders, and exactly zero phone signal. Some of the best journaling weeks the crew has had.',
    gallery: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600',
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1600',
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600',
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1600',
      'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1600',
    ],
  },
  {
    id: 'jaisalmer-trailstorm-2024',
    title: 'Trailstorm — Jaisalmer Edition 2024',
    location: 'Sam Sand Dunes, Rajasthan',
    date: 'NOV 2024',
    riders: 380,
    cover: 'https://images.unsplash.com/photo-1542367592-8849eb950fd8?w=1200',
    story: 'The night the Thar turned into a festival. Three ride tracks, an expo, four live music sets, and our biggest community gathering yet. 380 riders, 60+ brand booths, and the dunes lit up like a desert opera.',
    gallery: [
      'https://images.unsplash.com/photo-1542367592-8849eb950fd8?w=1600',
      'https://images.unsplash.com/photo-1605649461784-8c0c1a04d18d?w=1600',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600',
      'https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600',
      'https://images.unsplash.com/photo-1485085577660-d3e0c91e0c63?w=1600',
    ],
  },
  {
    id: 'spiti-expedition-2024',
    title: 'Spiti Off-Road Expedition 2024',
    location: 'Spiti Valley, Himachal',
    date: 'SEP 2024',
    riders: 28,
    cover: 'https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?w=1200',
    story: 'A small-batch high-altitude expedition for advanced riders only. River crossings, ridge lines, and a Komic homestay night under the clearest night sky most of us had ever seen.',
    gallery: [
      'https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?w=1600',
      'https://images.unsplash.com/photo-1486916856361-43071f7d4d92?w=1600',
      'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1600',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600',
      'https://images.unsplash.com/photo-1542856391-010fb87dcfed?w=1600',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600',
    ],
  },
];

function GalleryModal({ ride, onClose }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setActive((i) => Math.min(ride.gallery.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setActive((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [ride.gallery.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[80] bg-charcoal-950/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-charcoal-950 border border-charcoal-800 rounded-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-charcoal-800">
          <div>
            <p className="text-[10px] text-terra-400 tracking-widest uppercase">{ride.date} · {ride.location}</p>
            <h3 className="font-display text-xl sm:text-2xl mt-0.5">{ride.title}</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full border border-charcoal-800 hover:border-terra-500">✕</button>
        </div>

        <div className="relative flex-1 bg-black overflow-hidden min-h-[40vh]">
          <img src={ride.gallery[active]} alt="" className="absolute inset-0 w-full h-full object-contain" />
          {ride.gallery.length > 1 && (
            <>
              <button
                onClick={() => setActive((i) => (i - 1 + ride.gallery.length) % ride.gallery.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-charcoal-950/80 border border-charcoal-700 hover:border-terra-500 backdrop-blur"
                aria-label="Previous"
              >←</button>
              <button
                onClick={() => setActive((i) => (i + 1) % ride.gallery.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-charcoal-950/80 border border-charcoal-700 hover:border-terra-500 backdrop-blur"
                aria-label="Next"
              >→</button>
            </>
          )}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-charcoal-950/80 backdrop-blur text-xs text-charcoal-300 border border-charcoal-800">
            {active + 1} / {ride.gallery.length}
          </div>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-4 border-t border-charcoal-800">
          <div>
            <p className="text-sm text-charcoal-300 leading-relaxed">{ride.story}</p>
            <div className="flex gap-3 mt-4 overflow-x-auto scrollbar-none pb-1">
              {ride.gallery.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${i === active ? 'border-terra-500' : 'border-transparent hover:border-charcoal-700'}`}
                >
                  <img src={g} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div className="card p-4 text-center self-start">
            <div className="text-3xl font-display text-terra-400">{ride.riders}</div>
            <div className="text-[10px] text-charcoal-400 uppercase tracking-wider mt-1">Crew on the ride</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LastRidesGallery() {
  const [open, setOpen] = useState(null);

  return (
    <section className="container-x py-16 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <p className="eyebrow mb-2">LAST RIDES · CREW JOURNAL</p>
          <h2 className="section-title">SUCCESS STORIES <br /><span className="gradient-text">FROM THE ROAD.</span></h2>
        </div>
        <p className="text-sm text-charcoal-400 max-w-xs">Tap any ride to open the gallery and read the story.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {RIDES.map((r) => (
          <motion.button
            key={r.id}
            onClick={() => setOpen(r)}
            whileHover={{ y: -4 }}
            className="text-left card overflow-hidden hover:border-terra-500/50 transition group"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img src={r.cover} alt={r.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-[800ms]" />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/30 to-transparent" />
              <span className="absolute top-3 left-3 chip border-terra-500/40 text-terra-400 bg-charcoal-950/70">{r.date}</span>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="font-display text-xl sm:text-2xl leading-tight">{r.title}</h3>
                <p className="text-xs text-charcoal-300 mt-1">📍 {r.location}</p>
                <div className="flex items-center justify-between mt-3 text-[11px]">
                  <span className="text-charcoal-400">🖼 {r.gallery.length} photos · 👥 {r.riders}</span>
                  <span className="text-terra-400 font-semibold">Open →</span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open && <GalleryModal ride={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  );
}
