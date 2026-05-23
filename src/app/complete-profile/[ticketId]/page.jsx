'use client';
import { useParams, useRouter } from 'next/navigation';
import { useGetRegistrationByTicketQuery, useMeQuery } from '@/store/api';
import { useEffect } from 'react';
import Link from 'next/link';
import IndividualProfileForm from '@/components/profile/IndividualProfileForm';
import GroupProfileForm from '@/components/profile/GroupProfileForm';

export default function CompleteProfilePage() {
  const { ticketId } = useParams();
  const router = useRouter();
  const { data: userData, isLoading: userLoading } = useMeQuery();
  const { data, isLoading, error } = useGetRegistrationByTicketQuery(ticketId);
  const registration = data?.registration;

  useEffect(() => {
    // If not logged in, redirect to login with message
    if (!userLoading && !userData?.user) {
      router.push(`/login?redirect=/complete-profile/${ticketId}&message=Please login with your primary email used during booking`);
    }
  }, [userData, userLoading, router, ticketId]);

  if (isLoading || userLoading) {
    return (
      <div className="min-h-screen pt-32 pb-20">
        <div className="container-x text-center">
          <div className="text-charcoal-300">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen pt-32 pb-20">
        <div className="container-x text-center max-w-2xl mx-auto">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="section-title mb-3">Registration Not Found</h1>
          <p className="text-charcoal-400 mb-6">
            We couldn't find a registration with ticket ID: <span className="text-terra-400 font-mono">{ticketId}</span>
          </p>
          <Link href="/dashboard/registrations" className="btn btn-gold">View My Tickets</Link>
        </div>
      </div>
    );
  }

  // Check if user has access
  const userEmail = userData?.user?.email;
  const hasAccess = userEmail === registration.email || 
    registration.members?.some(m => m.email === userEmail);

  if (!hasAccess) {
    return (
      <div className="min-h-screen pt-32 pb-20">
        <div className="container-x text-center max-w-2xl mx-auto">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="section-title mb-3">Access Denied</h1>
          <p className="text-charcoal-400 mb-6">
            Please login with the email address you used during booking.
          </p>
          <Link href="/login" className="btn btn-gold">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container-x max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="section-title mb-2">Complete Your Profile</h1>
          <p className="text-charcoal-400">Ticket ID: <span className="text-terra-400 font-mono">{ticketId}</span></p>
          <p className="text-charcoal-400 mt-2">{registration.event?.title}</p>
          <div className="mt-4 flex justify-center">
            <Link
              href={`/help?bookingTicketId=${ticketId}`}
              className="inline-flex items-center gap-2 text-sm text-charcoal-400 hover:text-terra-400 border border-charcoal-700 hover:border-terra-500/40 px-4 py-2 rounded-xl transition"
            >
              🆘 Need help? Contact Support
            </Link>
          </div>
        </div>

        {(registration.registrationType === 'individual' || registration.registrationType === 'visitor') && (
          <IndividualProfileForm registration={registration} />
        )}

        {registration.registrationType === 'group' && (
          <GroupProfileForm registration={registration} userEmail={userEmail} />
        )}
      </div>
    </div>
  );
}
