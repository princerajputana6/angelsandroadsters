import './globals.css';
import Script from 'next/script';
import StoreProvider from '@/store/Provider';
import { GLOBAL_KEYWORDS, SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Premium Riding & Adventure Co.`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Angels & Roadsters is India's 1st gender-equal bike club — 26,000+ riders strong. Weekend rides, multi-day expeditions, Trailstorm festival, riding gear and a brotherhood that rolls together.",
  keywords: GLOBAL_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: `${SITE_NAME} — India's biggest gender-equal riding community`,
    description:
      'Join 26,000+ riders across India. Weekend rides, flagship festivals, women bikers, professional bikers, Delhi-based and India-wide.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@angels_roadsters',
    creator: '@angels_roadsters',
    title: `${SITE_NAME} — India's gender-equal riding community`,
    description:
      'Weekend rides, Trailstorm festival, 50:50 community, women & professional bikers across India.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
        <Script
          src="https://www.trylinqr.com/widget.js"
          data-org-id="6a1957b3c40c498c73bfe0eb"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
