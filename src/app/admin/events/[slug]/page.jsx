'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useGetEventQuery, useUpdateEventMutation } from '@/store/api';
import FileUpload from '@/components/FileUpload';

function ImageList({ items, onMove, onRemove, emptyLabel }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-charcoal-700 p-8 text-center text-charcoal-400 text-sm">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div>
      <p className="eyebrow mb-3">{items.length} image{items.length === 1 ? '' : 's'}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((url, i) => (
          <div key={`${url}-${i}`} className="relative group rounded-xl overflow-hidden border border-charcoal-800 bg-charcoal-900">
            <img src={url} alt={`Image ${i + 1}`} className="w-full aspect-square object-contain p-2" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onMove(i, -1)}
                  disabled={i === 0}
                  className="bg-charcoal-800 hover:bg-charcoal-700 disabled:opacity-30 text-white text-xs w-8 h-8 rounded"
                  title="Move left"
                >←</button>
                <button
                  type="button"
                  onClick={() => onMove(i, 1)}
                  disabled={i === items.length - 1}
                  className="bg-charcoal-800 hover:bg-charcoal-700 disabled:opacity-30 text-white text-xs w-8 h-8 rounded"
                  title="Move right"
                >→</button>
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="bg-red-500/90 hover:bg-red-500 text-white text-xs w-8 h-8 rounded"
                  title="Remove"
                >✕</button>
              </div>
            </div>
            <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
              #{i + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminEditEventPage() {
  const { slug } = useParams();
  const { data, isLoading, refetch } = useGetEventQuery(slug);
  const [updateEvent, { isLoading: saving }] = useUpdateEventMutation();
  const event = data?.event;

  const [gallery, setGallery] = useState([]);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [brands, setBrands] = useState([]);
  const [brandsTitle, setBrandsTitle] = useState('');

  useEffect(() => {
    if (!event) return;
    if (Array.isArray(event.gallery)) setGallery(event.gallery);
    if (typeof event.galleryTitle === 'string') setGalleryTitle(event.galleryTitle);
    if (Array.isArray(event.brands)) setBrands(event.brands);
    if (typeof event.brandsTitle === 'string') setBrandsTitle(event.brandsTitle);
  }, [event]);

  const addTo = (setter) => (url) => {
    if (!url) return;
    setter((arr) => [...arr, url]);
  };
  const removeFrom = (setter) => (idx) => {
    setter((arr) => arr.filter((_, i) => i !== idx));
  };
  const moveIn = (setter) => (idx, dir) => {
    setter((arr) => {
      const next = [...arr];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return arr;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const save = async () => {
    try {
      await updateEvent({
        slug,
        body: {
          gallery,
          galleryTitle: galleryTitle.trim(),
          brands,
          brandsTitle: brandsTitle.trim(),
        },
      }).unwrap();
      toast.success('Saved');
      refetch();
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to save');
    }
  };

  if (isLoading) return <div className="text-charcoal-300">Loading...</div>;
  if (!event) return <div className="text-charcoal-300">Event not found</div>;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <Link href="/admin/events" className="text-xs text-charcoal-400 hover:text-terra-400">← Back to Events</Link>
        <h1 className="text-3xl sm:text-4xl font-display mt-2">{event.title}</h1>
        <p className="text-charcoal-400 text-sm mt-1">Manage the gallery and brand logos for this event. Each appears as an auto-scrolling slider on the event page.</p>
      </div>

      {/* GALLERY CARD */}
      <div className="card p-5 sm:p-6 space-y-6 mb-6">
        <div>
          <h2 className="font-display text-2xl mb-1">Gallery</h2>
          <p className="text-xs text-charcoal-400">Event photos shown below the hero on the public page.</p>
        </div>

        <div>
          <label className="label">Section heading</label>
          <p className="text-xs text-charcoal-400 mb-2">Leave blank to use the default ("Moments from the trail").</p>
          <input
            className="input"
            type="text"
            value={galleryTitle}
            onChange={(e) => setGalleryTitle(e.target.value)}
            placeholder="Moments from the trail"
            maxLength={80}
          />
        </div>

        <FileUpload
          label="Add a gallery image"
          accept="image/*"
          value=""
          onChange={addTo(setGallery)}
          description="JPG, PNG or WEBP. Max 5 MB. Added to the gallery as soon as upload completes."
        />

        <ImageList
          items={gallery}
          onMove={moveIn(setGallery)}
          onRemove={removeFrom(setGallery)}
          emptyLabel="No gallery images yet. Upload your first image above."
        />
      </div>

      {/* BRANDS CARD */}
      <div className="card p-5 sm:p-6 space-y-6 mb-6">
        <div>
          <h2 className="font-display text-2xl mb-1">Brands &amp; partners</h2>
          <p className="text-xs text-charcoal-400">Logos shown as a marquee below the gallery on the public page.</p>
        </div>

        <div>
          <label className="label">Section heading</label>
          <p className="text-xs text-charcoal-400 mb-2">Leave blank to use the default ("Our partners &amp; brands").</p>
          <input
            className="input"
            type="text"
            value={brandsTitle}
            onChange={(e) => setBrandsTitle(e.target.value)}
            placeholder="Our partners & brands"
            maxLength={80}
          />
        </div>

        <FileUpload
          label="Add a brand logo"
          accept="image/*"
          value=""
          onChange={addTo(setBrands)}
          description="Transparent PNG or SVG works best. Max 5 MB. Added to the strip as soon as upload completes."
        />

        <ImageList
          items={brands}
          onMove={moveIn(setBrands)}
          onRemove={removeFrom(setBrands)}
          emptyLabel="No brand logos yet. Upload your first logo above."
        />
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn btn-gold h-11 px-6">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
