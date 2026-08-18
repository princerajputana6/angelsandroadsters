'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMeQuery, useLogoutMutation } from '@/store/api';
import { selectCartCount } from '@/store/cartSlice';
import toast from 'react-hot-toast';
import BrandMark from './BrandMark';

const TRAILSTORM_HREF = '/trailstorm/2026-jaisalmer-trailstorm-event';
const NAV = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  // Affiliate is admin-onboarded for now — self-service join link hidden.
  // { href: '/affiliate/join', label: 'Join Affiliate' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data } = useMeQuery();
  const [logout] = useLogoutMutation();
  const cartCount = useSelector(selectCartCount);
  const user = data?.user;

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 12);
    h();
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => { setMenu(false); setOpen(false); }, [pathname]);

  const onLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/');
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-charcoal-950/85 backdrop-blur-xl border-b border-charcoal-800/70' : 'bg-transparent'
      }`}>
        <div className="container-x flex items-center justify-between h-16 sm:h-20">
          <BrandMark size="md" />

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`relative px-4 py-2 text-sm font-medium transition ${
                    active ? 'text-terra-400' : 'text-charcoal-100 hover:text-white'
                  }`}
                >
                  {n.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-3 right-3 -bottom-0.5 h-[2px] bg-terra-500 rounded-full"
                    />
                  )}
                </Link>
              );
            })}
            <Link href={TRAILSTORM_HREF} className="btn btn-gold text-sm h-9 px-5 ml-2">
              Trailstorm
            </Link>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/cart" className="relative w-10 h-10 rounded-full border border-charcoal-800 hover:border-terra-500 flex items-center justify-center transition">
              <span className="text-base">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-terra-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 h-10 rounded-full border border-charcoal-800 hover:border-terra-500 text-sm font-medium transition"
                >
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-terra-500 to-gold-500 flex items-center justify-center text-xs font-bold text-charcoal-950">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <span className="max-w-[80px] truncate">{user.name?.split(' ')[0]}</span>
                </button>
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute right-0 top-12 w-56 card-glass p-2 shadow-elev"
                    >
                      <div className="px-3 py-2 border-b border-white/10 mb-1">
                        <div className="text-sm font-semibold">{user.name}</div>
                        <div className="text-[11px] text-charcoal-400 truncate">{user.email}</div>
                      </div>
                      {[
                        ['/dashboard', '📊', 'Dashboard'],
                        ['/dashboard/orders', '🧾', 'My Orders'],
                        ['/dashboard/registrations', '🎫', 'My Tickets'],
                      ].map(([h, i, l]) => (
                        <Link key={h} href={h} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-sm">
                          <span>{i}</span><span>{l}</span>
                        </Link>
                      ))}
                      {user.role === 'admin' && (
                        <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-terra-500/10 text-sm text-terra-400 font-semibold">
                          <span>⚙️</span><span>Admin Panel</span>
                        </Link>
                      )}
                      <button onClick={onLogout} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-red-400">
                        <span>↪</span><span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="hidden sm:block btn btn-ghost text-sm h-10">Sign In</Link>
            )}

            <button
              onClick={() => setMenu(true)}
              className="lg:hidden w-10 h-10 rounded-full border border-charcoal-800 flex items-center justify-center"
              aria-label="Menu"
            >
              <span className="block w-4 h-[2px] bg-white relative before:absolute before:content-[''] before:w-4 before:h-[2px] before:bg-white before:-top-1.5 before:left-0 after:absolute after:content-[''] after:w-3 after:h-[2px] after:bg-white after:top-1.5 after:left-0" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menu && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenu(false)}
              className="fixed inset-0 z-[60] bg-charcoal-950/80 backdrop-blur lg:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-charcoal-950 border-l border-charcoal-800 z-[70] lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-charcoal-800">
                <BrandMark size="sm" href={null} />
                <button onClick={() => setMenu(false)} className="w-10 h-10 rounded-full border border-charcoal-800 text-xl">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {NAV.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      pathname === n.href ? 'bg-terra-500/15 text-terra-400 border border-terra-500/30' : 'hover:bg-charcoal-900'
                    }`}
                  >
                    <span className="font-display text-2xl">{n.label}</span>
                    <span>→</span>
                  </Link>
                ))}

                <div className="border-t border-charcoal-800 my-3 pt-3 space-y-1">
                  {user ? (
                    <>
                      <div className="p-3">
                        <div className="text-sm font-semibold">{user.name}</div>
                        <div className="text-xs text-charcoal-400 truncate">{user.email}</div>
                      </div>
                      <Link href="/dashboard" className="block p-3 rounded-xl hover:bg-charcoal-900">📊 Dashboard</Link>
                      <Link href="/dashboard/orders" className="block p-3 rounded-xl hover:bg-charcoal-900">🧾 My Orders</Link>
                      <Link href="/dashboard/registrations" className="block p-3 rounded-xl hover:bg-charcoal-900">🎫 My Tickets</Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" className="block p-3 rounded-xl text-terra-400 font-semibold hover:bg-terra-500/10">⚙️ Admin Panel</Link>
                      )}
                      <button onClick={onLogout} className="w-full text-left p-3 rounded-xl text-red-400 hover:bg-white/5">↪ Logout</button>
                    </>
                  ) : (
                    <div className="space-y-2 p-2">
                      <Link href="/login" className="btn btn-outline w-full">Sign In</Link>
                      <Link href={TRAILSTORM_HREF} className="btn btn-gold w-full">🏜 Join Trailstorm</Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
