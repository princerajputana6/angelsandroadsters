import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Registration from '@/lib/models/Registration';
import Event from '@/lib/models/Event';
import { verifySignature } from '@/lib/razorpay';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';
import { sendEventRegistrationConfirmation } from '@/lib/email';

export async function POST(req) {
  return handler(async () => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      kind,           // 'order' | 'registration'
      referenceId,    // _id of Order or Registration to mark paid
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return fail('Missing payment fields', 400);
    }

    const valid = verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) return fail('Signature mismatch', 400);

    if (kind === 'order' && referenceId) {
      await connectDB();
      const order = await Order.findById(referenceId);
      if (!order) return fail('Order not found', 404);
      order.status = 'paid';
      order.paidAt = new Date();
      order.paymentResult = {
        id: razorpay_payment_id,
        status: 'paid',
        update_time: new Date().toISOString(),
      };
      order.statusHistory.push({ status: 'paid', note: 'Razorpay payment verified' });
      await order.save();
    }

    if (kind === 'registration' && referenceId) {
      await connectDB();
      const reg = await Registration.findById(referenceId);
      if (!reg) return fail('Registration not found', 404);
      reg.paymentStatus = 'paid';
      reg.status = 'confirmed';
      reg.paymentId = razorpay_payment_id;
      await reg.save();

      // Send confirmation email now that payment is verified
      try {
        const event = await Event.findById(reg.event).lean();
        if (event) {
          const memberEmails = (reg.members || []).map((m) => m?.email).filter(Boolean);
          const recipientEmail = reg.registrationType === 'group'
            ? memberEmails.join(',')
            : reg.email;
          const userName = reg.name || reg.groupName || memberEmails[0] || 'Rider';

          if (recipientEmail) {
            sendEventRegistrationConfirmation({
              registration: toJSON(reg),
              event: toJSON(event),
              userEmail: recipientEmail,
              userName,
            }).catch(err => console.error('[Payment/Verify] Email send failed:', err.message));
          }
        }
      } catch (emailErr) {
        // Don't fail the verify response if email errors
        console.error('[Payment/Verify] Error sending email:', emailErr.message);
      }
    }

    return ok({ verified: true });
  });
}
