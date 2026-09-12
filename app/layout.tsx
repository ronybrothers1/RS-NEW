import type { Metadata } from 'next';
import './globals.css';
import { getSiteUrl } from '@/lib/site-url';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Yayasan Ruang Sejahtera',
    template: '%s | Ruang Sejahtera',
  },
  description:
    'Membangun Harapan, Mewujudkan Kesejahteraan melalui program sosial, pendidikan, dan kemanusiaan.',
  openGraph: {
    title: 'Yayasan Ruang Sejahtera',
    description:
      'Membangun Harapan, Mewujudkan Kesejahteraan melalui program sosial, pendidikan, dan kemanusiaan.',
    type: 'website',
    siteName: 'Yayasan Ruang Sejahtera',
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yayasan Ruang Sejahtera',
    description:
      'Membangun Harapan, Mewujudkan Kesejahteraan melalui program sosial, pendidikan, dan kemanusiaan.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body
        suppressHydrationWarning
        className="bg-canvas text-ink antialiased"
      >
        {children}
      </body>
    </html>
  );
}
