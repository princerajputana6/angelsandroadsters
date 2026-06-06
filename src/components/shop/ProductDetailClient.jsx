'use client';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { useListProductsQuery } from '@/store/api';
import { addItem } from '@/store/cartSlice';
import ProductCarousel from '@/components/shop/ProductCarousel';
import toast from 'react-hot-toast';

export default function ProductDetailClient({ product }) {
  const { data: rel } = useListProductsQuery({ limit: 12, sort: '-ratings.average' });
  const [active, setActive] = useState(0);
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const dispatch = useDispatch();

  const price = product.discountedPrice || product.price;
  const discount = product.discountedPrice && product.price > product.discountedPrice
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100) : 0;
  const images = product.images?.length ? product.images : [product.thumbnail || `https://picsum.photos/seed/${product._id}/900`];

  const handleAdd = () => {
    dispatch(addItem({
      product: product._id, name: product.name, image: images[0], price,
      slug: product.slug, size, quantity: qty,
      // snapshot admin-controlled pricing rules so cart can compute totals
      delivery: product.delivery || {},
      tax: product.tax || {},
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
            <div className="sticky top-28">
              <div className="aspect-square rounded-2xl bg-charcoal-100 overflow-hidden mb-4">
                <img src={images[active]} alt={product.name} className="w-full h-full object-cover" />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActive(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                        active === index ? 'border-terra-400' : 'border-charcoal-200'
                      }`}
                    >
                      <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              {product.brand && (
                <p className="text-sm text-terra-400 font-medium mb-2">{product.brand}</p>
              )}
              <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-800 mb-4">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-charcoal-800">₹{price.toLocaleString()}</span>
                  {discount > 0 && (
                    <>
                      <span className="text-lg text-charcoal-500 line-through">₹{product.price.toLocaleString()}</span>
                      <span className="text-sm bg-terra-400 text-white px-2 py-1 rounded">{discount}% OFF</span>
                    </>
                  )}
                </div>
              </div>

              {product.ratings?.count > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(product.ratings.average) ? 'text-yellow-400' : 'text-charcoal-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-charcoal-600">
                    {product.ratings.average.toFixed(1)} ({product.ratings.count} reviews)
                  </span>
                </div>
              )}

              <div className="prose prose-sm max-w-none text-charcoal-600 mb-8">
                {product.richDescription ? (
                  <div dangerouslySetInnerHTML={{ __html: product.richDescription }} />
                ) : (
                  <p>{product.description}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {product.sizes?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">Size</label>
                  <div className="flex gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium transition ${
                          size === s
                            ? 'border-terra-400 bg-terra-50 text-terra-700'
                            : 'border-charcoal-300 text-charcoal-600 hover:border-charcoal-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-10 border border-charcoal-300 rounded-lg flex items-center justify-center text-charcoal-600 hover:border-charcoal-400 transition"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-medium">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
                    className="w-10 h-10 border border-charcoal-300 rounded-lg flex items-center justify-center text-charcoal-600 hover:border-charcoal-400 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAdd}
                  disabled={product.stock === 0 || (product.sizes?.length > 0 && !size)}
                  className="flex-1 bg-terra-400 text-white py-3 px-6 rounded-xl font-medium hover:bg-terra-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </motion.button>
                <button className="p-3 border border-charcoal-300 rounded-xl hover:border-charcoal-400 transition">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              <div className="text-sm text-charcoal-600 space-y-1 pt-4 border-t border-charcoal-200">
                <p className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-terra-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Free shipping on orders over ₹1,999
                </p>
                <p className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-terra-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Easy returns within 30 days
                </p>
                {product.stock > 0 && (
                  <p className="text-green-600">✓ In stock ({product.stock} available)</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-charcoal-800 mb-8">Specifications</h2>
            <div className="bg-charcoal-50 rounded-2xl p-8">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="border-b border-charcoal-200 pb-2 last:border-b-0">
                    <dt className="text-sm font-medium text-charcoal-600 capitalize">{key}</dt>
                    <dd className="text-charcoal-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-charcoal-800 mb-8">Related Products</h2>
            <ProductCarousel products={related} />
          </div>
        )}
      </div>
    </div>
  );
}