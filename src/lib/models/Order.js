import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  image: String,
  price: Number,
  quantity: { type: Number, default: 1 },
  size: String,
  color: String,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [orderItemSchema],
  shippingAddress: {
    name: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'India' },
    phone: String,
  },
  paymentMethod: { type: String, enum: ['razorpay', 'stripe', 'cod'], default: 'cod' },
  paymentResult: { id: String, status: String, update_time: String, email_address: String },
  itemsPrice: Number,
  taxPrice: Number,
  shippingPrice: Number,
  discount: { type: Number, default: 0 },
  couponCode: String,
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['placed', 'paid', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'placed',
  },
  statusHistory: [{ status: String, note: String, at: { type: Date, default: Date.now } }],
  paidAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  // Shipment tracking — admin-managed once parcel is handed to a courier
  tracking: {
    courier: { type: String, default: '' },           // e.g. "Delhivery", "DTDC"
    trackingNumber: { type: String, default: '' },
    trackingUrl: { type: String, default: '' },        // public URL the customer can click
    dispatchedAt: Date,                                // when handed to the delivery partner
    expectedDeliveryDate: Date,
    notes: { type: String, default: '' },
  },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
