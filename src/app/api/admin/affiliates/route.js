import { connectDB } from '@/lib/db';
import Affiliate from '@/lib/models/Affiliate';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/auth';
import { generateAffiliateCode } from '@/lib/affiliate';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

// List every affiliate with the linked user's basic details. Stats live on the
// affiliate record (denormalized counters), so no aggregation needed here.
export async function GET() {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const affiliates = await Affiliate.find()
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .lean();
    return ok({ affiliates: toJSON(affiliates) });
  });
}

// Admin onboards an affiliate member: creates their login account (email +
// password the admin chooses) and the affiliate record in one step. The member
// then signs in with those credentials to see their affiliate dashboard.
export async function POST(req) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();

    const name = (body.name || '').trim();
    const email = (body.email || '').toLowerCase().trim();
    if (!name || !email) return fail('Name and email are required', 400);

    const affiliateFields = {
      displayName: body.displayName || name,
      phone: body.phone,
      instagram: body.instagram,
      youtube: body.youtube,
      otherSocial: body.otherSocial,
      audienceSize: body.audienceSize,
      promoDescription: body.promoDescription,
      payoutUpiId: body.payoutUpiId,
      payoutName: body.payoutName || name,
      discountPercent: Math.max(0, Math.min(100, Number(body.discountPercent) || 0)),
      commissionPercent: Math.max(0, Math.min(100, Number(body.commissionPercent) || 0)),
    };

    // Resolve the login account: reuse an existing user, otherwise create one.
    let user = await User.findOne({ email });
    let accountNote;
    if (user) {
      const already = await Affiliate.findOne({ user: user._id });
      if (already) return fail('This account is already an affiliate', 409);
      // Don't silently reset an existing customer's password on onboarding.
      accountNote = 'Linked existing account — their existing password is unchanged.';
    } else {
      const password = body.password || '';
      if (password.length < 6) return fail('Password must be at least 6 characters', 400);
      user = await User.create({ name, email, password, phone: body.phone });
      accountNote = 'New login account created with the provided password.';
    }

    const code = await generateAffiliateCode(name);
    const affiliate = await Affiliate.create({ user: user._id, code, ...affiliateFields });

    const populated = await Affiliate.findById(affiliate._id).populate('user', 'name email phone').lean();
    return ok({ affiliate: toJSON(populated), accountNote }, 201);
  });
}
