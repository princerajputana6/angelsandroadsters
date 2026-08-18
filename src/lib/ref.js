// Client-side helpers for the affiliate referral code captured from ?ref=CODE.
// The last-seen code is persisted in localStorage so it survives navigation and
// login, then read back when a registration or order is created.
const KEY = 'aff_ref';

// Affiliate share links land on the Trailstorm event page (the program's main
// funnel). RefCapture works on any page, so the ?ref is still honored if the
// visitor navigates elsewhere before converting.
export const AFFILIATE_LINK_PATH = '/trailstorm/2026-jaisalmer-trailstorm-event';

// Build the full shareable affiliate URL for a code, given an origin.
export function buildAffiliateUrl(origin, code) {
  if (!code) return '';
  const base = (origin || '').replace(/\/$/, '');
  return `${base}${AFFILIATE_LINK_PATH}?ref=${code}`;
}

export function saveRef(code) {
  if (typeof window === 'undefined' || !code) return;
  try { localStorage.setItem(KEY, String(code).toUpperCase().trim()); } catch (_) {}
}

export function getRef() {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(KEY) || null; } catch (_) { return null; }
}

export function clearRef() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(KEY); } catch (_) {}
}
