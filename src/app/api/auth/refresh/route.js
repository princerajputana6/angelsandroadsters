import { cookies } from 'next/headers';
import { verifyRefresh, signAccessToken, setAuthCookies } from '@/lib/auth';
import { ok, fail, handler } from '@/lib/apiUtils';

export async function POST() {
  return handler(async () => {
    const store = cookies();
    const token = store.get('refreshToken')?.value;
    if (!token) return fail('No refresh token', 401);
    const payload = verifyRefresh(token);
    const access = signAccessToken(payload.id);
    setAuthCookies(store, { access });
    return ok({ accessToken: access });
  });
}
