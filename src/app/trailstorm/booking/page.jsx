'use client';
import Link from 'next/link';
import { useMeQuery } from '@/store/api';
import ResortBookingWizard from '@/components/resorts/ResortBookingWizard';

export default function TrailstormBookingPage() {
  const { data, isLoading } = useMeQuery();
  const user = data?.user;

  return (
    <div className="container-x pt-28 sm:pt-32 pb-20">
      <div className="text-center mb-10">
        <p className="eyebrow mb-2">TRAILSTORM · STAYS</p>
        <h1 className="section-title">BOOK YOUR RESORT</h1>
        <p className="text-charcoal-400 mt-3 max-w-xl mx-auto">
          Pick your resort, choose a room and lock your stay for the festival. Secure payment, instant confirmation.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center text-charcoal-400 text-sm">Loading…</div>
      ) : !user ? (
        <div className="card-glass p-8 text-center max-w-sm mx-auto">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-display">Sign in to book</h2>
          <p className="text-charcoal-400 my-3 text-sm">
            You need an account to book a resort room and track your booking.
          </p>
          <Link href="/login?next=/trailstorm/booking" className="btn btn-gold">Sign In</Link>
        </div>
      ) : (
        <ResortBookingWizard />
      )}
    </div>
  );
}
