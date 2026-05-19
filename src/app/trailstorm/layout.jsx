import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';

export default function TrailstormLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
