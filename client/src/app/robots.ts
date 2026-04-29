import type { MetadataRoute } from 'next'

const SITE_URL = 'https://arcado.gagankumar.me'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/rooms/', '/play/', '/profile/', '/stats/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
