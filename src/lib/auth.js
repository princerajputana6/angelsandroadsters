import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { connectDB } from './db';
import User from './models/User';

// Long-lived sessions by default — admins and customers should stay signed
// in for weeks unless they explicitly log out. The TTLs can still be
// overridden via env (.env.local) without code changes.
const ACCESS_TTL = process.env.JWT_EXPIRES_IN || '30d';
const REFRESH_TTL = process.env.JWT_REFRESH_EXPIRES_IN || '90d';

// Cookie max-age (seconds) — match the JWT TTLs so the cookie outlives the
// browser session.
const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;   // 30 days
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;  // 90 days

export const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });

export const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });

export const verifyAccess = (token) => jwt.verify(token, process.env.JWT_SECRET);
export const verifyRefresh = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

export const setAuthCookies = (cookieStore, { access, refresh }) => {
  const common = { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production' };
  if (access) cookieStore.set('accessToken', access, { ...common, maxAge: ACCESS_COOKIE_MAX_AGE });
  if (refresh) cookieStore.set('refreshToken', refresh, { ...common, maxAge: REFRESH_COOKIE_MAX_AGE });
};

export const clearAuthCookies = (cookieStore) => {
  cookieStore.set('accessToken', '', { path: '/', maxAge: 0 });
  cookieStore.set('refreshToken', '', { path: '/', maxAge: 0 });
};

// Try to silently rotate a fresh access token from the refresh cookie.
// Returns the decoded payload (with .id) on success, or null. Safe to call
// from server components — if cookies() is read-only we just skip the write.
function tryRefresh(store) {
  try {
    const refreshToken = store.get('refreshToken')?.value;
    if (!refreshToken) return null;
    const payload = verifyRefresh(refreshToken);
    const newAccess = signAccessToken(payload.id);
    try {
      // Mutating cookies works in route handlers/server actions but is a no-op
      // (throws) in pure server components. Swallow the failure either way.
      setAuthCookies(store, { access: newAccess });
    } catch (_) { /* read-only context — ok */ }
    return payload;
  } catch (_) {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const store = cookies();
    const accessToken = store.get('accessToken')?.value;

    let payload = null;
    if (accessToken) {
      try {
        payload = verifyAccess(accessToken);
      } catch (_) {
        // expired/invalid access token — fall through to refresh
      }
    }

    // No valid access token? Try to silently rotate from the refresh token.
    if (!payload) {
      payload = tryRefresh(store);
      if (!payload) return null;
    }

    await connectDB();
    const user = await User.findById(payload.id).lean();
    if (!user || user.isBanned) return null;
    return JSON.parse(JSON.stringify(user));
  } catch (_) {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw Object.assign(new Error('Not authenticated'), { status: 401 });
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') throw Object.assign(new Error('Admin only'), { status: 403 });
  return user;
}
