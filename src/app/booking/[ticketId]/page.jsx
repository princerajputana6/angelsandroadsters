'use client';
import { useParams } from 'next/navigation';
import { useGetRegistrationByTicketQuery } from '@/store/api';
import Link from 'next/link';

export default function BookingDetailsPage() {
  const { ticketId } = useParams();
  const { data, isLoading, error } = useGetRegistrationByTicketQuery(ticketId);
  const booking = data?.registration;

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

        {/* QR Code */}
        {booking.qrCode && (
          <div className="card p-6 mb-6 text-center">
            <div className="bg-white p-4 inline-block rounded-xl">
              <img src={booking.qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
            <p className="text-xs text-charcoal-500 mt-3">Scan this QR code at the event</p>
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
              {booking.experienceLevel && (
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Experience:</span>
                  <span className="font-semibold capitalize">{booking.experienceLevel}</span>
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
          <Link href="/dashboard/registrations" className="btn btn-gold flex-1">View All My Bookings</Link>
          <Link href="/" className="btn btn-outline flex-1">Go Home</Link>
        </div>
      </div>
    </div>
  );
}
