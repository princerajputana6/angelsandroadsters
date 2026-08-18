import mongoose from 'mongoose';

// A single page visit, recorded by a lightweight client beacon. Geo fields are
// derived server-side from the hosting platform's IP headers (Vercel). We store
// only coarse location (country/state/city) and a normalized traffic source —
// never the raw IP address.
const pageViewSchema = new mongoose.Schema({
  page: { type: String, index: true },   // logical key, e.g. 'trailstorm'
  path: String,                            // actual pathname visited

  country: String,
  region: String,                          // raw ISO subdivision code (e.g. 'MH')
  state: { type: String, index: true },    // mapped state name, or 'Unknown'
  city: String,

  referrer: String,                        // raw document.referrer
  source: { type: String, index: true },   // normalized: 'Affiliate', 'Instagram', 'Direct'...
  refCode: String,                         // affiliate code if the visit carried ?ref=
}, { timestamps: true });

export default mongoose.models.PageView || mongoose.model('PageView', pageViewSchema);
