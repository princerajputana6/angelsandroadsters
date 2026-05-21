import Link from 'next/link';
import BrandMark from './BrandMark';
import NewsletterForm from './NewsletterForm';

export default function Footer() {
  return (
    <footer className="relative bg-charcoal-950 border-t border-charcoal-800/50 mt-24">
      <div className="absolute inset-x-0 top-0 h-px shimmer-line" />

      <div className="container-x py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5 space-y-5">
          <BrandMark size="lg" />
          <p className="text-sm text-charcoal-400 max-w-md">
            Crafted riding & travel gear, hand-picked rallies, treks, and expos.
            Built for the ones who measure life in miles, not minutes.
          </p>

          <NewsletterForm />

          <div className="flex items-center gap-3 pt-2">
            {[
              { label: 'Instagram', href: 'https://www.instagram.com/angelsandroadsters' },
              { label: 'YouTube', href: 'https://www.youtube.com/@angelsandroadsters' },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="chip hover:border-terra-500 hover:text-terra-400 transition"
              >{s.label}</a>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <h4 className="text-xs font-bold tracking-[0.25em] text-charcoal-500 uppercase mb-4">Shop</h4>
          <ul className="space-y-2.5 text-sm text-charcoal-300">
            <li><Link href="/shop" className="hover:text-terra-400">All Gear</Link></li>
            <li><Link href="/shop?q=helmet" className="hover:text-terra-400">Helmets</Link></li>
            <li><Link href="/shop?q=jacket" className="hover:text-terra-400">Jackets</Link></li>
            <li><Link href="/shop?featured=true" className="hover:text-terra-400">New Drops</Link></li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <h4 className="text-xs font-bold tracking-[0.25em] text-charcoal-500 uppercase mb-4">Events</h4>
          <ul className="space-y-2.5 text-sm text-charcoal-300">
            <li><Link href="/events" className="hover:text-terra-400">All Events</Link></li>
            <li><Link href="/events?type=rally" className="hover:text-terra-400">Rallies</Link></li>
            <li><Link href="/events?type=trek" className="hover:text-terra-400">Treks</Link></li>
            <li><Link href="/events?type=expo" className="hover:text-terra-400">Expos</Link></li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <h4 className="text-xs font-bold tracking-[0.25em] text-charcoal-500 uppercase mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm text-charcoal-300">
            <li><Link href="/about" className="hover:text-terra-400">About</Link></li>
            <li><Link href="/contact" className="hover:text-terra-400">Contact</Link></li>
            <li><Link href="/liability-waiver" className="hover:text-terra-400">Liability Waiver</Link></li>
            <li><Link href="/dashboard" className="hover:text-terra-400">My Account</Link></li>
            <li className="text-charcoal-500 text-xs pt-2">info@angelsandroadsters.com</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-charcoal-800/60">
        <div className="container-x py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-charcoal-500">
          <div>© {new Date().getFullYear()} Angels & Roadsters — all rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-terra-400">Privacy</Link>
            <Link href="#" className="hover:text-terra-400">Terms</Link>
            <Link href="#" className="hover:text-terra-400">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
