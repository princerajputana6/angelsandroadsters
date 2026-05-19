import Link from 'next/link';

export default function TrailstormMark({ size = 'md', className = '', href = '/trailstorm/2026-jaisalmer-trailstorm-event' }) {
  const heights = {
    sm: 'h-12 sm:h-14',
    md: 'h-16 sm:h-20',
    lg: 'h-20 sm:h-24',
    xl: 'h-28 sm:h-32',
  }[size];

  const inner = (
    <img
      src="/logos/trailstorm.png"
      alt="Trailstorm"
      className={`${heights} w-auto object-contain ${className}`}
    />
  );

  return href ? <Link href={href} className="inline-block">{inner}</Link> : inner;
}
