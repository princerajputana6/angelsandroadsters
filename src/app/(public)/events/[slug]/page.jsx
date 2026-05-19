'use client';
import { useParams } from 'next/navigation';
import { useGetEventQuery } from '@/store/api';
import BookingWizard from '@/components/events/BookingWizard';
import { motion } from 'framer-motion';

export default function EventDetailPage() {
  const { slug } = useParams();
  const { data, isLoading } = useGetEventQuery(slug);
  const event = data?.event;

  if (isLoading) return <div className="container-x py-32 text-charcoal-300">Loading...</div>;
  if (!event) return <div className="container-x py-32">Event not found</div>;

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const cover = event.coverImage || `https://picsum.photos/seed/${event._id}/1600/900`;

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[480px] overflow-hidden">
        <img src={cover} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 hero-veil" />

        <div className="absolute inset-0 container-x flex flex-col justify-end pb-10 sm:pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="chip border-terra-500/40 text-terra-400 uppercase">{event.eventType}</span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-display leading-[0.95] mt-3 max-w-4xl">
              {event.title}
            </h1>
            <div className="flex flex-wrap gap-4 sm:gap-6 mt-5 text-sm text-charcoal-200">
              <span className="flex items-center gap-2">📍 {event.location?.venue}, {event.location?.city}</span>
              <span className="flex items-center gap-2">📅 {start.toDateString()} – {end.toDateString()}</span>
              <span className="flex items-center gap-2">🎟 From ₹{event.pricing?.individual || 0}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content + Booking */}
      <section className="container-x py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-8 lg:gap-12">
          <div className="space-y-10">
            <div>
              <p className="eyebrow mb-2">ABOUT THE EVENT</p>
              <h2 className="section-title mb-4">What you signed up for</h2>
              <p className="text-charcoal-200 whitespace-pre-line leading-relaxed">{event.description}</p>
            </div>

            {event.highlights?.length > 0 && (
              <div>
                <p className="eyebrow mb-2">HIGHLIGHTS</p>
                <h3 className="font-display text-3xl sm:text-4xl mb-5">The good stuff</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {event.highlights.map((h, i) => (
                    <li key={i} className="card p-4 flex items-start gap-3">
                      <span className="text-terra-400 text-xl">✦</span>
                      <span className="text-sm sm:text-base text-charcoal-200">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {event.schedule?.length > 0 && (
              <div>
                <p className="eyebrow mb-2">SCHEDULE</p>
                <h3 className="font-display text-3xl sm:text-4xl mb-5">Run-of-show</h3>
                <div className="space-y-2">
                  {event.schedule.map((s, i) => (
                    <div key={i} className="card p-4 flex gap-4">
                      <span className="text-terra-400 font-bold w-24 shrink-0">{s.time}</span>
                      <div className="flex-1">
                        <div className="font-semibold">{s.activity}</div>
                        {s.speaker && <div className="text-xs text-charcoal-400 mt-0.5">{s.speaker}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4 text-center">
                <div className="text-2xl sm:text-3xl font-display text-terra-400">{event.capacity?.individual || 0}</div>
                <div className="text-[10px] text-charcoal-400 uppercase tracking-wider mt-1">Solo slots</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl sm:text-3xl font-display text-terra-400">{event.capacity?.group || 0}</div>
                <div className="text-[10px] text-charcoal-400 uppercase tracking-wider mt-1">Group slots</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl sm:text-3xl font-display text-terra-400">{event.capacity?.visitor || 0}</div>
                <div className="text-[10px] text-charcoal-400 uppercase tracking-wider mt-1">Visitor passes</div>
              </div>
            </div>
          </div>

          {/* Booking sidebar - sticky on desktop, regular flow on mobile */}
          <div>
            <div className="lg:sticky lg:top-24">
              <BookingWizard event={event} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
