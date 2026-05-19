'use client';

let scriptPromise = null;
function loadScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
  return scriptPromise;
}

export async function payWithRazorpay({
  amount,
  currency = 'INR',
  receipt,
  notes = {},
  name = 'Angeles & Roadsters',
  description = '',
  prefill = {},
  kind,
  referenceId,
  onSuccess,
  onFailure,
}) {
  const loaded = await loadScript();
  if (!loaded) {
    onFailure?.(new Error('Failed to load Razorpay SDK. Check your connection.'));
    return;
  }

  // 1. create order on server
  const res = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency, receipt, notes }),
  });
  const data = await res.json();
  if (!res.ok) {
    onFailure?.(new Error(data.message || 'Could not create payment order'));
    return;
  }

  // 2. open checkout
  const options = {
    key: data.keyId,
    amount: data.amount,
    currency: data.currency,
    name,
    description,
    order_id: data.orderId,
    prefill,
    notes,
    theme: { color: '#f97316' },
    handler: async (resp) => {
      try {
        const v = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...resp, kind, referenceId }),
        });
        const vj = await v.json();
        if (!v.ok || !vj.verified) throw new Error(vj.message || 'Verification failed');
        onSuccess?.(resp);
      } catch (err) {
        onFailure?.(err);
      }
    },
    modal: {
      ondismiss: () => onFailure?.(new Error('Payment cancelled')),
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}
