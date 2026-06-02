'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { useGetProductQuery, useListProductsQuery } from '@/store/api';
import { addItem } from '@/store/cartSlice';
import ProductCarousel from '@/components/shop/ProductCarousel';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { data, isLoading } = useGetProductQuery(slug);
  const product = data?.product;
  const { data: rel } = useListProductsQuery({ limit: 12, sort: '-ratings.average' });
  const [active, setActive] = useState(0);
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const dispatch = useDispatch();

  if (isLoading) return <div className="container-x py-32 text-charcoal-300">Loading...</div>;
  if (!product) return <div className="container-x py-32">Product not found</div>;

  const price = product.discountedPrice || product.price;
  const discount = product.discountedPrice && product.price > product.discountedPrice
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100) : 0;
  const images = product.images?.length ? product.images : [product.thumbnail || `https://picsum.photos/seed/${product._id}/900`];

  const handleAdd = () => {
    dispatch(addItem({
      product: product._id, name: product.name, image: images[0], price,
      slug: product.slug, size, quantity: qty,
    }));
    toast.success('Added to cart');
  };

  const related = (rel?.products || []).filter((p) => p._id !== product._id);

  return (
    <div className="pt-24 sm:pt-28 pb-16">
      <div className="container-x">
        <nav className="text-xs text-charcoal-500 mb-6">
          <a href="/" className="hover:text-terra-400">Home</a> / <a href="/shop" className="hover:text-terra-400">Shop</a> / <span className="text-charcoal-300">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="aspect-square bg-charcoal-900 rounded-3xl overflow-hidden border border-charcoal-800">
              <img src={images[active]} alt={product.name} className="w-full h-full object-cover" />
            </motion.div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition ${i === active ? 'border-terra-500' : 'border-transparent hover:border-charcoal-700'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="chip">{product.brand || 'Angels & Roadsters'}</span>
              {product.isFeatured && <span className="chip border-gold-500/40 text-gold-400">★ Featured</span>}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display leading-tight">{product.name}</h1>
            <div className="flex items-center gap-3 mt-3 text-sm text-charcoal-300">
              <span className="text-yellow-400">★ {(product.ratings?.average || 0).toFixed(1)}</span>
              <span className="text-charcoal-600">·</span>
              <span>{product.ratings?.count || 0} reviews</span>
              <span className="text-charcoal-600">·</span>
              <span className={product.stock > 0 ? 'text-green-400' : 'text-red-400'}>
                {product.stock > 0 ? `In stock (${product.stock})` : 'Out of stock'}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mt-6">
              <span className="text-4xl sm:text-5xl font-display text-terra-400">₹{price?.toLocaleString()}</span>
              {discount > 0 && (
                <>
                  <span className="text-lg line-through text-charcoal-500">₹{product.price?.toLocaleString()}</span>
                  <span className="badge bg-terra-500/20 text-terra-400">-{discount}%</span>
                </>
              )}
            </div>

            <p className="mt-5 text-charcoal-200 leading-relaxed">{product.description}</p>

            {product.sizes?.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="label">Size</label>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`min-w-[52px] h-12 px-4 rounded-xl border font-semibold transition ${
                        size === s ? 'border-terra-500 text-terra-400 bg-terra-500/10' : 'border-charcoal-700 text-charcoal-200 hover:border-charcoal-500'
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <label className="label">Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-charcoal-900 rounded-full border border-charcoal-800 p-1">
                  <button className="w-10 h-10 rounded-full hover:bg-terra-500/20" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                  <span className="w-10 text-center font-bold">{qty}</span>
                  <button className="w-10 h-10 rounded-full hover:bg-terra-500/20" onClick={() => setQty(qty + 1)}>+</button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-7">
              <button onClick={handleAdd} disabled={product.stock === 0} className="btn btn-gold flex-1 h-12 text-base disabled:opacity-50">
                {product.stock === 0 ? 'Out of stock' : 'Add to Cart'}
              </button>
              <button className="btn btn-outline w-12 h-12 p-0" aria-label="Wishlist">♡</button>
            </div>

            {/* Trust badges — driven by admin-controlled product fields */}
            {(() => {
              const badges = [];
              const d = product.delivery || {};
              const r = product.returnPolicy || {};
              if (d.free) {
                badges.push({ i: '🚚', t: d.note || 'Free delivery' });
              } else if (d.fee > 0) {
                badges.push({ i: '🚚', t: `Delivery ₹${d.fee}${d.etaDays ? ` · ${d.etaDays}d` : ''}` });
              } else if (d.etaDays > 0) {
                badges.push({ i: '🚚', t: `Delivers in ${d.etaDays}d` });
              }
              if (r.available !== false) {
                const days = r.days ?? 30;
                badges.push({ i: '↩️', t: `${days}-day returns` });
              } else {
                badges.push({ i: '🚫', t: 'No returns' });
              }
              badges.push({ i: '🔒', t: 'Secure checkout' });
              const colsClass = badges.length === 1 ? 'grid-cols-1' : badges.length === 2 ? 'grid-cols-2' : 'grid-cols-3';
              return (
                <div className={`grid gap-2 mt-7 text-center ${colsClass}`}>
                  {badges.map((b, idx) => (
                    <div key={idx} className="card p-3">
                      <div className="text-lg">{b.i}</div>
                      <div className="text-[11px] text-charcoal-400 mt-1">{b.t}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Tax / return / delivery details */}
            {(product.tax?.note || (product.tax?.rate > 0) || product.returnPolicy?.note || product.delivery?.note) && (
              <div className="mt-4 card p-4 space-y-1.5 text-xs text-charcoal-300">
                {product.tax?.note ? (
                  <div className="flex gap-2"><span className="text-charcoal-500 w-16 shrink-0">Tax</span><span>{product.tax.note}</span></div>
                ) : product.tax?.rate > 0 ? (
                  <div className="flex gap-2"><span className="text-charcoal-500 w-16 shrink-0">Tax</span><span>{product.tax.rate}%{product.tax.included ? ' · included in price' : ' · added at checkout'}</span></div>
                ) : null}
                {product.delivery?.note && (
                  <div className="flex gap-2"><span className="text-charcoal-500 w-16 shrink-0">Delivery</span><span>{product.delivery.note}</span></div>
                )}
                {product.returnPolicy?.note && (
                  <div className="flex gap-2"><span className="text-charcoal-500 w-16 shrink-0">Returns</span><span>{product.returnPolicy.note}</span></div>
                )}
              </div>
            )}

            {product.specifications && Object.keys(product.specifications || {}).length > 0 && (
              <div className="mt-8">
                <h3 className="font-display text-2xl mb-3">Specifications</h3>
                <div className="card divide-y divide-charcoal-800">
                  {Object.entries(product.specifications).map(([k, v]) => (
                    <div key={k} className="flex justify-between p-3 text-sm">
                      <span className="text-charcoal-400">{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <ProductCarousel
          eyebrow="YOU MIGHT ALSO LIKE"
          title="MORE GEAR LIKE THIS"
          products={related.slice(0, 10)}
        />
      )}
    </div>
  );
}
