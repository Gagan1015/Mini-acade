'use client'

import Link from 'next/link'
import { signIn, signOut, useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'

/* ── Inline SVG Icons (no emojis) ── */

function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} width={28} height={28}>
      <motion.rect
        x="2" y="8" width="24" height="16" rx="5"
        stroke="currentColor" strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
      />
      <circle cx="9" cy="16" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="19" cy="16" r="1.5" fill="currentColor" opacity="0.7" />
      <motion.path
        d="M11 4V8M17 4V8"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      />
    </svg>
  )
}

function IconUser({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  )
}

function IconLogIn({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
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

function IconMenu({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  )
}

function IconX({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

/* ── Nav Link with animated underline ── */
function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group relative px-1 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
    >
      {children}
      <span className="absolute bottom-0 left-0 h-px w-0 bg-[var(--primary-400)] transition-all duration-300 group-hover:w-full" />
    </Link>
  )
}

export function Header() {
  const { data: session, status } = useSession()
  const user = session?.user
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
      className="sticky top-0 z-50 border-b border-[var(--border)]/50 bg-[var(--background)]/80 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[var(--text-primary)] transition-colors hover:text-[var(--primary-400)]"
          >
            <LogoMark />
            <span className="text-lg font-bold tracking-tight">Mini Arcade</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <NavLink href="/">Games</NavLink>
            <NavLink href="/lobby">Lobby</NavLink>
            {user && <NavLink href="/stats">My Stats</NavLink>}
          </nav>

          {/* Auth + Mobile Toggle */}
          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--surface)]" />
            ) : user ? (
              <div className="hidden items-center gap-4 md:flex">
                {(user as { role?: string }).role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 text-sm font-medium text-[var(--warning-500)] transition-colors hover:text-[var(--warning-600)]"
                  >
                    <IconDashboard size={15} />
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-2.5">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || 'User'}
                      className="h-8 w-8 rounded-full ring-2 ring-[var(--border)]"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-500)]/15">
                      <IconUser size={14} />
                    </div>
                  )}
                  <span className="text-sm font-medium text-[var(--text-secondary)]">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)]"
                  aria-label="Sign out"
                >
                  <IconLogOut size={16} />
                </button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => signIn()}
                className="btn btn-primary btn-sm hidden md:inline-flex"
              >
                <IconLogIn size={15} />
                Sign In
              </motion.button>
            )}

            {/* Mobile hamburger */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] md:hidden"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-[var(--border)]/50 md:hidden"
          >
            <div className="space-y-1 px-6 py-4">
              <Link
                href="/"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Games
              </Link>
              <Link
                href="/lobby"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Lobby
              </Link>
              {user ? (
                <>
                  <Link
                    href="/stats"
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Stats
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--error-500)] hover:bg-[var(--error-500)]/10"
                  >
                    <IconLogOut size={16} />
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--primary-400)] hover:bg-[var(--primary-500)]/10"
                >
                  <IconLogIn size={16} />
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
