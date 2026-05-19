'use client';
import AdminSidebar from '@/components/admin/Sidebar';
import { useMeQuery } from '@/store/api';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const { data, isLoading } = useMeQuery();
  const user = data?.user;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-charcoal-400">Loading admin console...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card-glass p-8 text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-3xl font-display">Sign in required</h2>
          <p className="text-charcoal-400 my-3 text-sm">Please sign in as an admin to access the console.</p>
          <Link href="/login?next=/admin" className="btn btn-gold">Sign In</Link>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card-glass p-8 text-center max-w-md">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-3xl font-display">Admin only</h2>
          <p className="text-charcoal-400 my-3 text-sm">
            You're signed in as <span className="text-terra-400">{user.email}</span>.
            Admin role required to access this console.
          </p>
          <Link href="/" className="btn btn-outline">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24">
        {children}
      </main>
    </div>
  );
}
