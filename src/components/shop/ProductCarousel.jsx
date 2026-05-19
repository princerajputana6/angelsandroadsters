'use client';
import { useRef } from 'react';
import ProductCard from './ProductCard';

export default function ProductCarousel({ products = [], eyebrow, title, subtitle, viewAllHref }) {
  const scroller = useRef(null);

  const scroll = (dir) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: 'smooth' });
  };

  if (!products.length) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="container-x">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
            <h2 className="section-title">{title}</h2>
            {subtitle && <p className="text-charcoal-400 mt-2 max-w-xl text-sm sm:text-base">{subtitle}</p>}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => scroll(-1)} className="w-11 h-11 rounded-full border border-charcoal-800 hover:border-terra-500 hover:text-terra-400 transition">←</button>
            <button onClick={() => scroll(1)} className="w-11 h-11 rounded-full border border-charcoal-800 hover:border-terra-500 hover:text-terra-400 transition">→</button>
          </div>
        </div>

        <div
          ref={scroller}
          className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
        >
          {products.map((p) => (
            <div key={p._id} className="snap-start shrink-0 w-[70%] sm:w-[40%] md:w-[30%] lg:w-[23%]">
              <ProductCard product={p} />
            </div>
          ))}
        </div>

        {viewAllHref && (
          <div className="text-center mt-8">
            <a href={viewAllHref} className="btn btn-outline">View All →</a>
          </div>
        )}
      </div>
    </section>
  );
}
