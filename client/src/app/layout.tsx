import type { Metadata } from 'next'
import type { ReactNode } from 'react'

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
    <html lang="en" data-theme="dark">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
