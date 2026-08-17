'use client';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';

export default function AffiliateLayout({ children }) {
  return (
    <>
      <Navbar />
      <div className="container-x pt-28 sm:pt-32 pb-16 min-h-[80vh]">{children}</div>
      <Footer />
    </>
  );
}
