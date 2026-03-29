import Link from 'next/link'

function IconAlertTriangle() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--error-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconArrowRight() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

export default function AuthErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--error-500)]/10">
        <IconAlertTriangle />
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--error-500)]/70 text-center">
        Auth Error
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] text-center">
        Something blocked sign-in
      </h1>
      <p className="mt-5 text-center text-[var(--text-secondary)] leading-relaxed">
        Double-check your OAuth provider keys, callback URLs, and database connection.
      </p>
      <div className="mt-10 text-center">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary-400)] transition-colors hover:text-[var(--primary-300)]"
        >
          Try sign-in again
          <IconArrowRight />
        </Link>
      </div>
    </main>
  )
}
