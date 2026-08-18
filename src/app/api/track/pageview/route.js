import { headers } from 'next/headers';
import { connectDB } from '@/lib/db';
import PageView from '@/lib/models/PageView';
import { regionToState } from '@/lib/india-regions';
import { ok, handler } from '@/lib/apiUtils';

// Normalize where a visit came from into a small set of readable buckets.
function deriveSource({ ref, utmSource, referrer }) {
  if (ref) return 'Affiliate';
  if (utmSource) {
    const s = String(utmSource).toLowerCase();
    if (s.includes('insta')) return 'Instagram';
    if (s.includes('face') || s === 'fb') return 'Facebook';
    if (s.includes('whats')) return 'WhatsApp';
    if (s.includes('google')) return 'Google';
    if (s.includes('you')) return 'YouTube';
    return utmSource.charAt(0).toUpperCase() + utmSource.slice(1);
  }
  if (!referrer) return 'Direct';
  let host = '';
  try { host = new URL(referrer).hostname.replace(/^www\./, ''); } catch (_) { return 'Direct'; }
  if (!host) return 'Direct';
  if (host.includes('instagram')) return 'Instagram';
  if (host.includes('facebook') || host === 'fb.com' || host.includes('fb.me')) return 'Facebook';
  if (host.includes('whatsapp')) return 'WhatsApp';
  if (host.includes('google')) return 'Google';
  if (host.includes('youtube') || host.includes('youtu.be')) return 'YouTube';
  if (host.includes('t.co') || host.includes('twitter') || host === 'x.com') return 'Twitter/X';
  if (host.includes('linkedin') || host.includes('lnkd.in')) return 'LinkedIn';
  if (host.includes('bing')) return 'Bing';
  // Same-site navigation.
  if (host.includes('angelsandroadsters')) return 'Internal';
  return host;
}

// Public, fire-and-forget visit beacon. Geo comes from Vercel's edge headers on
// this very request, so no external geolocation service is needed.
export async function POST(req) {
  return handler(async () => {
    const body = await req.json().catch(() => ({}));
    const h = headers();

    const country = h.get('x-vercel-ip-country') || '';
    const region = h.get('x-vercel-ip-country-region') || '';
    let city = '';
    try { city = decodeURIComponent(h.get('x-vercel-ip-city') || ''); } catch (_) { city = h.get('x-vercel-ip-city') || ''; }

    const source = deriveSource({ ref: body.ref, utmSource: body.utmSource, referrer: body.referrer });

    await connectDB();
    await PageView.create({
      page: body.page || 'unknown',
      path: body.path || '',
      country,
      region,
      state: country === 'IN' ? regionToState(region) : (region || 'Unknown'),
      city,
      referrer: body.referrer || '',
      source,
      refCode: body.ref || null,
    });

    return ok({ tracked: true });
  });
}
