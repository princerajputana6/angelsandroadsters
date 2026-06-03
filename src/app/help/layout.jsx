import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { mergeKeywords } from '@/lib/seo';

export const metadata = {
  title: 'Help & Support — Angels & Roadsters',
  description: 'Raise a support ticket or find answers to common questions about bookings, payments, and events.',
  keywords: mergeKeywords(['help', 'support', 'contact angels and roadsters']),
};

export default function HelpLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
