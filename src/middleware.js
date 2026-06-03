// Next.js middleware that silently rotates the access cookie whenever the
// JWT is missing or expired but a valid refresh token is still present.
//
// Why this exists:
//   - `getCurrentUser()` in lib/auth.js already does an in-process refresh,
//     but the Set-Cookie it writes during a server component render is a no-op
//     (cookies are read-only in pure server components).
//   - This middleware runs *before* the route handler / server component, so
//     it can safely set the new cookie on the outgoing response. Result:
//     the user never sees a "session expired" page just because they refreshed.

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const ACCESS_TTL = process.env.JWT_EXPIRES_IN || '30d';

// Cookie attributes — must match lib/auth.js setAuthCookies()
const COOKIE = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

function isAccessAlive(token) {
  if (!token || !process.env.JWT_SECRET) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

function tryReissueAccess(refreshToken) {
  if (!refreshToken || !process.env.JWT_REFRESH_SECRET || !process.env.JWT_SECRET) return null;
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    return jwt.sign({ id: payload.id }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
  } catch {
    return null;
  }
}

export function middleware(req) {
  const access = req.cookies.get('accessToken')?.value;
  if (isAccessAlive(access)) {
    return NextResponse.next();
  }

  const refresh = req.cookies.get('refreshToken')?.value;
  if (!refresh) {
    return NextResponse.next();
  }

  const newAccess = tryReissueAccess(refresh);
  if (!newAccess) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  res.cookies.set('accessToken', newAccess, COOKIE);
  // Also forward the new cookie so the downstream route handler sees it on
  // the same request (req.cookies is mutable in Next.js middleware).
  req.cookies.set('accessToken', newAccess);
  return res;
}

// Skip Next internals and static assets — only run on real app routes.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|favicon.png|icon.png|logos|images|uploads).*)',
  ],
};
