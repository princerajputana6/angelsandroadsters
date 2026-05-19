'use client';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { addItem } from '@/store/cartSlice';
import toast from 'react-hot-toast';

export default function ProductCard({ product, variant = 'default' }) {
  const dispatch = useDispatch();
  const price = product.discountedPrice || product.price;
  const discount = product.discountedPrice && product.price > product.discountedPrice
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
    : 0;
  const img = product.thumbnail || product.images?.[0] || `https://picsum.photos/seed/${product._id}/700`;

  const addToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addItem({
      product: product._id,
      name: product.name,
      image: img,
      price,
      slug: product.slug,
      quantity: 1,
    }));
    toast.success('Added to cart');
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'tween', duration: 0.2 }}>
      <Link href={`/shop/${product.slug}`} className="group block">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-charcoal-900 border border-charcoal-800 group-hover:border-terra-500/50 transition">
          <img
            src={img}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[800ms] ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-transparent to-transparent opacity-60" />

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount > 0 && <span className="badge bg-terra-500 text-white">-{discount}%</span>}
            {product.isFeatured && <span className="badge bg-gold-500/90 text-charcoal-950">★ Featured</span>}
          </div>
          {product.stock === 0 && (
            <span className="absolute top-3 right-3 badge bg-red-600 text-white">Out of stock</span>
          )}

          {/* Hover quick-add */}
          <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button onClick={addToCart} disabled={product.stock === 0} className="btn btn-gold w-full text-xs h-10 disabled:opacity-50">
              {product.stock === 0 ? 'Sold Out' : 'Quick Add'}
            </button>
          </div>
        </div>

        <div className="pt-4 px-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-charcoal-400 uppercase tracking-[0.2em]">{product.brand || 'Angeles & Roadsters'}</span>
            <span className="text-[11px] text-yellow-400">★ {(product.ratings?.average || 0).toFixed(1)}</span>
          </div>
          <h3 className="font-semibold mt-1 line-clamp-2 group-hover:text-terra-400 transition text-[15px]">{product.name}</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-lg font-bold text-white">₹{price?.toLocaleString()}</span>
            {discount > 0 && <span className="text-xs line-through text-charcoal-500">₹{product.price?.toLocaleString()}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
