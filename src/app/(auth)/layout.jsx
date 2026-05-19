import Link from 'next/link';
import BrandMark from '@/components/common/BrandMark';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-charcoal-950">
      <div className="hidden lg:block relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1600" alt="" className="absolute inset-0 w-full h-full object-cover scale-110" />
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal-950/70 via-charcoal-950/50 to-charcoal-950/90" />
        <div className="absolute inset-0 p-12 flex flex-col justify-between">
          <BrandMark size="lg" />
          <div className="max-w-md">
            <p className="eyebrow mb-3">Join the crew</p>
            <h2 className="text-5xl font-display leading-[0.95]">
              EVERY ROUTE TELLS A STORY. <span className="gradient-text">WRITE YOURS.</span>
            </h2>
            <p className="text-charcoal-200 mt-4">Exclusive drops, early event access, member-only routes.</p>
            <div className="flex gap-6 mt-8 text-sm">
              <div><div className="text-2xl font-display text-terra-400">12K+</div><div className="text-xs text-charcoal-400">Riders</div></div>
              <div><div className="text-2xl font-display text-terra-400">200+</div><div className="text-xs text-charcoal-400">Events</div></div>
              <div><div className="text-2xl font-display text-terra-400">4.9★</div><div className="text-xs text-charcoal-400">Avg rating</div></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute top-6 left-6 lg:hidden">
          <BrandMark size="sm" />
        </div>
        {children}
      </div>
    </div>
  );
}
