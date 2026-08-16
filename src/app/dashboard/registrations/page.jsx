'use client';
import { useMyRegistrationsQuery } from '@/store/api';
import Link from 'next/link';

export default function MyRegistrationsPage() {
  const { data, isLoading } = useMyRegistrationsQuery();
  const regs = data?.registrations || [];

  if (isLoading) return <p className="text-charcoal-400">Loading...</p>;
  if (regs.length === 0) return <p className="text-charcoal-400">No event registrations yet.</p>;

  const isProfileComplete = (reg) => {
    if (reg.registrationType === 'individual' || reg.registrationType === 'visitor') {
      return reg.profileCompleted === true;
    }
    if (reg.registrationType === 'group') {
      return reg.members?.every(m => m.profileCompleted === true);
    }
    return false;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-display">My Event Tickets</h1>
      {regs.map((r) => {
        const profileComplete = isProfileComplete(r);
        
        return (
          <div key={r._id} className="card p-5">
            <div className="flex flex-wrap items-start gap-5">
              <div className="flex-1 min-w-[220px]">
                <p className="text-xs text-terra-400 uppercase">{r.registrationType} · {r.status}</p>
                <h3 className="font-display text-2xl">{r.event?.title}</h3>
                <p className="text-sm text-charcoal-300 mt-1">
                  📅 {r.event?.startDate ? new Date(r.event.startDate).toDateString() : ''}
                </p>
                <p className="text-sm text-charcoal-300">📍 {r.event?.location?.city}, {r.event?.location?.state}</p>
                <p className="mt-2 font-mono text-sm text-terra-400">
                  {r.registrationType === 'group' ? 'Group ID' : 'Registration ID'}: {r.ticketId}
                </p>

                {r.registrationType === 'group' && r.members?.length > 0 && (
                  <div className="mt-3 rounded-lg border border-charcoal-700 p-3">
                    <p className="text-xs text-charcoal-400 mb-2">
                      Member registration IDs — each member uses their own when booking a resort:
                    </p>
                    <ul className="space-y-1">
                      {r.members.map((m, i) => (
                        <li key={m.registrationId || i} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="text-charcoal-200">{m.name || `Member ${i + 1}`}</span>
                          <span className="font-mono text-terra-400">{m.registrationId || '—'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!profileComplete && (
                  <p className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Profile incomplete</span>
                  </p>
                )}
              </div>
              
              {profileComplete && r.qrCode && (
                <div className="bg-white p-2 rounded">
                  <img src={r.qrCode} alt="QR" className="w-32 h-32" />
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3 mt-4">
              <Link 
                href={`/booking/${r.ticketId}`} 
                className="btn btn-outline text-sm py-2 px-4"
              >
                View Details
              </Link>
              
              {!profileComplete && (
                <Link 
                  href={`/complete-profile/${r.ticketId}`} 
                  className="btn btn-gold text-sm py-2 px-4"
                >
                  Complete Profile
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
