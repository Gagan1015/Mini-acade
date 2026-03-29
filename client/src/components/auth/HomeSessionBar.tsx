'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'

/* ── SVG Icons ── */

function IconUser({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  )
}

function IconDashboard({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}

function IconLogOut({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

interface HomeSessionBarProps {
  email?: string | null
  role?: string
}

export function HomeSessionBar({ email, role }: HomeSessionBarProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-[var(--border)]/40 bg-[var(--surface)]/30 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-500)]/10 text-[var(--primary-400)]">
          <IconUser />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{email}</p>
          <p className="text-xs text-[var(--text-tertiary)]">
            {role === 'ADMIN' ? 'Administrator' : 'Player'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {role === 'ADMIN' && (
          <Link
            href="/admin"
            className="btn btn-ghost btn-sm"
          >
            <IconDashboard />
            Admin
          </Link>
        )}
        <button
          onClick={() => signOut()}
          className="btn btn-ghost btn-sm text-[var(--error-500)]"
        >
          <IconLogOut />
          Sign Out
        </button>
      </div>
    </div>
  )
}
