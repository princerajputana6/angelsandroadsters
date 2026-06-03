'use client';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { updateQty, removeItem, selectCartTotal } from '@/store/cartSlice';
import { computeOrderTotals } from '@/lib/pricing';

export default function CartPage() {
  const items = useSelector((s) => s.cart.items);
  const total = useSelector(selectCartTotal);
  const dispatch = useDispatch();

  if (items.length === 0) {
    return (
      <div className="container-x pt-32 pb-20 text-center">
        <div className="text-7xl mb-4">🛒</div>
        <h1 className="section-title">YOUR CART IS EMPTY</h1>
        <p className="text-charcoal-400 mt-2 mb-7">Time to gear up for the next ride.</p>
        <Link href="/shop" className="btn btn-gold">Browse Shop</Link>
      </div>
    );
  }

  const { shippingPrice: shipping, taxPrice: tax, totalPrice: grand } = computeOrderTotals(items);

  return (
    <div className="container-x pt-28 sm:pt-32 pb-32 lg:pb-10">
      <div className="mb-6">
        <p className="eyebrow mb-2">CHECKOUT · STEP 1</p>
        <h1 className="section-title">YOUR CART</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-10">
        <div className="space-y-3">
          {items.map((item, idx) => (
            <motion.div
              key={item.product + (item.size || '')}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
              className="card p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center"
            >
              <Link href={`/shop/${item.slug}`} className="shrink-0">
                <img src={item.image} alt={item.name} className="w-full sm:w-24 h-32 sm:h-24 object-cover rounded-xl" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/shop/${item.slug}`} className="font-semibold hover:text-terra-400 line-clamp-2">{item.name}</Link>
                {item.size && <p className="text-xs text-charcoal-400 mt-1">Size: {item.size}</p>}
                <p className="text-terra-400 font-bold mt-1">₹{item.price?.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <div className="flex items-center gap-1.5 bg-charcoal-900 rounded-full border border-charcoal-800 p-1">
                  <button className="w-8 h-8 rounded-full hover:bg-terra-500/20" onClick={() => dispatch(updateQty({ product: item.product, quantity: item.quantity - 1 }))}>−</button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button className="w-8 h-8 rounded-full hover:bg-terra-500/20" onClick={() => dispatch(updateQty({ product: item.product, quantity: item.quantity + 1 }))}>+</button>
                </div>
                <button onClick={() => dispatch(removeItem(item.product))} className="text-red-400/80 hover:text-red-400 text-sm" aria-label="Remove">
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary - sticky bottom on mobile */}
        <div className="hidden lg:block">
          <div className="card-glass p-6 sticky top-24">
            <h3 className="font-display text-2xl mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-charcoal-400">Subtotal</span><span>₹{total.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-charcoal-400">Shipping</span><span>{shipping === 0 ? <span className="text-terra-400">FREE</span> : `₹${shipping}`}</span></div>
              <div className="flex justify-between"><span className="text-charcoal-400">Tax</span><span>{tax > 0 ? `₹${tax.toLocaleString()}` : <span className="text-charcoal-500">Included</span>}</span></div>
              <div className="border-t border-charcoal-800 my-3" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span><span className="text-terra-400">₹{grand.toLocaleString()}</span>
              </div>
            </div>
            <Link href="/checkout" className="btn btn-gold w-full mt-5">Proceed to Checkout →</Link>
            <p className="text-[10px] text-charcoal-500 mt-3 text-center">Shipping &amp; tax determined per item · 30-day returns where applicable</p>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-charcoal-950/95 backdrop-blur border-t border-charcoal-800 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-charcoal-400 uppercase tracking-wider">Total ({items.length} items)</div>
            <div className="text-xl font-bold text-terra-400">₹{grand.toLocaleString()}</div>
          </div>
          <Link href="/checkout" className="btn btn-gold flex-1 h-12">Checkout →</Link>
        </div>
      </div>
    </div>
  );
}
