import type { MetadataRoute } from 'next';
import { SITE_DESCRIPTION } from '@/lib/seo-metadata';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Ruang Sejahtera',
    short_name: 'Ruang Sejahtera',
    description: SITE_DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#022c22',
    lang: 'id-ID',
    dir: 'ltr',
    icons: [
      {
        src: '/pwa/app-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/app-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/app-icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}