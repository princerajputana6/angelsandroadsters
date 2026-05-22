'use client';
import { useParams } from 'next/navigation';
import { useGetRegistrationByTicketQuery } from '@/store/api';
import Link from 'next/link';

export default function BookingDetailsPage() {
  const { ticketId } = useParams();
  const { data, isLoading, error } = useGetRegistrationByTicketQuery(ticketId);
  const booking = data?.registration;

  const isProfileComplete = () => {
    if (!booking) return false;
    if (booking.registrationType === 'individual' || booking.registrationType === 'visitor') {
      return booking.profileCompleted === true;
    }
    if (booking.registrationType === 'group') {
      return booking.members?.every(m => m.profileCompleted === true);
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-20">
        <div className="container-x text-center">
          <div className="text-charcoal-300">Loading booking details...</div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen pt-32 pb-20">
        <div className="container-x text-center max-w-2xl mx-auto">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="section-title mb-3">Booking Not Found</h1>
          <p className="text-charcoal-400 mb-6">
            We couldn't find a booking with ticket ID: <span className="text-terra-400 font-mono">{ticketId}</span>
          </p>
          <Link href="/" className="btn btn-gold">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container-x max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-terra-500 text-3xl mb-4">✓</div>
          <h1 className="section-title mb-2">Booking Confirmed</h1>
          <p className="text-charcoal-400">Ticket ID: <span className="text-terra-400 font-mono font-bold">{booking.ticketId}</span></p>
        </div>

        {/* QR Code - Only show when profile is complete */}
        {isProfileComplete() && booking.qrCode && (
          <div className="card p-6 mb-6 text-center bg-green-500/10 border-2 border-green-500/30">
            <div className="text-2xl mb-3">🎉</div>
            <h3 className="font-display text-xl mb-4 text-green-400">Your Event Pass is Ready!</h3>
            <div className="bg-white p-4 inline-block rounded-xl mb-4">
              <img src={booking.qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
            <p className="text-sm text-charcoal-400 mb-2">Scan this QR code at the event entrance</p>
            <p className="text-xs text-charcoal-500">Keep this QR code safe and accessible on your phone</p>
          </div>
        )}

        {/* Profile Incomplete - Prominent Call to Action */}
        {!isProfileComplete() && (
          <div className="card p-8 mb-6 text-center bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/40">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="font-display text-2xl mb-3 text-yellow-400">Complete Your Profile to Access QR Code</h3>
            <p className="text-charcoal-300 mb-6 max-w-md mx-auto">
              Your booking is confirmed, but you need to complete your profile to receive your event pass and QR code for entry.
            </p>
            
            {booking.registrationType === 'group' && (
              <div className="bg-charcoal-900/50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-terra-400 mb-2">Group Profile Status</h4>
                <div className="text-sm text-charcoal-300">
                  {booking.members?.filter(m => m.profileCompleted).length || 0} of {booking.members?.length || 0} members completed
                </div>
                <div className="w-full bg-charcoal-800 rounded-full h-2 mt-2">
                  <div 
                    className="bg-terra-500 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${((booking.members?.filter(m => m.profileCompleted).length || 0) / (booking.members?.length || 1)) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}
            
            <Link href={`/complete-profile/${booking.ticketId}`} className="btn btn-gold text-lg px-8 py-3 inline-block">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Complete Profile Now
              </span>
            </Link>
            
            <p className="text-xs text-charcoal-500 mt-4">
              This will only take a few minutes and is required for event entry
            </p>
          </div>
        )}

        {/* Event Details */}
        <div className="card p-6 mb-6">
          <h2 className="font-display text-2xl mb-4">Event Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal-400">Event:</span>
              <span className="font-semibold text-right">{booking.event?.title || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-400">Location:</span>
              <span className="font-semibold">{booking.event?.location?.city}, {booking.event?.location?.state}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-400">Dates:</span>
              <span className="font-semibold">
                {booking.event?.startDate && new Date(booking.event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {booking.event?.endDate && ` - ${new Date(booking.event.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-400">Registration Type:</span>
              <span className="font-semibold capitalize">{booking.registrationType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-400">Status:</span>
              <span className={`font-semibold capitalize ${booking.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}`}>
                {booking.status}
              </span>
            </div>
          </div>
        </div>

        {/* Participant Details */}
        {booking.registrationType === 'individual' && (
          <div className="card p-6 mb-6">
            <h2 className="font-display text-2xl mb-4">Participant Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal-400">Name:</span>
                <span className="font-semibold">{booking.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-400">Email:</span>
                <span className="font-semibold text-right break-all">{booking.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-400">Phone:</span>
                <span className="font-semibold">{booking.phone}</span>
              </div>
              {booking.age && (
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Age:</span>
                  <span className="font-semibold">{booking.age}</span>
                </div>
              )}
              {booking.bikeDetails && (
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Bike:</span>
                  <span className="font-semibold text-right">{booking.bikeDetails}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visitor Details */}
        {booking.registrationType === 'visitor' && (
          <div className="card p-6 mb-6">
            <h2 className="font-display text-2xl mb-4">Visitor Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal-400">Name:</span>
                <span className="font-semibold">{booking.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-400">Email:</span>
                <span className="font-semibold text-right break-all">{booking.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-400">Phone:</span>
                <span className="font-semibold">{booking.phone}</span>
              </div>
              {booking.visitorCount && (
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Number of Tickets:</span>
                  <span className="font-semibold">{booking.visitorCount}</span>
                </div>
              )}
              {booking.visitDate && (
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Visit Date:</span>
                  <span className="font-semibold">{new Date(booking.visitDate).toLocaleDateString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Group Details */}
        {booking.registrationType === 'group' && (
          <div className="card p-6 mb-6">
            <h2 className="font-display text-2xl mb-4">Group Details</h2>
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-charcoal-400">Group Name:</span>
                <span className="font-semibold">{booking.groupName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-400">Total Members:</span>
                <span className="font-semibold">{booking.groupSize || booking.members?.length || 0}</span>
              </div>
            </div>
            
            {booking.members && booking.members.length > 0 && (
              <div>
                <div className="text-xs font-bold text-terra-400 uppercase tracking-wider mb-3">All Members</div>
                <div className="space-y-3">
                  {booking.members.map((member, i) => (
                    <div key={i} className="card border-charcoal-800/70 p-3">
                      <div className="text-xs font-semibold text-charcoal-300 mb-2">Member {i + 1}</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-charcoal-400">Name:</span>
                          <span className="font-semibold">{member.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-charcoal-400">Email:</span>
                          <span className="font-semibold text-right break-all">{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex justify-between">
                            <span className="text-charcoal-400">Phone:</span>
                            <span className="font-semibold">{member.phone}</span>
                          </div>
                        )}
                        {member.bikeDetails && (
                          <div className="flex justify-between">
                            <span className="text-charcoal-400">Bike:</span>
                            <span className="font-semibold text-right">{member.bikeDetails}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Details */}
        <div className="card p-6 mb-6">
          <h2 className="font-display text-2xl mb-4">Payment Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal-400">Amount Paid:</span>
              <span className="font-bold text-terra-400 text-lg">
                {booking.amount > 0 ? `₹${booking.amount.toLocaleString()}` : 'Free'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-400">Payment Status:</span>
              <span className={`font-semibold capitalize ${booking.paymentStatus === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                {booking.paymentStatus || 'Pending'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-400">Booked On:</span>
              <span className="font-semibold">
                {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!isProfileComplete() && (
            <Link href={`/complete-profile/${booking.ticketId}`} className="btn btn-gold flex-1">
              Complete Profile First
            </Link>
          )}
          <Link href="/dashboard/registrations" className="btn btn-outline flex-1">View All My Bookings</Link>
          <Link href="/" className="btn btn-outline flex-1">Go Home</Link>
        </div>
      </div>
    </div>
  );
}
