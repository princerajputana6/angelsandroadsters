import { mergeKeywords, SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Bike Shipping Cost Calculator',
  description:
    'Instant bike shipping cost calculator across India — pick pickup and drop-off cities, your bike category, and get a live quote with door-to-door transit and insurance. From Delhi to Jaisalmer, Bengaluru to Leh, every major route.',
  keywords: mergeKeywords([
    'bike shipping calculator India',
    'motorcycle shipping cost India',
    'bike transport calculator',
    'bike courier India',
    'bike shipping Delhi to Jaisalmer',
    'motorcycle logistics India',
    'send bike to Manali',
    'send bike to Leh',
    'Royal Enfield shipping',
    'KTM Adventure shipping',
  ]),
  alternates: { canonical: `${SITE_URL}/bike-shipping` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/bike-shipping`,
    title: `Bike Shipping Calculator · ${SITE_NAME}`,
    description: 'Instant indicative quote to ship your bike anywhere in India. Door-to-door, insured.',
    siteName: SITE_NAME,
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Bike Shipping Calculator · ${SITE_NAME}`,
    description: 'Instant indicative quote to ship your bike anywhere in India. Door-to-door, insured.',
  },
};

export default function BikeShippingLayout({ children }) {
  return children;
}
