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
    categoryId: '',
    subCategoryId: '',
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
    taxRate: 18,
    taxIncluded: true,
    taxNote: '',
    returnAvailable: true,
    returnDays: 30,
    returnNote: '',
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
  const onPickCategory = (e) => setForm({ ...form, categoryId: e.target.value, subCategoryId: '' });

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
        tax: { rate: Number(form.taxRate) || 0, included: !!form.taxIncluded, note: form.taxNote.trim() },
        returnPolicy: { available: !!form.returnAvailable, days: Number(form.returnDays) || 0, note: form.returnNote.trim() },
        delivery: { free: !!form.deliveryFree, fee: Number(form.deliveryFee) || 0, etaDays: Number(form.deliveryEta) || 0, note: form.deliveryNote.trim() },
      }).unwrap();
      toast.success('Product created');
      router.push('/admin/products');
    } catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <Link href="/admin/products" className="text-xs text-charcoal-400 hover:text-terra-400">← Back to Products</Link>
          <h1 className="text-2xl sm:text-3xl font-display mt-1">New Product</h1>
          <p className="text-charcoal-500 text-xs mt-0.5">
            Manage the category list on the{' '}
            <Link href="/admin/categories" className="text-terra-400 hover:text-terra-300">Categories page</Link>.
          </p>
        </div>
        <button
          form="new-product-form"
          type="submit"
          disabled={isLoading}
          className="btn btn-gold h-11 px-6 whitespace-nowrap"
        >
          {isLoading ? 'Saving...' : 'Create Product'}
        </button>
      </div>

      <form id="new-product-form" onSubmit={submit} className="space-y-4">

        {/* ROW 1: Basics | Category + Pricing  (2 columns on lg) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Basics — spans 2 cols */}
          <div className="card p-4 sm:p-5 space-y-3 lg:col-span-2">
            <h3 className="font-display text-lg">Basics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="label">Name <span className="text-charcoal-500 normal-case font-normal">({form.name.length}/100)</span></label>
                <input className="input" required maxLength={100} value={form.name} onChange={set('name')} />
              </div>
              <div>
                <label className="label">Brand</label>
                <input className="input" maxLength={60} value={form.brand} onChange={set('brand')} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                  Featured
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Active
                </label>
              </div>
            </div>
            <div>
              <label className="label">Description <span className="text-charcoal-500 normal-case font-normal">({form.description.length}/2000)</span></label>
              <textarea className="input" rows="3" required maxLength={2000} value={form.description} onChange={set('description')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Category <span className="text-red-400">*</span></label>
                <select className="input" required value={form.categoryId} onChange={onPickCategory}>
                  <option value="">Select category...</option>
                  {topLevels.map((c) => (
                    <option key={c._id} value={c._id}>{c.parent} · {c.name}</option>
                  ))}
                </select>
                {topLevels.length === 0 && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    No categories yet. <Link href="/admin/categories" className="underline">Add one</Link>.
                  </p>
                )}
              </div>
              <div>
                <label className="label">
                  Sub-category {form.categoryId && subCategories.length === 0 && (
                    <span className="text-charcoal-500 font-normal">— none available</span>
                  )}
                </label>
                <select
                  className="input"
                  value={form.subCategoryId}
                  onChange={set('subCategoryId')}
                  disabled={!form.categoryId || subCategories.length === 0}
                >
                  <option value="">— None —</option>
                  {subCategories.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & stock — sits next to Basics */}
          <div className="card p-4 sm:p-5 space-y-3">
            <h3 className="font-display text-lg">Pricing & stock</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="label">Price ₹</label>
                <input className="input" type="number" required value={form.price} onChange={set('price')} />
              </div>
              <div>
                <label className="label">Sale ₹</label>
                <input className="input" type="number" value={form.discountedPrice} onChange={set('discountedPrice')} />
              </div>
              <div>
                <label className="label">Stock</label>
                <input className="input" type="number" required value={form.stock} onChange={set('stock')} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="label">Sizes</label>
                <input className="input" maxLength={120} placeholder="S, M, L" value={form.sizes} onChange={set('sizes')} />
              </div>
              <div>
                <label className="label">Colors</label>
                <input className="input" maxLength={120} placeholder="Black, Red" value={form.colors} onChange={set('colors')} />
              </div>
              <div>
                <label className="label">Tags</label>
                <input className="input" maxLength={200} placeholder="helmet, dot" value={form.tags} onChange={set('tags')} />
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Images (full width, 2 internal columns) */}
        <div className="card p-4 sm:p-5 space-y-3">
          <h3 className="font-display text-lg">Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUpload
              label="Thumbnail (main image)"
              accept="image/*"
              value={form.thumbnail}
              onChange={(url) => setForm({ ...form, thumbnail: url })}
              description="Used in listings. Falls back to the first gallery image."
            />
            <FileUpload
              label="Add gallery image"
              accept="image/*"
              value=""
              onChange={addImage}
              description="Upload one at a time — each appears below."
            />
          </div>
          {form.images.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 pt-2">
              {form.images.map((url, i) => (
                <div key={`${url}-${i}`} className="relative group rounded-lg overflow-hidden border border-charcoal-800 bg-charcoal-900">
                  <img src={url} alt={`Gallery ${i + 1}`} className="w-full aspect-square object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-500 text-white text-xs w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    title="Remove"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ROW 3: Tax | Returns | Delivery (3 columns) */}
        <div className="card p-4 sm:p-5">
          <h3 className="font-display text-lg mb-4">Tax, returns & delivery</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">

            {/* TAX */}
            <div className="space-y-3 md:border-r md:border-charcoal-800/70 md:pr-6">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Tax</p>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={form.taxIncluded}
                    onChange={(e) => setForm({ ...form, taxIncluded: e.target.checked })}
                  />
                  <span>Included in price</span>
                </label>
              </div>
              <div>
                <label className="label">Rate %</label>
                <input className="input" type="number" min="0" step="0.01" value={form.taxRate} onChange={set('taxRate')} />
              </div>
              <p className="text-[10px] text-charcoal-500">
                {form.taxIncluded
                  ? `Listed price already includes ${Number(form.taxRate) || 0}% tax. No tax added at checkout.`
                  : `${Number(form.taxRate) || 0}% tax will be added on top of the price at checkout.`}
              </p>
              <div>
                <label className="label">Note</label>
                <input className="input" maxLength={120} value={form.taxNote} onChange={set('taxNote')} placeholder="e.g. Inclusive of GST" />
              </div>
            </div>

            {/* RETURNS */}
            <div className="space-y-3 md:border-r md:border-charcoal-800/70 md:pr-6">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Returns</p>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input type="checkbox" checked={form.returnAvailable} onChange={(e) => setForm({ ...form, returnAvailable: e.target.checked })} />
                  Accepted
                </label>
              </div>
              <div>
                <label className="label">Window (days)</label>
                <input className="input" type="number" min="0" disabled={!form.returnAvailable} value={form.returnDays} onChange={set('returnDays')} />
              </div>
              <div>
                <label className="label">Note</label>
                <input className="input" maxLength={140} disabled={!form.returnAvailable} value={form.returnNote} onChange={set('returnNote')} placeholder="e.g. Unused, with original tags" />
              </div>
            </div>

            {/* DELIVERY */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Delivery</p>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input type="checkbox" checked={form.deliveryFree} onChange={(e) => setForm({ ...form, deliveryFree: e.target.checked })} />
                  Free
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Fee ₹</label>
                  <input className="input" type="number" min="0" disabled={form.deliveryFree} value={form.deliveryFee} onChange={set('deliveryFee')} />
                </div>
                <div>
                  <label className="label">ETA days</label>
                  <input className="input" type="number" min="0" value={form.deliveryEta} onChange={set('deliveryEta')} />
                </div>
              </div>
              <div>
                <label className="label">Note</label>
                <input className="input" maxLength={140} value={form.deliveryNote} onChange={set('deliveryNote')} placeholder="e.g. Ships from Bangalore" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom submit */}
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={isLoading} className="btn btn-gold h-11 px-8">
            {isLoading ? 'Saving...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
