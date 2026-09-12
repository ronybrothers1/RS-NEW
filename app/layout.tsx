import type { Metadata } from 'next';
import './globals.css';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo-metadata';
import { getSiteUrl } from '@/lib/site-url';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: '%s | Ruang Sejahtera',
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: 'website',
    siteName: SITE_NAME,
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
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
