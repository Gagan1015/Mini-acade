'use client'

import Link from 'next/link'

import { AppLayout } from '@/components/layout/AppLayout'

type GameUnavailableProps = {
  gameName: string
  message?: string
  onBackToLobby?: () => void
}

export function GameUnavailable({ gameName, message, onBackToLobby }: GameUnavailableProps) {
  return (
    <AppLayout variant="marketing" showFooter={false}>
      <div className="marketing-rail-layout overflow-hidden bg-[var(--background)]">
        <section className="marketing-rail-section">
          <div className="mx-auto flex min-h-[calc(100vh-96px)] max-w-7xl items-center justify-center px-6 py-12 sm:py-16 lg:px-8">
            <div className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-lg)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                Game unavailable
              </p>
              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                {gameName} is currently disabled
              </h1>
              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                {message ??
                  'This game has been turned off by an admin, so new sessions cannot be started right now.'}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/lobby"
                  onClick={onBackToLobby}
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--text-primary)] px-5 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-transform hover:-translate-y-0.5"
                >
                  Back to lobby
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition-transform hover:-translate-y-0.5"
                >
                  Go home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
