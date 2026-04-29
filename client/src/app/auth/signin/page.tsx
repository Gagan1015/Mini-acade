'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { SignInButtons } from '@/components/auth/SignInButtons'
import { LogoTile, Wordmark } from '@/components/ui/Logo'
import { IconArrowLeft } from '@/components/ui/icons'

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
      >
        <SignInButtons callbackUrl={callbackUrl} />
      </motion.div>

      {/* New + returning users use the same OAuth buttons */}
      <motion.p
        className="mt-5 text-center text-[11px] leading-relaxed text-[var(--text-tertiary)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        New here? An account is created automatically on your first sign in.
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
              <LogoTile size="md" />
              <Wordmark size="lg" />
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
              Sign in to Arcado
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] max-w-[320px]">
              Continue with Google or GitHub to create rooms, track scores, and play with friends.
            </p>
          </motion.div>

          {/* Form area */}
          <Suspense
            fallback={
              <div className="space-y-3 animate-pulse">
                <div className="h-12 rounded-[12px] bg-[var(--surface)]" />
                <div className="h-12 rounded-[12px] bg-[var(--surface)]" />
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
              <IconArrowLeft size={14} />
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
