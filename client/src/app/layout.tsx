import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import Script from 'next/script'

import { AuthProvider } from '@/components/providers/AuthProvider'
import { ToastProvider } from '@/components/ui/Toast'

import './globals.css'

const SITE_URL = 'https://arcado.gagankumar.me'
const SITE_NAME = 'Arcado'
const SITE_TITLE = 'Arcado - Play Together, Anywhere'
const SITE_DESCRIPTION =
  'Classic party games reimagined for the browser. Create private rooms, share a code, and start playing Skribble, Trivia, Wordel and Flagel with friends in seconds.'

/* ------------------------------------------------------------------ */
/*  Metadata – https://nextjs.org/docs/app/api-reference/functions/generate-metadata  */
/* ------------------------------------------------------------------ */
export const metadata: Metadata = {
  /* ---- Core ---- */
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'arcade games',
    'multiplayer games',
    'browser games',
    'party games',
    'online games',
    'skribble',
    'trivia',
    'wordel',
    'flagel',
    'play with friends',
    'private room games',
    'real-time multiplayer',
  ],
  applicationName: SITE_NAME,
  authors: [{ name: 'Gagan Kumar', url: 'https://www.gagankumar.me/' }],
  creator: 'Gagan Kumar',
  publisher: 'Gagan Kumar',
  category: 'Games',

  /* ---- Canonical ---- */
  alternates: {
    canonical: '/',
  },

  /* ---- Icons / Favicons ---- */
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },

  /* ---- Open Graph ---- */
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Arcado – Play Together, Anywhere',
        type: 'image/png',
      },
    ],
  },

  /* ---- Twitter / X ---- */
  twitter: {
    card: 'summary_large_image',
    site: '@ggn_dev',
    creator: '@ggn_dev',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        alt: 'Arcado – Play Together, Anywhere',
        width: 1200,
        height: 630,
      },
    ],
  },

  /* ---- Robots ---- */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  /* ---- Other ---- */
  other: {
    'msapplication-TileColor': '#0B0E14',
  },
}

/* ------------------------------------------------------------------ */
/*  Viewport – separated per Next 14 recommendation                   */
/* ------------------------------------------------------------------ */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF8F5' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0E14' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

/* ------------------------------------------------------------------ */
/*  JSON-LD Structured Data                                           */
/* ------------------------------------------------------------------ */
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: 'GameApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      image: `${SITE_URL}/og-image.png`,
      screenshot: `${SITE_URL}/og-image.png`,
      author: {
        '@type': 'Person',
        '@id': `${SITE_URL}/#author`,
      },
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#author`,
      name: 'Gagan Kumar',
      url: 'https://www.gagankumar.me/',
      email: 'gagansaini1510@gmail.com',
      sameAs: [
        'https://github.com/Gagan1015',
        'https://www.linkedin.com/in/gagan-kumar1510',
        'https://x.com/ggn_dev',
        'https://www.gagankumar.me/',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: {
        '@type': 'Person',
        '@id': `${SITE_URL}/#author`,
      },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var storedTheme = localStorage.getItem('theme-preference');
                var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                var theme = storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : systemTheme;
                document.documentElement.dataset.theme = theme;
                document.documentElement.style.colorScheme = theme;
              } catch (error) {
                var fallbackTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.dataset.theme = fallbackTheme;
                document.documentElement.style.colorScheme = fallbackTheme;
              }
            })();
          `}
        </Script>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
