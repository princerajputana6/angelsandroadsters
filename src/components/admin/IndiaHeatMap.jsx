'use client';
import { useState } from 'react';
import { STATE_TILES } from '@/lib/india-regions';

// Self-contained India heat-map (tile-grid cartogram). Each state is a grid
// cell shaded by its share of visits — no external map service or tiles.
// `counts` is a plain object: { 'Maharashtra': 12, 'Delhi': 5, ... }.
const CELL = 46;
const GAP = 6;
const STEP = CELL + GAP;

export default function IndiaHeatMap({ counts = {} }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...STATE_TILES.map((t) => counts[t.name] || 0));
  const cols = Math.max(...STATE_TILES.map((t) => t.x)) + 1;
  const rows = Math.max(...STATE_TILES.map((t) => t.y)) + 1;
  const w = cols * STEP - GAP;
  const h = rows * STEP - GAP;

  const fillFor = (count) => {
    if (!count) return { fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.35)' };
    const t = count / max;                 // 0..1
    const alpha = 0.2 + t * 0.8;           // 0.2..1
    return { fill: `rgba(234,88,12,${alpha})`, stroke: 'rgba(234,88,12,0.9)', text: t > 0.5 ? '#fff' : 'rgba(255,255,255,0.85)' };
  };

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-xl mx-auto" role="img" aria-label="Visits by state">
        {STATE_TILES.map((t) => {
          const count = counts[t.name] || 0;
          const c = fillFor(count);
          return (
            <g key={t.code}
               onMouseEnter={() => setHover({ name: t.name, count })}
               onMouseLeave={() => setHover(null)}
               style={{ cursor: 'default' }}>
              <rect x={t.x * STEP} y={t.y * STEP} width={CELL} height={CELL} rx="7"
                    fill={c.fill} stroke={c.stroke} strokeWidth="1" />
              <text x={t.x * STEP + CELL / 2} y={t.y * STEP + CELL / 2 - 3}
                    textAnchor="middle" fontSize="12" fontWeight="700" fill={c.text}>{t.code}</text>
              <text x={t.x * STEP + CELL / 2} y={t.y * STEP + CELL / 2 + 12}
                    textAnchor="middle" fontSize="11" fill={c.text} opacity="0.9">{count || ''}</text>
            </g>
          );
        })}
      </svg>

      {hover && (
        <div className="absolute top-2 right-2 bg-charcoal-900 border border-charcoal-700 rounded-lg px-3 py-1.5 text-sm shadow-lg pointer-events-none">
          <span className="font-semibold">{hover.name}</span>
          <span className="text-terra-400 ml-2">{hover.count} visit{hover.count === 1 ? '' : 's'}</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-charcoal-400">
        <span>Fewer</span>
        <span className="inline-block w-6 h-3 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="inline-block w-6 h-3 rounded" style={{ background: 'rgba(234,88,12,0.35)' }} />
        <span className="inline-block w-6 h-3 rounded" style={{ background: 'rgba(234,88,12,0.7)' }} />
        <span className="inline-block w-6 h-3 rounded" style={{ background: 'rgba(234,88,12,1)' }} />
        <span>More</span>
      </div>
      <p className="text-center text-[11px] text-charcoal-500 mt-2">Approximate layout (cartogram) — hover a tile for details.</p>
    </div>
  );
}
