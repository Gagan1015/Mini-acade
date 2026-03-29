import Link from 'next/link'
import { SignInButtons } from '@/components/auth/SignInButtons'

export const dynamic = 'force-dynamic'

/* ── SVG Logo Icon ── */
function LogoIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" width={32} height={32}>
      <rect x="4" y="14" width="40" height="26" rx="8" stroke="var(--primary-400)" strokeWidth="2.5" fill="none" />
      <circle cx="16" cy="27" r="2.5" fill="var(--primary-400)" opacity="0.7" />
      <circle cx="32" cy="27" r="2.5" fill="var(--primary-400)" opacity="0.7" />
      <path d="M18 6V14M30 6V14" stroke="var(--primary-400)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

/* ── Arrow Left Icon ── */
function IconArrowLeft() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

export default function SignInPage({
  searchParams,
}: {
  searchParams?: {
    callbackUrl?: string
    error?: string
  }
}) {
  const callbackUrl = searchParams?.callbackUrl ?? '/'
  const error = searchParams?.error

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
      <div className="w-full max-w-md">
        {/* Clean open layout instead of card */}
        <div className="text-center">
          {/* Accent line */}
          <div className="mx-auto mb-10 h-px w-16 bg-gradient-to-r from-[var(--primary-500)] via-[var(--game-skribble)] to-[var(--game-wordel)]" />

          <div className="mb-8 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-500)]/10">
              <LogoIcon />
            </div>
          </div>

          <p className="mb-2 text-xs font-medium uppercase tracking-[0.25em] text-[var(--text-tertiary)]">
            Authentication
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Sign in to Mini Arcade
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
            Sign in with your Google or GitHub account to create rooms, track scores, and play with
            friends.
          </p>

          {error && (
            <div className="mt-8 rounded-xl border border-[var(--error-500)]/20 bg-[var(--error-500)]/5 px-4 py-3 text-sm text-[var(--error-500)]">
              Sign-in failed with error: <strong>{error}</strong>
            </div>
          )}

          <div className="mt-10">
            <SignInButtons callbackUrl={callbackUrl} />
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
          >
            <IconArrowLeft />
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
