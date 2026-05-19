'use client';
import Link from 'next/link';
import { useAdminStatsQuery, useListProductsQuery, useListEventsQuery, useListOrdersQuery, useListUsersQuery } from '@/store/api';

export default function AdminDashboard() {
  const { data: statsData, isLoading } = useAdminStatsQuery();
  const { data: prodData } = useListProductsQuery({ limit: 5, sort: '-createdAt' });
  const { data: eventData } = useListEventsQuery();
  const { data: ordersData } = useListOrdersQuery();
  const { data: usersData } = useListUsersQuery();

  const s = statsData?.stats || {};
  const lowStock = statsData?.lowStock || [];
  const recent = statsData?.recentOrders || [];
  const products = prodData?.products || [];
  const events = (eventData?.events || []).slice(0, 5);
  const orders = (ordersData?.orders || []).slice(0, 5);
  const users = (usersData?.users || []).slice(0, 5);

  const cards = [
    { label: 'Revenue', value: `₹${(s.revenue || 0).toLocaleString()}`, icon: '💰', tint: 'text-terra-400', href: '/admin/orders' },
    { label: 'Orders', value: s.orders || 0, icon: '🧾', href: '/admin/orders' },
    { label: 'Products', value: s.products || 0, icon: '📦', href: '/admin/products' },
    { label: 'Events', value: s.events || 0, icon: '🎪', href: '/admin/events' },
    { label: 'Registrations', value: s.registrations || 0, icon: '🎫', href: '/admin/registrations' },
    { label: 'Users', value: s.users || 0, icon: '👥', href: '/admin/users' },
  ];

  if (isLoading) {
    return <div className="text-charcoal-400 animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <p className="eyebrow mb-2">CONSOLE OVERVIEW</p>
        <h1 className="text-3xl sm:text-5xl font-display">Welcome back, Captain.</h1>
        <p className="text-charcoal-400 mt-1 text-sm">Here's everything happening across Angeles &amp; Roadsters.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card p-4 sm:p-5 hover:border-terra-500/40 transition group">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{c.icon}</span>
              <span className="text-terra-400 opacity-0 group-hover:opacity-100 transition text-sm">→</span>
            </div>
            <p className={`text-2xl sm:text-3xl font-display mt-3 ${c.tint || 'text-white'}`}>{c.value}</p>
            <p className="text-[11px] text-charcoal-400 uppercase tracking-wider mt-1">{c.label}</p>
          </Link>
        ))}
      </div>

      {/* Two-column primary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Recent Orders" link="/admin/orders" empty="No orders yet.">
          {recent.map((o) => (
            <Row key={o._id}
              left={<><div className="font-mono text-xs text-charcoal-500">#{o._id.slice(-6).toUpperCase()}</div><div className="font-semibold text-sm">{o.user?.name || 'Guest'}</div></>}
              right={<span className="text-terra-400 font-bold">₹{o.totalPrice?.toLocaleString()}</span>}
            />
          ))}
        </Section>

        <Section title="Low Stock Alerts" link="/admin/products" empty="All products stocked up.">
          {lowStock.map((p) => (
            <Row key={p._id}
              left={<div className="font-semibold text-sm">{p.name}</div>}
              right={<span className="badge bg-red-500/20 text-red-400 border border-red-500/30">{p.stock} left</span>}
            />
          ))}
        </Section>
      </div>

      {/* Latest entities — admin sees the whole app */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Latest Products" link="/admin/products" cta={<Link href="/admin/products/new" className="text-xs text-terra-400">+ New</Link>}>
          {products.map((p) => (
            <Row key={p._id}
              left={
                <div className="flex items-center gap-3 min-w-0">
                  <img src={p.thumbnail || p.images?.[0] || `https://picsum.photos/seed/${p._id}/60`} className="w-10 h-10 object-cover rounded-lg shrink-0" alt="" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-[11px] text-charcoal-500">Stock: {p.stock}</div>
                  </div>
                </div>
              }
              right={<span className="text-terra-400 text-sm font-bold">₹{(p.discountedPrice || p.price).toLocaleString()}</span>}
            />
          ))}
        </Section>

        <Section title="Upcoming Events" link="/admin/events" cta={<Link href="/admin/events/new" className="text-xs text-terra-400">+ New</Link>}>
          {events.map((e) => (
            <Row key={e._id}
              left={
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{e.title}</div>
                  <div className="text-[11px] text-charcoal-500 uppercase">{e.eventType} · {e.location?.city}</div>
                </div>
              }
              right={<span className="text-xs text-charcoal-300">{new Date(e.startDate).toLocaleDateString()}</span>}
            />
          ))}
        </Section>

        <Section title="Latest Users" link="/admin/users">
          {users.map((u) => (
            <Row key={u._id}
              left={
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-terra-500 to-gold-500 flex items-center justify-center font-bold text-charcoal-950 text-sm shrink-0">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{u.name}</div>
                    <div className="text-[11px] text-charcoal-500 truncate">{u.email}</div>
                  </div>
                </div>
              }
              right={<span className={`badge ${u.role === 'admin' ? 'bg-terra-500/20 text-terra-400' : 'bg-charcoal-800 text-charcoal-300'}`}>{u.role}</span>}
            />
          ))}
        </Section>

        <Section title="Activity Pulse" link="/admin/orders" empty="Quiet so far today.">
          {orders.map((o) => (
            <Row key={o._id}
              left={
                <div className="min-w-0">
                  <div className="text-sm">Order <span className="font-mono text-xs">#{o._id.slice(-6).toUpperCase()}</span></div>
                  <div className="text-[11px] text-charcoal-500">{new Date(o.createdAt).toLocaleString()}</div>
                </div>
              }
              right={<span className="badge bg-charcoal-800 text-charcoal-200 uppercase">{o.status}</span>}
            />
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, link, cta, children, empty = 'Nothing yet.' }) {
  const rows = Array.isArray(children) ? children : [children];
  const hasChildren = rows.filter(Boolean).length > 0;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-xl sm:text-2xl">{title}</h3>
        <div className="flex items-center gap-3">
          {cta}
          {link && <Link href={link} className="text-xs text-charcoal-400 hover:text-terra-400">View all →</Link>}
        </div>
      </div>
      {hasChildren ? (
        <div className="divide-y divide-charcoal-800">{children}</div>
      ) : (
        <p className="text-sm text-charcoal-500 py-2">{empty}</p>
      )}
    </div>
  );
}

function Row({ left, right }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0 flex-1">{left}</div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}
