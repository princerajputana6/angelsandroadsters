'use client';
import { useRef, useState } from 'react';
import { sha256OfFile, validateImageFile } from '@/lib/assetHash';

/**
 * A single race photo field (rider / bike / plate). Validates and hashes the
 * image client-side, uploads it via the existing /api/upload (Cloudinary), and
 * returns an asset ref { url, assetId, contentHash, status } via onChange
 * (plan §5.3). Keeps the preview until replaced/removed.
 */
export default function RacePhotoInput({ label, value, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const ref = value || {};

  const pick = async (file) => {
    if (!file) return;
    const err = validateImageFile(file);
    if (err) return alert(err);
    setBusy(true);
    try {
      const contentHash = await sha256OfFile(file);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Upload failed');
      }
      const { url } = await res.json();
      onChange({
        url,
        assetId: crypto.randomUUID(),
        contentHash,
        status: 'uploaded',
      });
    } catch (e) {
      alert(e.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <span className="text-xs text-charcoal-400">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      <div className="mt-1 border border-charcoal-700 rounded-lg p-2 flex items-center gap-3">
        {ref.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ref.url} alt={label} className="w-14 h-14 object-cover rounded border border-charcoal-700" />
        ) : (
          <div className="w-14 h-14 rounded bg-charcoal-800 flex items-center justify-center text-xl">📷</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-charcoal-400 truncate">
            {busy ? 'Uploading…' : ref.url ? '✓ uploaded' : 'No photo'}
          </p>
          {ref.contentHash && <p className="text-[10px] text-charcoal-600 truncate">#{ref.contentHash.slice(0, 12)}</p>}
        </div>
        <div className="flex gap-1 shrink-0">
          <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="text-[11px] text-terra-400 border border-terra-400/30 rounded px-2 py-1">
            {ref.url ? 'Replace' : 'Upload'}
          </button>
          {ref.url && (
            <button type="button" onClick={() => onChange({ url: '', assetId: '', contentHash: '', status: 'none' })} className="text-[11px] text-red-400 border border-red-400/30 rounded px-2 py-1">
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
