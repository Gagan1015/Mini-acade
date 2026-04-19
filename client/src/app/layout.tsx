import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Script from 'next/script'

import { AuthProvider } from '@/components/providers/AuthProvider'

import './globals.css'

export const metadata: Metadata = {
  title: 'Mini Arcade — Play Together, Anywhere',
  description:
    'Classic party games reimagined for the browser. Create private rooms, share a code, and start playing Skribble, Trivia, Wordel and Flagel with friends in seconds.',
  keywords: ['arcade', 'games', 'multiplayer', 'skribble', 'trivia', 'wordel', 'flagel'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var storedTheme = localStorage.getItem('theme');
                var theme = storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : 'light';
                document.documentElement.dataset.theme = theme;
                document.documentElement.style.colorScheme = theme;
              } catch (error) {
                document.documentElement.dataset.theme = 'light';
                document.documentElement.style.colorScheme = 'light';
              }
            })();
          `}
        </Script>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
