'use client';

export default function EventGallerySlider({ images = [], title }) {
  if (!images || images.length === 0) return null;
  const heading = (title && title.trim()) || 'Moments from the trail';

  const loop = images.length < 6 ? [...images, ...images, ...images, ...images] : [...images, ...images];

  return (
    <section className="py-12 sm:py-16 bg-charcoal-950 border-y border-charcoal-800/60 overflow-hidden">
      <div className="container-x mb-6 sm:mb-8">
        <p className="eyebrow mb-2">EVENT GALLERY</p>
        <h2 className="section-title">{heading}</h2>
      </div>

      <div
        className="relative gallery-marquee"
        style={{ ['--gallery-duration']: `${Math.max(20, loop.length * 4)}s` }}
      >
        <div className="gallery-track flex gap-4 sm:gap-5 w-max">
          {loop.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="shrink-0 w-[260px] sm:w-[340px] md:w-[400px] h-[360px] sm:h-[460px] md:h-[540px] rounded-2xl overflow-hidden border border-charcoal-800 bg-charcoal-900"
            >
              <img
                src={src}
                alt={`Gallery image ${(i % images.length) + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition duration-700"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-charcoal-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-charcoal-950 to-transparent" />
      </div>

      <style jsx>{`
        .gallery-marquee {
          mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
        }
        .gallery-track {
          animation: gallery-scroll var(--gallery-duration, 40s) linear infinite;
        }
        .gallery-marquee:hover .gallery-track {
          animation-play-state: paused;
        }
        @keyframes gallery-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .gallery-track { animation: none; }
        }
      `}</style>
    </section>
  );
}
