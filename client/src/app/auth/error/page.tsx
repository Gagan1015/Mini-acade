import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { IconArrowRight } from '@/components/ui/icons'

export default function AuthErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--error-500)]/10 text-[var(--error-500)]">
        <AlertTriangle size={28} strokeWidth={2} />
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--error-500)]/80 text-center">
        Auth Error
      </p>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] text-center">
        Something blocked sign-in
      </h1>
      <p className="mt-5 text-center text-[var(--text-secondary)] leading-relaxed">
        Double-check your OAuth provider keys, callback URLs, and database connection.
      </p>
      <div className="mt-10 flex justify-center">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 rounded-[12px] bg-[var(--text-primary)] px-6 py-3.5 text-sm font-semibold text-[var(--text-inverse)] transition-transform hover:-translate-y-0.5"
        >
          Try sign-in again
          <IconArrowRight size={14} />
        </Link>
      </div>
    </main>
  )
}
