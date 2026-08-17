'use client';
import { useEffect } from 'react';
import { saveRef } from '@/lib/ref';

// Mounted app-wide. When any page loads with ?ref=CODE, persist the code and
// count the click once per browser session. Purely a side effect — renders
// nothing and never blocks the page.
export default function RefCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('ref');
      if (!code) return;
      saveRef(code);

      // Count the click at most once per session per code.
      const seenKey = `aff_click_${code.toUpperCase().trim()}`;
      if (!sessionStorage.getItem(seenKey)) {
        sessionStorage.setItem(seenKey, '1');
        fetch('/api/affiliate/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        }).catch(() => {});
      }
    } catch (_) { /* ignore */ }
  }, []);

  return null;
}
