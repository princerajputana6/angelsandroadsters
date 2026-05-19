import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { connectDB } from './db';
import User from './models/User';

const ACCESS_TTL = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TTL = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });

export const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });

export const verifyAccess = (token) => jwt.verify(token, process.env.JWT_SECRET);
export const verifyRefresh = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

export const setAuthCookies = (cookieStore, { access, refresh }) => {
  const common = { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production' };
  if (access) cookieStore.set('accessToken', access, { ...common, maxAge: 60 * 60 });
  if (refresh) cookieStore.set('refreshToken', refresh, { ...common, maxAge: 60 * 60 * 24 * 7 });
};

export const clearAuthCookies = (cookieStore) => {
  cookieStore.set('accessToken', '', { path: '/', maxAge: 0 });
  cookieStore.set('refreshToken', '', { path: '/', maxAge: 0 });
};

export async function getCurrentUser() {
  try {
    const store = cookies();
    const token = store.get('accessToken')?.value;
    if (!token) return null;
    const payload = verifyAccess(token);
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
