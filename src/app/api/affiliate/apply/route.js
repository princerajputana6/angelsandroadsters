import { connectDB } from '@/lib/db';
import Affiliate from '@/lib/models/Affiliate';
import { requireUser } from '@/lib/auth';
import { generateAffiliateCode } from '@/lib/affiliate';
import { ok, handler, toJSON } from '@/lib/apiUtils';

// Enroll the current user in the affiliate program. Instant enrollment: a
// unique code + working URL are created on submit. If the user already has an
// affiliate record, their application details are updated instead (idempotent).
export async function POST(req) {
  return handler(async () => {
    const user = await requireUser();
    await connectDB();
    const body = await req.json();

    const fields = {
      displayName: body.displayName,
      phone: body.phone,
      instagram: body.instagram,
      youtube: body.youtube,
      otherSocial: body.otherSocial,
      audienceSize: body.audienceSize,
      promoDescription: body.promoDescription,
      payoutUpiId: body.payoutUpiId,
      payoutName: body.payoutName,
    };

    let affiliate = await Affiliate.findOne({ user: user._id });
    if (affiliate) {
      Object.assign(affiliate, fields);
      await affiliate.save();
    } else {
      const code = await generateAffiliateCode(user.name);
      affiliate = await Affiliate.create({ user: user._id, code, ...fields });
    }

    return ok({ affiliate: toJSON(affiliate) }, 201);
  });
}
