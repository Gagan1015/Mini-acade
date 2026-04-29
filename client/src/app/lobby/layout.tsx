import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Game Lobby',
  description:
    'Create a private game room or join one with a code. Play Skribble, Trivia, Wordel and Flagel with friends in real-time.',
  alternates: {
    canonical: '/lobby',
  },
  openGraph: {
    title: 'Game Lobby | Arcado',
    description:
      'Create a private game room or join one with a code. Play Skribble, Trivia, Wordel and Flagel with friends in real-time.',
    url: '/lobby',
  },
}

export default function LobbyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
