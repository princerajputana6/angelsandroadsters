'use client';

export default function BrandsSlider({ logos = [], title }) {
  if (!logos || logos.length === 0) return null;
  const heading = (title && title.trim()) || 'Our partners & brands';

  const loop = logos.length < 8 ? [...logos, ...logos, ...logos, ...logos] : [...logos, ...logos];

  return (
    <section className="py-12 sm:py-16 bg-charcoal-900 border-b border-charcoal-800/60 overflow-hidden">
      <div className="container-x mb-6 sm:mb-8">
        <p className="eyebrow mb-2">BRANDS &amp; PARTNERS</p>
        <h2 className="section-title">{heading}</h2>
      </div>

      <div
        className="relative brands-marquee"
        style={{ ['--brands-duration']: `${Math.max(20, loop.length * 3)}s` }}
      >
        <div className="brands-track flex gap-6 sm:gap-10 w-max items-center">
          {loop.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="shrink-0 w-[140px] sm:w-[180px] md:w-[200px] h-[80px] sm:h-[100px] md:h-[110px] rounded-xl bg-white/5 border border-charcoal-800 flex items-center justify-center px-4"
            >
              <img
                src={src}
                alt={`Brand ${(i % logos.length) + 1}`}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-charcoal-900 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-charcoal-900 to-transparent" />
      </div>

      <style jsx>{`
        .brands-marquee {
          mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
        }
        .brands-track {
          animation: brands-scroll var(--brands-duration, 30s) linear infinite;
        }
        .brands-marquee:hover .brands-track {
          animation-play-state: paused;
        }
        @keyframes brands-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .brands-track { animation: none; }
        }
      `}</style>
    </section>
  );
}
