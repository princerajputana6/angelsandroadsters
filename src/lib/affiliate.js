import crypto from 'crypto';
import Affiliate from './models/Affiliate';
import AffiliateConversion from './models/AffiliateConversion';

const HOLD_DAYS = 7;

// Generate a short, human-shareable code from the person's name plus a random
// suffix, retrying until it's unique. e.g. "RAHUL-8FK2".
export async function generateAffiliateCode(name = '') {
  const base = (name || 'RIDER')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8) || 'RIDER';
  for (let i = 0; i < 6; i++) {
    const suffix = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 chars
    const code = `${base}-${suffix}`;
    const exists = await Affiliate.exists({ code });
    if (!exists) return code;
  }
  // Fallback: fully random.
  return 'AFF-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Resolve an active affiliate from a raw ref code. Returns null for unknown,
// suspended, or empty codes. Never throws.
export async function findActiveAffiliateByCode(code) {
  if (!code || typeof code !== 'string') return null;
  const affiliate = await Affiliate.findOne({ code: code.toUpperCase().trim() });
  if (!affiliate || affiliate.status !== 'active') return null;
  return affiliate;
}

// Compute the buyer discount an affiliate link grants on a given gross amount.
export function affiliateDiscount(affiliate, amount) {
  if (!affiliate || !affiliate.discountPercent) return 0;
  return Math.round((amount * affiliate.discountPercent) / 100);
}

// Record a confirmed sale against an affiliate: creates the conversion (once —
// keyed by the registration/order id) and bumps the affiliate's counters.
// Safe to call more than once for the same sale; the second call is a no-op.
export async function recordConversion({
  affiliate,        // Affiliate document or id
  kind,             // 'registration' | 'order'
  refId,            // registration or order _id
  buyerUser,
  buyerName,
  buyerEmail,
  saleAmount = 0,
  discountAmount = 0,
}) {
  const aff = affiliate?._id ? affiliate : await Affiliate.findById(affiliate);
  if (!aff) return null;

  const key = kind === 'registration' ? { registration: refId } : { order: refId };
  const existing = await AffiliateConversion.findOne(key);
  if (existing) return existing;

  const commissionPercent = aff.commissionPercent || 0;
  const commissionAmount = Math.round((saleAmount * commissionPercent) / 100);
  const eligibleAt = new Date(Date.now() + HOLD_DAYS * 24 * 60 * 60 * 1000);

  const conversion = await AffiliateConversion.create({
    affiliate: aff._id,
    code: aff.code,
    kind,
    ...key,
    buyerUser,
    buyerName,
    buyerEmail,
    saleAmount,
    discountAmount,
    commissionPercent,
    commissionAmount,
    status: 'pending',
    eligibleAt,
  });

  await Affiliate.findByIdAndUpdate(aff._id, {
    $inc: {
      totalConversions: 1,
      totalSales: saleAmount,
      totalCommission: commissionAmount,
    },
  });

  return conversion;
}
