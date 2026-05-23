import mongoose from 'mongoose';
import crypto from 'crypto';

const replySchema = new mongoose.Schema({
  message: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  authorName: { type: String, default: 'Support Team' },
  createdAt: { type: Date, default: Date.now },
});

const supportTicketSchema = new mongoose.Schema({
  ticketRef: { type: String, unique: true, index: true }, // e.g. SUP-A3F2B1
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  subject: { type: String, required: true },
  category: {
    type: String,
    enum: ['booking', 'payment', 'technical', 'general', 'other'],
    default: 'general',
  },
  message: { type: String, required: true },
  bookingTicketId: String, // optional link to a Registration ticketId
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  replies: [replySchema],
}, { timestamps: true });

supportTicketSchema.pre('save', function (next) {
  if (!this.ticketRef) {
    this.ticketRef = 'SUP-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  next();
});

export default mongoose.models.SupportTicket ||
  mongoose.model('SupportTicket', supportTicketSchema);
