import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
        404
      </p>
      <h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-base leading-7 text-[var(--text-secondary)]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[var(--text-primary)] px-6 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-transform hover:-translate-y-0.5"
        >
          Go home
        </Link>
        <Link
          href="/lobby"
          className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition-transform hover:-translate-y-0.5"
        >
          Game lobby
        </Link>
      </div>
    </main>
  )
}
