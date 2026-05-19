import Link from 'next/link';

export default function BrandMark({ size = 'md', className = '', href = '/' }) {
  const sizes = {
    sm: { box: 'h-8 w-8 text-base', main: 'text-base', sub: 'text-[9px]' },
    md: { box: 'h-10 w-10 text-lg', main: 'text-lg sm:text-xl', sub: 'text-[10px]' },
    lg: { box: 'h-12 w-12 text-2xl', main: 'text-2xl sm:text-3xl', sub: 'text-xs' },
    xl: { box: 'h-16 w-16 text-3xl', main: 'text-4xl', sub: 'text-sm' },
  }[size];

  const inner = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${sizes.box} rounded-lg bg-gradient-to-br from-terra-500 to-gold-500 flex items-center justify-center font-display text-charcoal-950 shadow-glow`}>
        A
      </div>
      <div className="leading-tight">
        <div className={`font-display ${sizes.main} text-white tracking-wide`}>
          ANGELES <span className="text-terra-400">&</span> ROADSTERS
        </div>
        <div className={`${sizes.sub} text-charcoal-400 tracking-[0.35em] uppercase`}>
          Ride · Travel · Adventure
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
