'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import BrandMark from '../common/BrandMark';
import { useLogoutMutation, useMeQuery } from '@/store/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/products', label: 'Products', icon: '📦' },
  { href: '/admin/categories', label: 'Categories', icon: '🗂' },
  { href: '/admin/companies', label: 'Companies', icon: '🤝' },
  { href: '/admin/orders', label: 'Orders', icon: '🧾' },
  { href: '/admin/events', label: 'Events', icon: '🎪' },
  { href: '/admin/registrations', label: 'Registrations', icon: '🎫' },
  { href: '/admin/team-passes', label: 'Team Passes', icon: '🪪' },
  { href: '/admin/trailstorm', label: 'Trailstorm · FOC', icon: '🏜' },
  { href: '/admin/resorts', label: 'Resorts', icon: '🏨' },
  { href: '/admin/resort-bookings', label: 'Resort Bookings', icon: '🛎' },
  { href: '/admin/blogs', label: 'Blogs', icon: '📝' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/coupons', label: 'Coupons', icon: '🎟' },
  { href: '/admin/support', label: 'Support Tickets', icon: '🆘' },
];

function NavList({ pathname }) {
  return (
    <nav className="space-y-1">
      {NAV.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
              active ? 'bg-terra-500/15 text-terra-400 border border-terra-500/40' : 'text-charcoal-200 hover:bg-white/5'
            }`}
          >
            <span className="text-lg">{n.icon}</span>
            <span className="text-sm font-medium">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useMeQuery();
  const [logout] = useLogoutMutation();
  const [open, setOpen] = useState(false);
  const user = data?.user;

  const doLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/');
  };

  return (
    <>
      {/* Mobile topbar */}
      <header className="lg:hidden sticky top-0 z-40 bg-charcoal-950/90 backdrop-blur border-b border-charcoal-800 h-14 flex items-center justify-between px-4">
        <button onClick={() => setOpen(true)} className="w-10 h-10 rounded-full border border-charcoal-800 flex items-center justify-center">☰</button>
        <BrandMark size="sm" href="/admin" />
        <Link href="/" className="w-10 h-10 rounded-full border border-charcoal-800 flex items-center justify-center text-sm">↩</Link>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-charcoal-950 border-r border-charcoal-800/70 min-h-screen flex-col">
        <div className="p-5 border-b border-charcoal-800/70">
          <BrandMark size="sm" />
          <p className="text-[10px] text-charcoal-500 mt-2 tracking-widest uppercase">Admin Console</p>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <NavList pathname={pathname} />
        </div>
        <div className="p-4 border-t border-charcoal-800/70 space-y-2">
          {user && (
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-terra-500 to-gold-500 flex items-center justify-center font-bold text-charcoal-950 text-sm">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{user.name}</div>
                <div className="text-[10px] text-charcoal-500 truncate">{user.email}</div>
              </div>
            </div>
          )}
          <Link href="/" className="block text-xs text-charcoal-400 hover:text-terra-400 px-2 py-1">← Back to store</Link>
          <button onClick={doLogout} className="block text-xs text-red-400 hover:text-red-300 px-2 py-1 text-left w-full">Logout</button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-charcoal-950/80 backdrop-blur lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-xs bg-charcoal-950 border-r border-charcoal-800 z-[70] lg:hidden flex flex-col"
            >
              <div className="p-5 flex justify-between items-center border-b border-charcoal-800">
                <BrandMark size="sm" href="/admin" />
                <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-full border border-charcoal-800">✕</button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto" onClick={() => setOpen(false)}>
                <NavList pathname={pathname} />
              </div>
              <div className="p-4 border-t border-charcoal-800 space-y-2">
                <Link href="/" className="block text-xs text-charcoal-400 px-2 py-1">← Back to store</Link>
                <button onClick={doLogout} className="block text-xs text-red-400 px-2 py-1 text-left w-full">Logout</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
