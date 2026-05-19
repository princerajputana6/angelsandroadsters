'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useListProductsQuery, useDeleteProductMutation } from '@/store/api';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useListProductsQuery({ limit: 60, q });
  const [del] = useDeleteProductMutation();
  const products = data?.products || [];

  const remove = async (slug) => {
    if (!confirm('Delete this product?')) return;
    try { await del(slug).unwrap(); toast.success('Deleted'); }
    catch (e) { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">CATALOG</p>
          <h1 className="text-3xl sm:text-4xl font-display">Products</h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input className="input flex-1 sm:w-64" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Link href="/admin/products/new" className="btn btn-gold whitespace-nowrap">+ Add</Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 card animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Product</th>
                  <th className="text-left p-3">Price</th>
                  <th className="text-left p-3">Stock</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.thumbnail || p.images?.[0] || `https://picsum.photos/seed/${p._id}/80`} className="w-12 h-12 object-cover rounded-lg" />
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-charcoal-500">{p.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-terra-400 font-bold">₹{(p.discountedPrice || p.price)?.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={p.stock < 5 ? 'text-red-400' : 'text-charcoal-200'}>{p.stock}</span>
                    </td>
                    <td className="p-3 text-charcoal-300">{p.category?.name}</td>
                    <td className="p-3">
                      {p.isFeatured && <span className="badge bg-gold-500/20 text-gold-400">Featured</span>}
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => remove(p.slug)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={6} className="p-12 text-center text-charcoal-400">No products. <Link href="/admin/products/new" className="text-terra-400">Add one</Link>.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {products.map((p) => (
              <div key={p._id} className="card p-3 flex gap-3">
                <img src={p.thumbnail || p.images?.[0] || `https://picsum.photos/seed/${p._id}/80`} className="w-20 h-20 object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-charcoal-500">{p.brand} · {p.category?.name}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-sm">
                    <span className="text-terra-400 font-bold">₹{(p.discountedPrice || p.price)?.toLocaleString()}</span>
                    <span className={p.stock < 5 ? 'text-red-400' : 'text-charcoal-400'}>· Stock: {p.stock}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {p.isFeatured ? <span className="badge bg-gold-500/20 text-gold-400">Featured</span> : <span />}
                    <button onClick={() => remove(p.slug)} className="text-red-400 text-xs">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="card p-8 text-center text-charcoal-400">No products. <Link href="/admin/products/new" className="text-terra-400">Add one</Link>.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
