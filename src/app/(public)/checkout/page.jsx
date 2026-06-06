'use client';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useCreateOrderMutation,
  useMeQuery,
  useMyAddressesQuery,
  useCancelOrderMutation,
} from '@/store/api';
import { clearCart, selectCartTotal } from '@/store/cartSlice';
import { computeOrderTotals } from '@/lib/pricing';
import { payWithRazorpay } from '@/lib/razorpayClient';
import toast from 'react-hot-toast';
import Link from 'next/link';

const EMPTY_ADDR = { name: '', line1: '', line2: '', city: '', state: '', postalCode: '', phone: '' };

export default function CheckoutPage() {
  const items = useSelector((s) => s.cart.items);
  const total = useSelector(selectCartTotal);
  const dispatch = useDispatch();
  const router = useRouter();
  const { data: meData } = useMeQuery();
  const { data: addrData } = useMyAddressesQuery(undefined, { skip: !meData?.user });
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [step, setStep] = useState(1);
  const [addr, setAddr] = useState(EMPTY_ADDR);
  const [selectedAddressId, setSelectedAddressId] = useState('new');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const savedAddresses = addrData?.addresses || [];

  // Pre-pick the default address when it loads
  useEffect(() => {
    if (savedAddresses.length === 0 || selectedAddressId !== 'new') return;
    const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
    if (def) {
      setSelectedAddressId(def._id);
      setAddr({
        name: def.label || meData?.user?.name || '',
        line1: def.line1, line2: def.line2 || '',
        city: def.city, state: def.state, postalCode: def.postalCode,
        phone: def.phone,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addrData]);

  const onPickAddress = (id) => {
    setSelectedAddressId(id);
    if (id === 'new') { setAddr(EMPTY_ADDR); return; }
    const a = savedAddresses.find((x) => x._id === id);
    if (a) {
      setAddr({
        name: a.label || meData?.user?.name || '',
        line1: a.line1, line2: a.line2 || '',
        city: a.city, state: a.state, postalCode: a.postalCode,
        phone: a.phone,
      });
    }
  };

  if (!meData?.user) {
    return (
      <div className="container-x pt-32 pb-20 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="section-title">SIGN IN TO CONTINUE</h1>
        <p className="text-charcoal-400 mt-2 mb-7">You need an account to place an order.</p>
        <Link href="/login?next=/checkout" className="btn btn-gold">Sign In</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-x pt-32 pb-20 text-center">
        <h1 className="section-title">Your cart is empty</h1>
        <Link href="/shop" className="btn btn-gold mt-6">Shop now</Link>
      </div>
    );
  }

  const { shippingPrice: shipping, taxPrice: tax, includedTaxPrice: taxIncluded, totalPrice: grand } = computeOrderTotals(items);

  const addrValid = addr.name && addr.line1 && addr.city && addr.state && addr.postalCode && addr.phone;

  const submit = async () => {
    try {
      const res = await createOrder({
        items: items.map((i) => ({ product: i.product, quantity: i.quantity, size: i.size, color: i.color })),
        shippingAddress: addr,
        paymentMethod,
      }).unwrap();
      const order = res.order;

      if (paymentMethod === 'cod') {
        dispatch(clearCart());
        toast.success('Order placed! 🎉 Pay on delivery.');
        router.push('/dashboard/orders');
        return;
      }

      // Razorpay flow — discard the just-created order if payment is cancelled
      await payWithRazorpay({
        amount: order.totalPrice,
        receipt: `ord_${order._id.slice(-12)}`,
        notes: { orderId: order._id },
        name: 'Angels & Roadsters',
        description: `Order ${order._id.slice(-8).toUpperCase()} · ${items.length} item(s)`,
        prefill: {
          name: addr.name,
          email: meData.user.email,
          contact: addr.phone,
        },
        kind: 'order',
        referenceId: order._id,
        onSuccess: () => {
          dispatch(clearCart());
          toast.success('Payment confirmed! 🎉');
          router.push('/dashboard/orders');
        },
        onFailure: async (err) => {
          // Cancel/delete the phantom order so the user doesn't see it
          try {
            await cancelOrder({ id: order._id, reason: 'payment_cancelled' }).unwrap();
          } catch (cancelErr) {
            console.error('[Checkout] Failed to discard cancelled-payment order:', cancelErr);
          }
          // Keep the cart so the user can retry
          toast.error(err?.message || 'Payment cancelled. No order was placed.');
        },
      });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to place order');
    }
  };

  const Stepper = () => (
    <div className="flex items-center gap-1 sm:gap-2 mb-8">
      {[
        { n: 1, l: 'Address' },
        { n: 2, l: 'Payment' },
        { n: 3, l: 'Review' },
      ].map((s, i, arr) => (
        <div key={s.n} className="flex items-center gap-2 flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            step >= s.n ? 'bg-terra-500 text-white' : 'bg-charcoal-800 text-charcoal-400'
          }`}>{step > s.n ? '✓' : s.n}</div>
          <span className={`text-xs sm:text-sm ${step >= s.n ? 'text-white' : 'text-charcoal-500'} hidden sm:block`}>{s.l}</span>
          {i < arr.length - 1 && <div className={`flex-1 h-px ${step > s.n ? 'bg-terra-500' : 'bg-charcoal-800'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="container-x pt-28 sm:pt-32 pb-32 lg:pb-10">
      <div className="mb-4">
        <p className="eyebrow mb-2">CHECKOUT</p>
        <h1 className="section-title">Almost there.</h1>
      </div>

      <Stepper />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-10">
        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="addr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="font-display text-2xl">Shipping Address</h3>
                  <Link href="/dashboard/addresses" className="text-xs text-terra-400 hover:text-terra-300">Manage addresses →</Link>
                </div>

                {savedAddresses.length > 0 && (
                  <div className="mb-5">
                    <label className="label">Choose a saved address</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {savedAddresses.map((a) => (
                        <button
                          type="button"
                          key={a._id}
                          onClick={() => onPickAddress(a._id)}
                          className={`text-left p-3 rounded-xl border transition ${
                            selectedAddressId === a._id
                              ? 'border-terra-500 bg-terra-500/10'
                              : 'border-charcoal-800 hover:border-charcoal-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold truncate">{a.label || 'Address'}</span>
                            {a.isDefault && <span className="badge bg-gold-500/20 text-gold-400 text-[9px]">Default</span>}
                          </div>
                          <p className="text-xs text-charcoal-400 mt-1 line-clamp-2">
                            {a.line1}, {a.city}, {a.state} {a.postalCode}
                          </p>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => onPickAddress('new')}
                        className={`text-left p-3 rounded-xl border transition ${
                          selectedAddressId === 'new'
                            ? 'border-terra-500 bg-terra-500/10'
                            : 'border-dashed border-charcoal-700 hover:border-charcoal-600'
                        }`}
                      >
                        <div className="text-sm font-semibold">+ Use a new address</div>
                        <p className="text-xs text-charcoal-500 mt-1">Enter below</p>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Full name</label>
                    <input className="input" required value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Address line 1</label>
                    <input className="input" required value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Address line 2 (optional)</label>
                    <input className="input" value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">City</label>
                    <input className="input" required value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">State</label>
                    <input className="input" required value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Postal code</label>
                    <input className="input" required value={addr.postalCode} onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" required value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} />
                  </div>
                </div>
                <button onClick={() => addrValid && setStep(2)} disabled={!addrValid} className="btn btn-gold mt-6 w-full sm:w-auto disabled:opacity-40">
                  Continue to Payment →
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="pm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="card p-5 sm:p-6">
                <h3 className="font-display text-2xl mb-4">Payment Method</h3>
                <div className="space-y-3">
                  {[
                    { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive your order', icon: '💵' },
                    { id: 'razorpay', label: 'UPI / Card / Netbanking', desc: 'Powered by Razorpay (stub)', icon: '💳' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition ${
                        paymentMethod === m.id ? 'border-terra-500 bg-terra-500/10' : 'border-charcoal-800 hover:border-charcoal-700'
                      }`}
                    >
                      <span className="text-2xl">{m.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold">{m.label}</div>
                        <div className="text-xs text-charcoal-400">{m.desc}</div>
                      </div>
                      <span className={`w-5 h-5 rounded-full border-2 ${paymentMethod === m.id ? 'border-terra-500 bg-terra-500' : 'border-charcoal-700'}`} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-6">
                  <button onClick={() => setStep(1)} className="btn btn-outline">← Back</button>
                  <button onClick={() => setStep(3)} className="btn btn-gold flex-1">Review Order →</button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="rv" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="card p-5">
                  <div className="flex justify-between items-start">
                    <h3 className="font-display text-2xl">Shipping</h3>
                    <button onClick={() => setStep(1)} className="text-xs text-terra-400">Edit</button>
                  </div>
                  <p className="text-sm text-charcoal-300 mt-2">{addr.name}<br />{addr.line1}, {addr.line2}<br />{addr.city}, {addr.state} {addr.postalCode}<br />📞 {addr.phone}</p>
                </div>
                <div className="card p-5">
                  <div className="flex justify-between items-start">
                    <h3 className="font-display text-2xl">Payment</h3>
                    <button onClick={() => setStep(2)} className="text-xs text-terra-400">Edit</button>
                  </div>
                  <p className="text-sm text-charcoal-300 mt-2 capitalize">{paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI / Card / Netbanking (Razorpay)'}</p>
                </div>
                <div className="card p-5">
                  <h3 className="font-display text-2xl mb-3">Items ({items.length})</h3>
                  <div className="divide-y divide-charcoal-800">
                    {items.map((i) => (
                      <div key={i.product + (i.size || '')} className="flex items-center gap-3 py-3">
                        <img src={i.image} alt={i.name} className="w-14 h-14 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{i.name}</p>
                          <p className="text-xs text-charcoal-400">× {i.quantity}</p>
                        </div>
                        <span className="text-sm font-bold">₹{(i.price * i.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={submit} disabled={isLoading} className="btn btn-gold w-full h-12 text-base">
                  {isLoading ? 'Placing order...' : `Place Order — ₹${grand.toLocaleString()}`}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order summary */}
        <div className="hidden lg:block">
          <div className="card-glass p-6 sticky top-24">
            <h3 className="font-display text-2xl mb-4">Order Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-charcoal-400">Subtotal ({items.length} items)</span><span>₹{total.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-charcoal-400">Shipping</span><span>{shipping === 0 ? <span className="text-terra-400">FREE</span> : `₹${shipping}`}</span></div>
              <div className="flex justify-between">
                <span className="text-charcoal-400">Tax</span>
                <span>
                  {tax > 0
                    ? `₹${tax.toLocaleString()}`
                    : taxIncluded > 0
                      ? <span className="text-charcoal-500">₹{taxIncluded.toLocaleString()} <span className="text-[10px]">incl.</span></span>
                      : <span className="text-charcoal-500">—</span>}
                </span>
              </div>
              <div className="border-t border-charcoal-800 my-3" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span><span className="text-terra-400">₹{grand.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-[10px] text-charcoal-500 mt-4 leading-relaxed">
              By placing this order you agree to our terms. Shipping &amp; tax are set per item by the seller.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile sticky total bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-charcoal-950/95 backdrop-blur border-t border-charcoal-800 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-charcoal-400 uppercase tracking-wider">Total · Step {step}/3</div>
            <div className="text-xl font-bold text-terra-400">₹{grand.toLocaleString()}</div>
          </div>
          {step === 3 ? (
            <button onClick={submit} disabled={isLoading} className="btn btn-gold flex-1 h-12">
              {isLoading ? 'Placing...' : 'Place Order'}
            </button>
          ) : (
            <button onClick={() => step === 1 ? (addrValid && setStep(2)) : setStep(3)} disabled={step === 1 && !addrValid} className="btn btn-gold flex-1 h-12 disabled:opacity-40">
              {step === 1 ? 'Continue →' : 'Review →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
