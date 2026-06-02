'use client';
import { useEffect, useState } from 'react';

export default function EventGallerySlider({ images = [], title }) {
  const [active, setActive] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e) => { if (e.key === 'Escape') setActive(null); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active]);

  if (!images || images.length === 0) return null;
  const heading = (title && title.trim()) || 'Moments from the trail';
  const loop = images.length < 6 ? [...images, ...images, ...images, ...images] : [...images, ...images];

  const download = async () => {
    if (active === null) return;
    const url = active;
    setDownloading(true);
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      const guessedName = url.split('/').pop()?.split('?')[0] || 'image';
      a.download = guessedName.includes('.') ? guessedName : `${guessedName}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

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
            <button
              type="button"
              key={`${src}-${i}`}
              onClick={() => setActive(src)}
              className="shrink-0 w-[260px] sm:w-[340px] md:w-[400px] h-[360px] sm:h-[460px] md:h-[540px] rounded-2xl overflow-hidden border border-charcoal-800 bg-charcoal-900 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-terra-400"
              aria-label={`Open image ${(i % images.length) + 1} in full screen`}
            >
              <img
                src={src}
                alt={`Gallery image ${(i % images.length) + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition duration-700"
                loading="lazy"
              />
            </button>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-charcoal-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-charcoal-950 to-transparent" />
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-[95vw] max-h-[80vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={active}
              alt="Full size gallery image"
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
          </div>

          <div
            className="mt-6 flex flex-col sm:flex-row gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={download}
              disabled={downloading}
              className="btn btn-gold h-11 px-6 inline-flex items-center justify-center gap-2"
            >
              {downloading ? 'Downloading...' : (
                <>
                  <span aria-hidden>⬇</span> Download
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActive(null)}
              className="btn btn-outline h-11 px-6"
            >
              Cancel
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

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
