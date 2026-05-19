'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateProductMutation, useListCategoriesQuery, useCreateCategoryMutation } from '@/store/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const { data: catData, refetch } = useListCategoriesQuery();
  const [createProduct, { isLoading }] = useCreateProductMutation();
  const [createCategory] = useCreateCategoryMutation();
  const [form, setForm] = useState({
    name: '', description: '', brand: '', category: '', subCategory: '',
    price: '', discountedPrice: '', stock: 0,
    images: '', thumbnail: '', sizes: '', colors: '', tags: '',
    isFeatured: false, isActive: true,
  });
  const [newCat, setNewCat] = useState({ name: '', parent: 'riding' });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createProduct({
        ...form,
        price: Number(form.price),
        discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : undefined,
        stock: Number(form.stock),
        images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
        sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      }).unwrap();
      toast.success('Product created');
      router.push('/admin/products');
    } catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  const addCategory = async () => {
    if (!newCat.name) return;
    try {
      await createCategory(newCat).unwrap();
      toast.success('Category added');
      setNewCat({ name: '', parent: 'riding' });
      refetch();
    } catch (e) { toast.error('Failed'); }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <Link href="/admin/products" className="text-xs text-charcoal-400 hover:text-terra-400">← Back to Products</Link>
        <h1 className="text-3xl sm:text-4xl font-display mt-2">New Product</h1>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5 sm:p-6 space-y-4">
          <h3 className="font-display text-xl">Basics</h3>
          <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows="4" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Brand</label><input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
            <div><label className="label">Sub Category</label><input className="input" value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} /></div>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category...</option>
              {(catData?.categories || []).map((c) => <option key={c._id} value={c._id}>{c.parent} · {c.name}</option>)}
            </select>
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <input className="input flex-1" placeholder="New category name" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
              <select className="input sm:w-32" value={newCat.parent} onChange={(e) => setNewCat({ ...newCat, parent: e.target.value })}>
                <option value="riding">Riding</option>
                <option value="travelling">Travelling</option>
              </select>
              <button type="button" onClick={addCategory} className="btn btn-outline">+ Add</button>
            </div>
          </div>
        </div>

        <div className="card p-5 sm:p-6 space-y-4">
          <h3 className="font-display text-xl">Pricing & Media</h3>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Price (₹)</label><input className="input" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div><label className="label">Sale</label><input className="input" type="number" value={form.discountedPrice} onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })} /></div>
            <div><label className="label">Stock</label><input className="input" type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
          </div>
          <div><label className="label">Thumbnail URL</label><input className="input" placeholder="https://..." value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} /></div>
          <div><label className="label">Gallery URLs (comma-separated)</label><input className="input" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="label">Sizes</label><input className="input" placeholder="S, M, L" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} /></div>
            <div><label className="label">Colors</label><input className="input" placeholder="Black, Red" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} /></div>
            <div><label className="label">Tags</label><input className="input" placeholder="helmet, dot" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
            <span className="text-sm">Featured product</span>
          </label>
          <button type="submit" disabled={isLoading} className="btn btn-gold w-full h-12">{isLoading ? 'Saving...' : 'Create Product'}</button>
        </div>
      </form>
    </div>
  );
}
