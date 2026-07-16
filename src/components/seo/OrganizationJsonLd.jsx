import {
  SITE_NAME,
  SITE_URL,
  SITE_LOGO,
  SUPPORT_EMAIL,
  SOCIAL_PROFILES,
  TRAILSTORM_PROFILES,
} from '@/lib/seo';

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const TRAILSTORM_ID = `${SITE_URL}/trailstorm#organization`;

const organization = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: SITE_NAME,
  alternateName: 'Angels and Roadsters',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: SITE_LOGO,
  },
  description:
    "Angels & Roadsters is India's 1st gender-equal bike club — 26,000+ riders strong. Weekend rides, multi-day expeditions, the Trailstorm festival, and riding gear.",
  email: SUPPORT_EMAIL,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Qutab Institutional Area',
    addressLocality: 'New Delhi',
    addressRegion: 'Delhi',
    addressCountry: 'IN',
  },
  sameAs: SOCIAL_PROFILES,
  subOrganization: [{ '@id': TRAILSTORM_ID }],
};

const trailstorm = {
  '@type': 'Organization',
  '@id': TRAILSTORM_ID,
  name: 'Trailstorm',
  url: `${SITE_URL}/trailstorm`,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/logos/trailstorm.png`,
  },
  description:
    'Trailstorm is the flagship motorcycle adventure festival by Angels & Roadsters.',
  sameAs: TRAILSTORM_PROFILES,
  parentOrganization: { '@id': ORG_ID },
};

const website = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: SITE_URL,
  name: SITE_NAME,
  publisher: { '@id': ORG_ID },
  inLanguage: 'en-IN',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [organization, trailstorm, website],
};

export default function OrganizationJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
