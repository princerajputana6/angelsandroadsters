// Client-side helpers for the affiliate referral code captured from ?ref=CODE.
// The last-seen code is persisted in localStorage so it survives navigation and
// login, then read back when a registration or order is created.
const KEY = 'aff_ref';

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
