'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  useCreateProductMutation,
  useListCategoriesQuery,
} from '@/store/api';
import FileUpload from '@/components/FileUpload';

export default function NewProductPage() {
  const router = useRouter();
  const { data: catData } = useListCategoriesQuery();
  const [createProduct, { isLoading }] = useCreateProductMutation();

  const [form, setForm] = useState({
    name: '',
    description: '',
    brand: '',
    categoryId: '',     // top-level category id
    subCategoryId: '',  // sub-category id (optional, only when parent has children)
    price: '',
    discountedPrice: '',
    stock: 0,
    thumbnail: '',
    images: [],
    sizes: '',
    colors: '',
    tags: '',
    isFeatured: false,
    isActive: true,
    // Tax
    taxRate: 18,
    taxIncluded: true,
    taxNote: '',
    // Returns
    returnAvailable: true,
    returnDays: 30,
    returnNote: '',
    // Delivery
    deliveryFree: false,
    deliveryFee: 0,
    deliveryEta: 0,
    deliveryNote: '',
  });

  const allCats = catData?.categories || [];
  const topLevels = useMemo(() => allCats.filter((c) => !c.parentCategory), [allCats]);
  const subCategories = useMemo(() => {
    if (!form.categoryId) return [];
    return allCats.filter((c) => String(c.parentCategory) === String(form.categoryId));
  }, [allCats, form.categoryId]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onPickCategory = (e) => {
    setForm({ ...form, categoryId: e.target.value, subCategoryId: '' });
  };

  const addImage = (url) => {
    if (!url) return;
    setForm((f) => ({ ...f, images: [...f.images, url] }));
  };
  const removeImage = (idx) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.categoryId) { toast.error('Pick a category'); return; }

    // If a sub-category was chosen, use it as the leaf product.category;
    // otherwise the top-level category is the leaf. Either way we also send
    // a human-readable subCategory string for backwards compat.
    const leafCategoryId = form.subCategoryId || form.categoryId;
    const subCategoryName = form.subCategoryId
      ? allCats.find((c) => String(c._id) === String(form.subCategoryId))?.name
      : '';

    try {
      await createProduct({
        name: form.name,
        description: form.description,
        brand: form.brand,
        category: leafCategoryId,
        subCategory: subCategoryName || '',
        price: Number(form.price),
        discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : undefined,
        stock: Number(form.stock),
        thumbnail: form.thumbnail || form.images[0] || '',
        images: form.images,
        sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        tax: {
          rate: Number(form.taxRate) || 0,
          included: !!form.taxIncluded,
          note: form.taxNote.trim(),
        },
        returnPolicy: {
          available: !!form.returnAvailable,
          days: Number(form.returnDays) || 0,
          note: form.returnNote.trim(),
        },
        delivery: {
          free: !!form.deliveryFree,
          fee: Number(form.deliveryFee) || 0,
          etaDays: Number(form.deliveryEta) || 0,
          note: form.deliveryNote.trim(),
        },
      }).unwrap();
      toast.success('Product created');
      router.push('/admin/products');
    } catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <Link href="/admin/products" className="text-xs text-charcoal-400 hover:text-terra-400">← Back to Products</Link>
        <h1 className="text-3xl sm:text-4xl font-display mt-2">New Product</h1>
        <p className="text-charcoal-400 text-sm mt-1">
          Manage the category list on the <Link href="/admin/categories" className="text-terra-400 hover:text-terra-300">Categories page</Link>.
        </p>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT: Basics + Category */}
        <div className="space-y-5">
          <div className="card p-5 sm:p-6 space-y-4">
            <h3 className="font-display text-xl">Basics</h3>
            <div>
              <label className="label">Name</label>
              <input className="input" required value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows="4" required value={form.description} onChange={set('description')} />
            </div>
            <div>
              <label className="label">Brand</label>
              <input className="input" value={form.brand} onChange={set('brand')} />
            </div>
          </div>

          <div className="card p-5 sm:p-6 space-y-4">
            <h3 className="font-display text-xl">Category</h3>

            <div>
              <label className="label">Category <span className="text-red-400">*</span></label>
              <select className="input" required value={form.categoryId} onChange={onPickCategory}>
                <option value="">Select a category...</option>
                {topLevels.map((c) => (
                  <option key={c._id} value={c._id}>{c.parent} · {c.name}</option>
                ))}
              </select>
              {topLevels.length === 0 && (
                <p className="text-xs text-amber-400 mt-1">
                  No categories yet. <Link href="/admin/categories" className="underline">Add one</Link>.
                </p>
              )}
            </div>

            {form.categoryId && (
              <div>
                <label className="label">Sub-category</label>
                {subCategories.length > 0 ? (
                  <>
                    <select className="input" value={form.subCategoryId} onChange={set('subCategoryId')}>
                      <option value="">— None —</option>
                      {subCategories.map((s) => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-charcoal-500 mt-1">Optional. Pick a sub-category if one fits.</p>
                  </>
                ) : (
                  <p className="text-xs text-charcoal-500">
                    No sub-categories for the selected category.
                    {' '}<Link href="/admin/categories" className="text-terra-400 hover:text-terra-300 underline">Add one</Link>.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Pricing + Media */}
        <div className="space-y-5">
          <div className="card p-5 sm:p-6 space-y-4">
            <h3 className="font-display text-xl">Pricing & stock</h3>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">Price (₹)</label><input className="input" type="number" required value={form.price} onChange={set('price')} /></div>
              <div><label className="label">Sale</label><input className="input" type="number" value={form.discountedPrice} onChange={set('discountedPrice')} /></div>
              <div><label className="label">Stock</label><input className="input" type="number" required value={form.stock} onChange={set('stock')} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className="label">Sizes</label><input className="input" placeholder="S, M, L" value={form.sizes} onChange={set('sizes')} /></div>
              <div><label className="label">Colors</label><input className="input" placeholder="Black, Red" value={form.colors} onChange={set('colors')} /></div>
              <div><label className="label">Tags</label><input className="input" placeholder="helmet, dot" value={form.tags} onChange={set('tags')} /></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
              <span className="text-sm">Featured product</span>
            </label>
          </div>

          <div className="card p-5 sm:p-6 space-y-4">
            <h3 className="font-display text-xl">Images</h3>

            <FileUpload
              label="Thumbnail (main image)"
              accept="image/*"
              value={form.thumbnail}
              onChange={(url) => setForm({ ...form, thumbnail: url })}
              description="Shown in product listings. If empty, the first gallery image is used."
            />

            <div>
              <label className="label">Gallery images</label>
              <FileUpload
                label=""
                accept="image/*"
                value=""
                onChange={addImage}
                description="Add multiple images, one at a time. Shown on the product page."
              />
              {form.images.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {form.images.map((url, i) => (
                    <div key={`${url}-${i}`} className="relative group rounded-lg overflow-hidden border border-charcoal-800 bg-charcoal-900">
                      <img src={url} alt={`Gallery ${i + 1}`} className="w-full aspect-square object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-500 text-white text-xs w-6 h-6 rounded flex items-center justify-center"
                        title="Remove"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card p-5 sm:p-6 space-y-5">
            <h3 className="font-display text-xl">Tax, returns & delivery</h3>

            {/* TAX */}
            <div className="space-y-3">
              <p className="eyebrow">Tax</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tax rate (%)</label>
                  <input className="input" type="number" min="0" value={form.taxRate} onChange={set('taxRate')} />
                </div>
                <div>
                  <label className="label">Price includes tax?</label>
                  <select className="input" value={form.taxIncluded ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, taxIncluded: e.target.value === 'yes' })}>
                    <option value="yes">Yes — tax is included in the price</option>
                    <option value="no">No — tax is added at checkout</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Tax note (optional)</label>
                <input className="input" value={form.taxNote} onChange={set('taxNote')} placeholder="e.g. Inclusive of all taxes (GST 18%)" />
              </div>
            </div>

            <div className="border-t border-charcoal-800/70" />

            {/* RETURNS */}
            <div className="space-y-3">
              <p className="eyebrow">Returns</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.returnAvailable} onChange={(e) => setForm({ ...form, returnAvailable: e.target.checked })} />
                <span className="text-sm">Returns accepted for this product</span>
              </label>
              {form.returnAvailable && (
                <>
                  <div>
                    <label className="label">Return window (days)</label>
                    <input className="input" type="number" min="0" value={form.returnDays} onChange={set('returnDays')} />
                  </div>
                  <div>
                    <label className="label">Return note (optional)</label>
                    <input className="input" value={form.returnNote} onChange={set('returnNote')} placeholder="e.g. Unused, with original tags" />
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-charcoal-800/70" />

            {/* DELIVERY */}
            <div className="space-y-3">
              <p className="eyebrow">Delivery</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.deliveryFree} onChange={(e) => setForm({ ...form, deliveryFree: e.target.checked })} />
                <span className="text-sm">Free delivery</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Delivery fee (₹)</label>
                  <input className="input" type="number" min="0" disabled={form.deliveryFree} value={form.deliveryFee} onChange={set('deliveryFee')} />
                  {form.deliveryFree && <p className="text-[10px] text-charcoal-500 mt-1">Disabled — delivery is free.</p>}
                </div>
                <div>
                  <label className="label">ETA (days)</label>
                  <input className="input" type="number" min="0" value={form.deliveryEta} onChange={set('deliveryEta')} placeholder="e.g. 5" />
                </div>
              </div>
              <div>
                <label className="label">Delivery note (optional)</label>
                <input className="input" value={form.deliveryNote} onChange={set('deliveryNote')} placeholder="e.g. Ships from Bangalore in 24h" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-gold w-full h-12">
            {isLoading ? 'Saving...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
