'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { SignInButtons } from '@/components/auth/SignInButtons'

/* â”€â”€ SVG Logo Icon â”€â”€ */
function LogoIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" width={28} height={28}>
      <rect x="4" y="14" width="40" height="26" rx="8" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="16" cy="27" r="2.5" fill="currentColor" opacity="0.7" />
      <circle cx="32" cy="27" r="2.5" fill="currentColor" opacity="0.7" />
      <path d="M18 6V14M30 6V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

/* â”€â”€ Arrow Left Icon â”€â”€ */
function IconArrowLeft() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

/* â”€â”€ Sign-in form (uses useSearchParams â†’ needs Suspense) â”€â”€ */
function SignInForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get('callbackUrl') ?? '/'
  const error = searchParams?.get('error')

  return (
    <>
      {error && (
        <motion.div
          className="mb-6 rounded-xl border border-[var(--error-500)]/20 bg-[var(--error-500)]/5 px-4 py-3 text-sm text-[var(--error-500)]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Sign-in failed: <strong>{error}</strong>
        </motion.div>
      )}

      {/* OAuth Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-6"
      >
        <SignInButtons callbackUrl={callbackUrl} />
      </motion.div>

      {/* OR Divider */}
      <motion.div
        className="flex items-center gap-4 my-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--text-tertiary)]">
          OR
        </span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </motion.div>

      {/* Already have an account */}
      <motion.p
        className="text-sm text-center text-[var(--text-secondary)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        Already have an account?{' '}
        <Link
          href="/auth/signin"
          className="font-semibold text-[var(--text-primary)] underline underline-offset-[3px] decoration-[var(--border-strong)] hover:decoration-[var(--text-primary)] transition-colors"
        >
          Login
        </Link>
      </motion.p>
    </>
  )
}

export default function SignInPage() {
  return (
    <main className="auth-page-bg flex min-h-screen bg-[var(--background)] transition-colors duration-200">
      {/* â”€â”€ LEFT: Visual panel with mosaic art + rounded corners â”€â”€ */}
      <motion.div
        className="hidden lg:block lg:w-1/2 xl:w-[55%] p-5"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-3xl">
          <Image
            src="/auth-mosaic.png"
            alt="Abstract pixel mosaic artwork"
            fill
            priority
            className="object-cover"
          />
          {/* Subtle gradient overlays */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

          {/* Floating info badges */}
          <div className="absolute bottom-10 left-10 z-10 flex flex-col gap-3">
            {[
              { label: 'Games', value: '4' },
              { label: 'Max Players', value: '10' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="inline-flex w-fit items-center gap-2.5 rounded-xl border border-white/12 bg-white/10 px-4 py-2 text-white shadow-lg backdrop-blur-xl"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="font-display text-base font-bold leading-none">{item.value}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] opacity-80">
                  {item.label}
                </span>
              </motion.div>
            ))}
            <motion.div
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/12 bg-white/10 px-4 py-2 text-white shadow-lg backdrop-blur-xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] opacity-80">
                Real-time sync
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* â”€â”€ RIGHT: Sign-in form panel â”€â”€ */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="flex w-full max-w-[400px] flex-col" style={{ minHeight: 'min(680px, calc(100vh - 96px))' }}>

          {/* Brand â€” top right area */}
          <motion.div
            className="mb-auto pb-6"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-[var(--text-primary)] transition-opacity hover:opacity-80"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]">
                <LogoIcon />
              </div>
              <span className="font-display text-lg font-bold tracking-tight">Arcado</span>
            </Link>
          </motion.div>

          {/* Title + subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <h1 className="font-display text-[2rem] sm:text-4xl font-bold tracking-[-0.04em] leading-[1.1] text-[var(--text-primary)]">
              Create an account
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] max-w-[320px]">
              Sign in to create rooms, track scores, and play with friends
            </p>
          </motion.div>

          {/* Form area */}
          <Suspense
            fallback={
              <div className="space-y-4 animate-pulse">
                <div className="h-12 rounded-xl bg-[var(--surface)]" />
                <div className="h-12 rounded-xl bg-[var(--surface)]" />
              </div>
            }
          >
            <SignInForm />
          </Suspense>

          {/* Footer */}
          <motion.div
            className="mt-auto pt-8 flex items-center justify-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
            >
              <IconArrowLeft />
              Back to home
            </Link>
            <span className="text-[var(--border-strong)]">/</span>
            <Link
              href="#"
              className="text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
            >
              Help
            </Link>
            <span className="text-[var(--border-strong)]">/</span>
            <Link
              href="#"
              className="text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
            >
              Terms
            </Link>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
