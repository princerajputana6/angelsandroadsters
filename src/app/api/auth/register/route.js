import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { signAccessToken, signRefreshToken, setAuthCookies } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function POST(req) {
  return handler(async () => {
    const { name, email, password, phone } = await req.json();
    if (!name || !email || !password) return fail('Missing required fields', 400);
    await connectDB();
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return fail('Email already registered', 409);
    const user = await User.create({ name, email, password, phone });
    const access = signAccessToken(user._id.toString());
    const refresh = signRefreshToken(user._id.toString());
    setAuthCookies(cookies(), { access, refresh });
    const safe = toJSON(user);
    delete safe.password;
    return ok({ user: safe, accessToken: access }, 201);
  });
}
