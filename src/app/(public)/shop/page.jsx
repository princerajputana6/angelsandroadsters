'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useListProductsQuery, useListCategoriesQuery } from '@/store/api';
import ProductCard from '@/components/shop/ProductCard';

function ShopContent() {
  const sp = useSearchParams();
  const [filters, setFilters] = useState({
    q: sp.get('q') || '',
    category: sp.get('category') || '',
    sort: '-createdAt',
    featured: sp.get('featured') || '',
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data, isLoading } = useListProductsQuery(filters);
  const { data: catData } = useListCategoriesQuery();
  const products = data?.products || [];
  const categories = catData?.categories || [];

  const Filters = () => (
    <div className="space-y-5">
      <div>
        <label className="label">Search</label>
        <input className="input" placeholder="Helmets, tents..." value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
      </div>
      <div>
        <label className="label">Category</label>
        <select className="input" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.parent} · {c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Sort by</label>
        <select className="input" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
          <option value="-createdAt">Newest</option>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
          <option value="-ratings.average">Top Rated</option>
        </select>
      </div>
      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <input
          type="checkbox"
          checked={filters.featured === 'true'}
          onChange={(e) => setFilters({ ...filters, featured: e.target.checked ? 'true' : '' })}
        />
        <span>Show featured only</span>
      </label>
    </div>
  );

  return (
    <div className="container-x pt-28 sm:pt-32 pb-16">
      <div className="mb-8">
        <p className="eyebrow mb-2">CATALOG</p>
        <h1 className="section-title">SHOP ALL GEAR</h1>
        <p className="text-charcoal-400 mt-2 max-w-xl">Riding, travel, and adventure essentials — curated by Angels & Roadsters.</p>
      </div>

      <button
        onClick={() => setFiltersOpen(true)}
        className="lg:hidden btn btn-outline mb-5 w-full"
      >
        ⚙ Filters & Sort ({Object.values(filters).filter(Boolean).length})
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        <aside className="hidden lg:block card-glass p-5 h-fit sticky top-24">
          <Filters />
        </aside>

        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square bg-charcoal-900 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-charcoal-300 text-lg">No products match.</p>
              <p className="text-sm text-charcoal-500 mt-2">Try a different search or clear filters.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-charcoal-400 mb-4">{products.length} products</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            </>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/80 backdrop-blur lg:hidden" onClick={() => setFiltersOpen(false)}>
          <div className="absolute inset-x-0 bottom-0 bg-charcoal-950 rounded-t-3xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-charcoal-700 rounded-full mx-auto mb-5" />
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-2xl">Filters</h3>
              <button onClick={() => setFiltersOpen(false)} className="text-2xl">✕</button>
            </div>
            <Filters />
            <button onClick={() => setFiltersOpen(false)} className="btn btn-gold w-full mt-6">Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-x pt-32 pb-16 text-charcoal-400">Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}
