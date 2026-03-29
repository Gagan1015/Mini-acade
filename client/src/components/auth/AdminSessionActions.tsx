'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'

export function AdminSessionActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/"
        className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
      >
        Home
      </Link>
      <button
        onClick={() => void signOut({ callbackUrl: '/' })}
        className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
      >
        Logout
      </button>
    </div>
  )
}
