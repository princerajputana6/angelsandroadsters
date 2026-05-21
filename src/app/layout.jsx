import './globals.css';
import StoreProvider from '@/store/Provider';

export const metadata = {
  title: 'Angels & Roadsters — Premium Riding & Adventure Co.',
  description: 'Crafted riding & travel gear, curated rallies, treks and expos. Built for those who chase the horizon.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
