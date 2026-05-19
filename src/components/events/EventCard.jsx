import Link from 'next/link';
import { motion } from 'framer-motion';

const TYPE = {
  rally: { label: 'Riding Rally', icon: '🏍️' },
  trek: { label: 'Mountain Trek', icon: '🥾' },
  expedition: { label: 'Expedition', icon: '🧭' },
  expo: { label: 'Gear Expo', icon: '🎪' },
  workshop: { label: 'Workshop', icon: '🛠️' },
  meetup: { label: 'Meetup', icon: '🤝' },
};

export default function EventCard({ event }) {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const meta = TYPE[event.eventType] || { label: event.eventType, icon: '✦' };
  const img = event.coverImage || `https://picsum.photos/seed/${event._id}/900/600`;
  const days = Math.max(1, Math.ceil((end - start) / 86400000) + 1);

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'tween', duration: 0.2 }}>
      <Link href={`/events/${event.slug}`} className="group block card overflow-hidden hover:border-terra-500/50 transition">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img src={img} alt={event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[800ms]" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/30 to-transparent" />

          <span className="absolute top-3 left-3 chip border-terra-500/40 text-terra-400 bg-charcoal-950/70">
            {meta.icon} {meta.label}
          </span>

          <div className="absolute top-3 right-3 bg-charcoal-950/90 backdrop-blur border border-charcoal-800 rounded-xl px-3 py-2 text-center min-w-[58px]">
            <div className="text-[10px] text-terra-400 uppercase tracking-wider">{start.toLocaleString('default', { month: 'short' })}</div>
            <div className="text-2xl font-display leading-none">{start.getDate()}</div>
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-display text-2xl sm:text-3xl group-hover:text-terra-400 transition">{event.title}</h3>
            <p className="text-xs text-charcoal-300 mt-1">📍 {event.location?.city}, {event.location?.state}</p>
          </div>
        </div>

        <div className="p-4 flex items-center justify-between border-t border-charcoal-800/60">
          <div className="flex items-center gap-4 text-xs text-charcoal-400">
            <span>🗓 {days}d</span>
            <span className="hidden sm:inline">·</span>
            <span>Cap. {event.capacity?.individual || 0}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-charcoal-500 uppercase tracking-wider">From</div>
              <div className="text-terra-400 font-bold text-sm">
                {event.pricing?.individual ? `₹${event.pricing.individual.toLocaleString()}` : 'Free'}
              </div>
            </div>
            <span className="text-terra-400 text-lg">→</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
