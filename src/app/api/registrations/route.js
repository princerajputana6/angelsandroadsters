import { connectDB } from '@/lib/db';
import Registration from '@/lib/models/Registration';
import Event from '@/lib/models/Event';
import Coupon from '@/lib/models/Coupon';
import { getCurrentUser } from '@/lib/auth';
import { generateQRDataUrl } from '@/lib/qr';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';
import { sendEventRegistrationConfirmation } from '@/lib/email';
import { findActiveAffiliateByCode, affiliateDiscount } from '@/lib/affiliate';

const ACTIVE = ['confirmed', 'pending', 'attended'];

export async function POST(req) {
  return handler(async () => {
    await connectDB();
    const user = await getCurrentUser();
    const body = await req.json();
    const { eventId, registrationType } = body;
    if (!eventId || !registrationType) return fail('eventId and registrationType required', 400);

    const event = await Event.findById(eventId);
    if (!event) return fail('Event not found', 404);

    // Slot availability check
    const used = await Registration.countDocuments({
      event: event._id,
      registrationType,
      status: { $in: ACTIVE },
    });
    const capForType =
      registrationType === 'individual' ? (event.capacity?.individual || 0) :
      registrationType === 'group' ? (event.capacity?.group || 0) :
      (event.capacity?.visitor || 0);

    const remaining = Math.max(0, capForType - used);
    if (capForType > 0 && remaining <= 0) {
      return fail(`Sorry — all ${registrationType} slots are full. Please pick a different type.`, 409, { soldOut: true });
    }

    const pricing = event.pricing || {};

    let amount = 0;
    if (registrationType === 'individual') {
      amount = pricing.individual || 0;
    }
    if (registrationType === 'group') {
      const size = Number(body.groupSize || (body.members?.length || 1));
      amount = (pricing.groupBase || 0) + (pricing.groupPerHead || 0) * size;
    }
    if (registrationType === 'visitor') {
      const perDay = pricing.visitor || 0;
      const numDays = Math.max(1, Array.isArray(body.visitDays) ? body.visitDays.length : 1);
      const count = Math.max(1, Number(body.visitorCount || 1));
      amount = perDay * numDays * count;
    }

    // Discount resolution. An explicitly-entered coupon ALWAYS takes precedence
    // over an ambient affiliate link (?ref=CODE) — the buyer sees the coupon
    // price in the UI, so that's exactly what we must charge. (Previously the
    // affiliate ref silently overrode the coupon, so a 100%-off coupon still
    // charged the affiliate's discounted amount.) The affiliate is still
    // stamped for attribution even when the coupon wins the discount.
    let discountAmount = 0;
    let appliedCouponCode = null;
    let affiliate = null;

    if (body.ref) affiliate = await findActiveAffiliateByCode(body.ref);

    if (body.couponCode) {
      const coupon = await Coupon.findOne({ code: body.couponCode.toUpperCase().trim() });
      const valid =
        coupon &&
        coupon.isActive &&
        (!coupon.expiresAt || new Date() < new Date(coupon.expiresAt)) &&
        (coupon.maxUses === 0 || coupon.usedCount < coupon.maxUses) &&
        (!coupon.applicableTo?.length || coupon.applicableTo.includes(registrationType)) &&
        (!coupon.eventId || String(coupon.eventId) === String(event._id));

      if (valid) {
        discountAmount = coupon.discountType === 'percent'
          ? Math.round((amount * coupon.discountValue) / 100)
          : Math.min(coupon.discountValue, amount);
        appliedCouponCode = coupon.code;
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
      }
    }

    // Fall back to the affiliate link's discount only when no coupon applied.
    if (!appliedCouponCode && affiliate) {
      discountAmount = affiliateDiscount(affiliate, amount);
    }

    amount = Math.max(0, amount - discountAmount);

    const reg = new Registration({
      event: event._id,
      user: user?._id,
      registrationType,
      name: body.name,
      email: body.email,
      phone: body.phone,
      age: body.age,
      emergencyContact: body.emergencyContact,
      experienceLevel: body.experienceLevel,
      bikeDetails: body.bikeDetails,
      visitDate: body.visitDate,
      visitDays: Array.isArray(body.visitDays)
        ? body.visitDays.filter(Boolean)
        : undefined,
      visitorCount: registrationType === 'visitor'
        ? Math.max(1, Number(body.visitorCount || 1))
        : undefined,
      groupName: body.groupName,
      groupLeader: body.groupLeader,
      members: body.members,
      groupSize: body.groupSize || (body.members?.length || undefined),
      couponCode: appliedCouponCode,
      discountAmount,
      affiliate: affiliate?._id || null,
      affiliateCode: affiliate?.code || null,
      amount,
      paymentStatus: amount === 0 ? 'free' : 'pending',
      status: amount === 0 ? 'confirmed' : 'pending',
    });
    await reg.save();
    const bookingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/booking/${reg.ticketId}`;
    reg.qrCode = await generateQRDataUrl(bookingUrl);
    await reg.save();

    // Send confirmation email only for FREE registrations immediately.
    // For PAID registrations, the email is sent after payment is verified
    // in /api/payments/verify — we never email before money is collected.
    if (amount === 0) {
      const memberEmails = (body.members || [])
        .map((m) => m?.email)
        .filter(Boolean);
      const recipientEmail = registrationType === 'group'
        ? memberEmails.join(',')
        : body.email;

      if (recipientEmail) {
        sendEventRegistrationConfirmation({
          registration: toJSON(reg),
          event: toJSON(event),
          userEmail: recipientEmail,
          userName: body.name || body.groupName || memberEmails[0] || 'Rider',
        }).catch(err => console.error('[Registration] Email send failed:', err.message));
      } else {
        console.warn('[Registration] No recipient email — confirmation not sent.');
      }
    }

    return ok({ registration: toJSON(reg), remainingAfter: remaining - 1 }, 201);
  });
}

export async function GET(req) {
  return handler(async () => {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    if (!eventId) return fail('eventId required', 400);
    const regs = await Registration.find({ event: eventId }).lean();
    return ok({ registrations: toJSON(regs) });
  });
}
