'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useGetEventQuery, useUpdateEventMutation } from '@/store/api';
import FileUpload from '@/components/FileUpload';

export default function AdminEditEventPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { data, isLoading, refetch } = useGetEventQuery(slug);
  const [updateEvent, { isLoading: saving }] = useUpdateEventMutation();
  const event = data?.event;

  const [gallery, setGallery] = useState([]);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [pending, setPending] = useState('');

  useEffect(() => {
    if (event?.gallery) setGallery(event.gallery);
    if (typeof event?.galleryTitle === 'string') setGalleryTitle(event.galleryTitle);
  }, [event]);

  const addImage = (url) => {
    if (!url) return;
    setGallery((g) => [...g, url]);
    setPending('');
  };

  const removeImage = (idx) => {
    setGallery((g) => g.filter((_, i) => i !== idx));
  };

  const move = (idx, dir) => {
    setGallery((g) => {
      const next = [...g];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return g;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const save = async () => {
    try {
      await updateEvent({ slug, body: { gallery, galleryTitle: galleryTitle.trim() } }).unwrap();
      toast.success('Gallery saved');
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
        <p className="text-charcoal-400 text-sm mt-1">Manage gallery images for this event. Images appear as an auto-scrolling slider on the event page below the hero.</p>
      </div>

      <div className="card p-5 sm:p-6 space-y-6">
        <div>
          <h3 className="font-display text-xl mb-1">Section heading</h3>
          <p className="text-xs text-charcoal-400 mb-3">The title shown above the slider on the public event page. Leave blank to use the default ("Moments from the trail").</p>
          <input
            className="input"
            type="text"
            value={galleryTitle}
            onChange={(e) => setGalleryTitle(e.target.value)}
            placeholder="Moments from the trail"
            maxLength={80}
          />
        </div>

        <div>
          <h3 className="font-display text-xl mb-1">Gallery images</h3>
          <p className="text-xs text-charcoal-400 mb-4">Upload images one at a time. Use the arrows to reorder — left-to-right order on this page is the order they appear in the slider.</p>

          <FileUpload
            label="Add a new image"
            accept="image/*"
            value={pending}
            onChange={addImage}
            description="JPG, PNG or WEBP. Max 5 MB. The image is added to the gallery as soon as upload completes."
          />
        </div>

        {gallery.length > 0 ? (
          <div>
            <p className="eyebrow mb-3">{gallery.length} image{gallery.length === 1 ? '' : 's'}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {gallery.map((url, i) => (
                <div key={`${url}-${i}`} className="relative group rounded-xl overflow-hidden border border-charcoal-800 bg-charcoal-900">
                  <img src={url} alt={`Gallery ${i + 1}`} className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="bg-charcoal-800 hover:bg-charcoal-700 disabled:opacity-30 text-white text-xs w-8 h-8 rounded"
                        title="Move left"
                      >←</button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === gallery.length - 1}
                        className="bg-charcoal-800 hover:bg-charcoal-700 disabled:opacity-30 text-white text-xs w-8 h-8 rounded"
                        title="Move right"
                      >→</button>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
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
        ) : (
          <div className="rounded-xl border border-dashed border-charcoal-700 p-8 text-center text-charcoal-400 text-sm">
            No gallery images yet. Upload your first image above.
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-charcoal-800">
          <button onClick={save} disabled={saving} className="btn btn-gold h-11 px-6">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
