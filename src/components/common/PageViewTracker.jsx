'use client';
import { useEffect } from 'react';
import { getRef } from '@/lib/ref';

// Fires a single visit beacon per browser session for the given logical page.
// Mount it on any page you want to measure (e.g. the Trailstorm event page).
// Server derives geo from Vercel headers; we just pass referrer + utm + ref.
export default function PageViewTracker({ page }) {
  useEffect(() => {
    if (!page) return;
    try {
      // One count per session per page — avoids inflating on re-render / HMR
      // and treats a returning-within-session visitor as one visit.
      const key = `pv_${page}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');

      const params = new URLSearchParams(window.location.search);
      fetch('/api/track/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          path: window.location.pathname,
          referrer: document.referrer || '',
          utmSource: params.get('utm_source') || '',
          ref: getRef() || params.get('ref') || '',
        }),
        keepalive: true,
      }).catch(() => {});
    } catch (_) { /* ignore */ }
  }, [page]);

  return null;
}
