import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to Arcado with Google or GitHub. Create rooms, track scores, and play multiplayer party games with friends.',
  alternates: {
    canonical: '/auth/signin',
  },
  openGraph: {
    title: 'Sign In | Arcado',
    description:
      'Sign in to Arcado with Google or GitHub. Create rooms, track scores, and play multiplayer party games with friends.',
    url: '/auth/signin',
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default function SignInLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
