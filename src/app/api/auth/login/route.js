import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { signAccessToken, signRefreshToken, setAuthCookies } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function POST(req) {
  return handler(async () => {
    const { email, password } = await req.json();
    if (!email || !password) return fail('Email and password required', 400);
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return fail('Invalid credentials', 401);
    if (user.isBanned) return fail('Account banned', 403);
    const match = await user.matchPassword(password);
    if (!match) return fail('Invalid credentials', 401);
    const access = signAccessToken(user._id.toString());
    const refresh = signRefreshToken(user._id.toString());
    setAuthCookies(cookies(), { access, refresh });
    const safe = toJSON(user);
    delete safe.password;
    return ok({ user: safe, accessToken: access });
  });
}
