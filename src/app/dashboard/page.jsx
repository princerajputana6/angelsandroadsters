'use client';
import { useMeQuery, useMyOrdersQuery, useMyRegistrationsQuery } from '@/store/api';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: me } = useMeQuery();
  const { data: ordersData } = useMyOrdersQuery();
  const { data: regsData } = useMyRegistrationsQuery();
  const user = me?.user;
  const orders = ordersData?.orders || [];
  const regs = regsData?.registrations || [];

  if (!user) {
    return (
      <div className="card p-10 text-center">
        <p className="text-charcoal-300">Please log in.</p>
        <Link href="/login" className="btn btn-primary mt-4">Login</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display">Hi, {user.name?.split(' ')[0]}</h1>
        <p className="text-charcoal-400">{user.email}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/orders" className="card p-5 hover:border-terra-500">
          <p className="text-charcoal-400">Orders</p>
          <p className="text-4xl font-display text-terra-400">{orders.length}</p>
        </Link>
        <Link href="/dashboard/registrations" className="card p-5 hover:border-terra-500">
          <p className="text-charcoal-400">Event Tickets</p>
          <p className="text-4xl font-display text-terra-400">{regs.length}</p>
        </Link>
        <div className="card p-5">
          <p className="text-charcoal-400">Wishlist</p>
          <p className="text-4xl font-display text-terra-400">{user.wishlist?.length || 0}</p>
        </div>
      </div>
    </div>
  );
}
