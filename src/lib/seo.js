// Global SEO keywords applied to every page across the site.
// Per-page metadata (events, blogs, etc.) should merge its own keywords
// on top of these via `mergeKeywords()`.

export const GLOBAL_KEYWORDS = [
  'Angels and Roadsters',
  'Angels & Roadsters',
  'angelsandroadsters',
  'angels_roadsters',
  'India',
  'New Delhi',
  'Delhi',
  'best riding club',
  'best riding club India',
  'best motorcycle club India',
  'India biker community',
  'Delhi biker community',
  'new delhi bikers India',
  'professional bikers India',
  'professional bikers India reels',
  'women bikers',
  'women riders India',
  'women riders India lifestyle',
  'gender-equal bike club',
  "India's first gender-equal bike club",
  'Indian motorcycle community',
  'Indian biker lifestyle',
  'biker lifestyle India',
  'biker lifestyle india reels',
  'desi rider humor reel',
  'funny motorcycle reel india',
  'indian biker funny moment',
  'viral indian biker comedy',
  'funny motovlog short india',
  'biker daily life comedy',
  'biker journeys',
  'biker couple funny reel',
  'biker family bonding reel',
  'helmet opening fail reel',
  'helmet review funny clip',
  'bike parking struggle reel',
  'rider pov funny video',
  'motolifestyle reels india',
  'riding with friends comedy',
  'motorcycle therapy peace ride',
  'riders mental health',
  'poetic ride moments india',
  'motorcycle poetry vibe india',
  'roadtrip comedy moments india',
  'peaceful solo ride reel india',
  'weekend ride comedy india',
  'rider struggles funny india',
  'motorcycle adventure',
  'motorcycle festival India',
  'motorcycle rally India',
  'adventure biking event India',
  'off-road motorcycle event India',
  'riding clubs India',
  'Trailstorm',
  'Trailstorm 2026',
];

/**
 * Merge per-page keywords with the global keyword list, deduplicated and
 * preserving order (page-specific keywords first).
 */
export function mergeKeywords(extra = []) {
  const seen = new Set();
  const out = [];
  for (const k of [...(extra || []), ...GLOBAL_KEYWORDS]) {
    const v = String(k || '').trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

export const SITE_NAME = 'Angels & Roadsters';
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.angelsandroadsters.com';

export const SITE_LOGO = `${SITE_URL}/logos/angeles-roadsters.png`;
export const SUPPORT_EMAIL = 'support@angelsandroadsters.com';

// Official profiles for the Organization `sameAs` entity graph.
// Only add a URL here once the profile exists, is public, and links back to
// SITE_URL from its own bio/website field — a sameAs pointing at a dead or
// unlinked profile weakens the entity match instead of strengthening it.
export const SOCIAL_PROFILES = [
  'https://www.instagram.com/angels_roadsters',
  'https://www.youtube.com/@angels_roadsters',
  'https://www.facebook.com/angelsandroadsters',
  'https://x.com/angelsroadsters',
  'https://www.linkedin.com/in/angelsandroadsters/',
];

export const TRAILSTORM_PROFILES = ['https://www.instagram.com/trailstormofficial'];
