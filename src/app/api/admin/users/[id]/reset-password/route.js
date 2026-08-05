import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler } from '@/lib/apiUtils';

// Admin-only direct password reset. Since there's no self-service "forgot
// password" flow, an admin can set a new password for any user here. We load
// the document and call .save() (rather than findByIdAndUpdate) so the User
// pre-save hook hashes the new password with bcrypt.
export async function POST(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    const { password } = await req.json();
    if (!password || typeof password !== 'string' || password.length < 6) {
      return fail('Password must be at least 6 characters', 400);
    }
    await connectDB();
    const user = await User.findById(params.id).select('+password');
    if (!user) return fail('User not found', 404);
    user.password = password;
    await user.save();
    return ok({ message: 'Password reset' });
  });
}
