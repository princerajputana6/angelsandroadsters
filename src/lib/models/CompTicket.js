// Complimentary (free-of-charge) entry to an event — issued only by admins.
// Three categories per the Trailstorm playbook:
//   1. VIP — sponsors, media, influencers, govt, brand guests, speakers, investors,
//            special invitees. Often issued in batches of N passes.
//   2. Club Champion — 4 named riders per registered club. Optional `clubReg`
//            link to the underlying paid group Registration document.
//   3. Individual Competitor — pro riders / brand riders / influencers / winners
//            given a free competition slot.

import mongoose from 'mongoose';
import crypto from 'crypto';

const CATEGORIES = ['vip', 'club_champion', 'individual_competitor'];
const VIP_TYPES = [
  'sponsor',
  'media',
  'influencer',
  'government',
  'brand_guest',
  'speaker',
  'investor',
  'special_invitee',
];
const COMPETITOR_TYPES = [
  'pro_rider',
  'brand_rider',
  'influencer',
  'special_invitee',
  'competition_winner',
];

const compTicketSchema = new mongoose.Schema({
  event:      { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  category:   { type: String, enum: CATEGORIES, required: true, index: true },

  // Common contact
  name:       { type: String, required: true, trim: true },
  mobile:     { type: String, default: '' },
  email:      { type: String, default: '', lowercase: true, trim: true },
  remarks:    { type: String, default: '' },
  issuedBy:   { type: String, default: '' },           // admin name typed in form
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ticketId:   { type: String, unique: true, index: true },

  // VIP only
  vipType:    { type: String, enum: VIP_TYPES, default: undefined },
  numPasses:  { type: Number, default: 1, min: 1 },     // batch size

  // Club Champion only
  clubName:   { type: String, default: '' },
  clubId:     { type: String, default: '' },            // free-form (admin's club code) or registration ticketId
  clubReg:    { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', default: null },
  slot:       { type: Number, min: 1, max: 4 },         // 1..4

  // Individual Competitor only
  motorcycle:    { type: String, default: '' },
  riderCategory: { type: String, enum: COMPETITOR_TYPES, default: undefined },
  reasonForFOC:  { type: String, default: '' },
  approvedBy:    { type: String, default: '' },

  // Lifecycle
  status:   { type: String, enum: ['active', 'revoked'], default: 'active', index: true },
}, { timestamps: true });

compTicketSchema.pre('save', function (next) {
  if (!this.ticketId) {
    const prefix = this.category === 'vip' ? 'VIP'
      : this.category === 'club_champion' ? 'CHAMP'
      : 'COMP';
    this.ticketId = `${prefix}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
  }
  next();
});

compTicketSchema.statics.CATEGORIES = CATEGORIES;
compTicketSchema.statics.VIP_TYPES = VIP_TYPES;
compTicketSchema.statics.COMPETITOR_TYPES = COMPETITOR_TYPES;

export default mongoose.models.CompTicket || mongoose.model('CompTicket', compTicketSchema);
