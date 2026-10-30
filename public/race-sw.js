/* Race Management service worker (plan §7.3).
 *
 * Deliberately conservative so it NEVER disturbs the rest of the site:
 * its fetch handler only intercepts
 *   - navigations under /race-control  (network-first, cache fallback)
 *   - Next.js static assets (/_next/static, cache-first)
 * Every other request (other pages, ALL /api calls, auth) falls through to the
 * browser untouched — no event.respondWith, so default behaviour is preserved.
 *
 * It never caches API responses or anything authenticated (plan §7.3, §7.2).
 * It never deletes IndexedDB or queued events on activation (plan §7.3).
 */
const CACHE = 'race-shell-v2';

self.addEventListener('install', () => {
  // Activate immediately; there is nothing we must precache (the roster/config
  // lives in IndexedDB, not here).
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Only drop OUR old shell caches; never touch other caches or IndexedDB.
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('race-shell-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

function isRaceNavigation(request, url) {
  return request.mode === 'navigate' &&
    (url.pathname.startsWith('/race-control') || url.pathname.startsWith('/race-board'));
}
function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname === '/race-sw.js' || url.pathname === '/manifest.webmanifest';
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never touch mutations
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // never cache API/auth

  if (isRaceNavigation(request, url)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch (_) {
          const cached = await caches.match(request);
          return cached || (await caches.match('/race-control')) || Response.error();
        }
      })()
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch (_) {
          return cached || Response.error();
        }
      })()
    );
  }
  // Everything else: fall through to the network as normal.
});
