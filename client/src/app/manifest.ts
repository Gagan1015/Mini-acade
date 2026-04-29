import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Arcado - Play Together, Anywhere',
    short_name: 'Arcado',
    description:
      'Classic party games reimagined for the browser. Create private rooms, share a code, and start playing with friends in seconds.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0E14',
    theme_color: '#3B82F6',
    orientation: 'any',
    categories: ['games', 'entertainment'],
    icons: [
      {
        src: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
