'use client';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/orders', label: 'My Orders', icon: '🧾' },
  { href: '/dashboard/registrations', label: 'My Tickets', icon: '🎫' },
  { href: '/dashboard/support', label: 'Help & Support', icon: '🆘' },
];

export default function DashLayout({ children }) {
  const pathname = usePathname();
  return (
    <>
      <Navbar />
      <div className="container-x pt-28 sm:pt-32 pb-10 min-h-[80vh]">
        {/* Mobile horizontal nav */}
        <div className="lg:hidden flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-2 mb-5">
          {items.map((it) => {
            const active = pathname === it.href;
            return (
              <Link key={it.href} href={it.href} className={`shrink-0 chip whitespace-nowrap ${active ? 'border-terra-500 text-terra-400' : ''}`}>
                <span>{it.icon}</span><span>{it.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          <aside className="hidden lg:block">
            <div className="card-glass p-4 space-y-1 sticky top-24">
              <h3 className="font-display text-xl mb-2 px-3">Dashboard</h3>
              {items.map((it) => {
                const active = pathname === it.href;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                      active ? 'bg-terra-500/15 text-terra-400 border border-terra-500/30' : 'hover:bg-white/5'
                    }`}
                  >
                    <span>{it.icon}</span><span>{it.label}</span>
                  </Link>
                );
              })}
            </div>
          </aside>
          <div>{children}</div>
        </div>
      </div>
      <Footer />
    </>
  );
}
