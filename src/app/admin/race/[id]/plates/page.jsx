'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRacePlatesQuery, useMarkPlatesPrintedMutation } from '@/store/api';

/**
 * Print-ready race plates (plan §5.4). Large high-contrast number, display name,
 * optional rider photo, event/category branding, and a QR encoding only a
 * non-sensitive entry id. Uses a dedicated print stylesheet so only the plate
 * sheet is sent to the printer. "Printed" is an administrative marker only.
 */
const PRINT_CSS = `
/* Screen: plates are fluid so they fit any phone/desktop width. */
.race-plate { width: 100%; max-width: 340px; aspect-ratio: 92 / 120; background: #fff; color: #000; }
.plate-num { font-size: clamp(2.5rem, 18vw, 6rem); line-height: 0.9; }
@media (min-width: 640px) { .plate-num { font-size: clamp(3rem, 8vw, 6.5rem); } }

/* Print: fixed physical size, 2 across, for cutting. */
@media print {
  @page { margin: 8mm; }
  body * { visibility: hidden !important; }
  .plate-print-area, .plate-print-area * { visibility: visible !important; }
  .plate-print-area { position: absolute; left: 0; top: 0; display: grid !important; grid-template-columns: repeat(2, 92mm); gap: 6mm; }
  .no-print { display: none !important; }
  .race-plate { width: 92mm !important; height: 120mm !important; max-width: none !important; aspect-ratio: auto !important; break-inside: avoid; page-break-inside: avoid; box-shadow: none !important; border: 1.5px solid #000 !important; }
  .plate-num { font-size: 52mm !important; }
}
`;

function Plate({ plate, event, race, selected, onToggle }) {
  return (
    <div className="relative">
      <label className="no-print absolute top-2 left-2 z-10 flex items-center gap-1 text-[11px] text-black/70 bg-white/80 rounded px-1">
        <input type="checkbox" checked={selected} onChange={onToggle} /> select
      </label>
      <div className="race-plate rounded-lg border border-black/20 shadow p-4 flex flex-col items-center justify-between text-center">
        <div className="w-full">
          <div className="text-[10px] uppercase tracking-widest text-black/60 truncate">{event?.title}</div>
          {plate.categoryName && <div className="text-xs font-semibold text-black/70 truncate">{plate.categoryName}</div>}
        </div>

        <div className="leading-none font-black plate-num">{plate.raceNumber}</div>

        <div className="w-full">
          <div className="text-lg font-bold truncate">{plate.displayName}</div>
          <div className="flex items-end justify-between mt-2">
            {plate.riderPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={plate.riderPhoto} alt="" className="w-16 h-16 object-cover rounded border border-black/30" />
            ) : <span />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={plate.qr} alt="QR" className="w-16 h-16" />
          </div>
          <div className="text-[9px] text-black/40 mt-1">{race?.name}</div>
        </div>
      </div>
    </div>
  );
}

export default function RacePlatesPage() {
  const { id } = useParams();
  const { data, isLoading } = useRacePlatesQuery({ race: id });
  const [markPrinted] = useMarkPlatesPrintedMutation();
  const [selected, setSelected] = useState(() => new Set());

  const plates = data?.plates || [];
  const allSelected = plates.length > 0 && selected.size === plates.length;

  const toggle = (entryId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(entryId) ? next.delete(entryId) : next.add(entryId);
      return next;
    });
  };
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(plates.map((p) => p.entryId)));

  const print = async () => {
    const ids = selected.size ? [...selected] : plates.map((p) => p.entryId);
    if (!ids.length) return toast.error('No plates to print');
    window.print();
    // Mark as printed (administrative marker only) after invoking print.
    try { await markPrinted(ids).unwrap(); } catch { /* non-fatal */ }
  };

  return (
    <div>
      <style>{PRINT_CSS}</style>

      <div className="no-print flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <Link href={`/admin/race/${id}/entries`} className="text-xs text-charcoal-400 hover:text-terra-400">← Riders & Entries</Link>
          <h1 className="text-3xl font-display mt-1">Race Plates</h1>
          <p className="text-sm text-charcoal-400">{plates.length} active entr{plates.length === 1 ? 'y' : 'ies'} · {selected.size || 'all'} selected to print</p>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleAll} className="btn btn-outline">{allSelected ? 'Clear' : 'Select all'}</button>
          <button onClick={print} className="btn btn-gold">🖨 Print {selected.size ? `(${selected.size})` : 'all'}</button>
        </div>
      </div>

      <p className="no-print text-[11px] text-charcoal-500 mb-4">
        “Printed” is an administrative marker only — it does not confirm a plate was physically attached or verified.
      </p>

      {isLoading ? <p className="text-charcoal-400">Loading plates…</p> : (
        <div className="plate-print-area grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
          {plates.map((p) => (
            <Plate
              key={p.entryId}
              plate={p}
              event={data.event}
              race={data.race}
              selected={selected.has(p.entryId)}
              onToggle={() => toggle(p.entryId)}
            />
          ))}
          {plates.length === 0 && <p className="no-print col-span-full text-center text-charcoal-400 py-12">No active entries to print. <Link href={`/admin/race/${id}/entries`} className="text-terra-400">Add entries</Link>.</p>}
        </div>
      )}
    </div>
  );
}
