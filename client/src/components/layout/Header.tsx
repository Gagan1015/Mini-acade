'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signIn, signOut, useSession } from 'next-auth/react'
import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} width={28} height={28}>
      <motion.rect
        x="2"
        y="8"
        width="24"
        height="16"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
      />
      <circle cx="9" cy="16" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="19" cy="16" r="1.5" fill="currentColor" opacity="0.7" />
      <motion.path
        d="M11 4V8M17 4V8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
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

function IconSun({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
}

function IconMoon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

function IconArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function IconChevronDown({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function IconHome({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  )
}

function IconBarChart({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function ThemeToggle({
  theme,
  mounted,
  onToggle,
}: {
  theme: 'light' | 'dark'
  mounted: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={mounted ? `Switch to ${theme === 'light' ? 'dark' : 'light'} theme` : 'Toggle theme'}
      className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
    >
      {mounted && theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
    </button>
  )
}

function NavLink({
  href,
  children,
  onClick,
  variant,
}: {
  href: string
  children: ReactNode
  onClick?: () => void
  variant: 'default' | 'marketing'
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative px-1 py-2 text-sm font-medium transition-colors ${
        variant === 'marketing'
          ? 'text-[var(--text-primary)]/72 hover:text-[var(--text-primary)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
    >
      {children}
      <span
        className={`absolute bottom-0 left-0 h-px w-0 transition-all duration-300 group-hover:w-full ${
          variant === 'marketing' ? 'bg-[var(--marketing-accent)]' : 'bg-[var(--primary-400)]'
        }`}
      />
    </Link>
  )
}

interface HeaderProps {
  variant?: 'default' | 'marketing'
}

type MenuItem = {
  href: string
  label: string
  icon: ReactNode
  accent?: boolean
}

export function Header({ variant = 'default' }: HeaderProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const user = session?.user
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isLandingPage = pathname === '/'
  const showLandingNav = variant === 'marketing' && isLandingPage

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMounted(true)
    const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    setTheme(currentTheme)
  }, [])

  useEffect(() => {
    if (!mounted) return

    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('theme', theme)
  }, [mounted, theme])

  useEffect(() => {
    if (variant !== 'marketing') return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 18)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [variant])

  useEffect(() => {
    setMobileMenuOpen(false)
    setProfileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = ''
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!profileMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [profileMenuOpen])

  const navItems =
    variant === 'marketing'
      ? showLandingNav
        ? [
            { href: '#games', label: 'Games' },
            { href: '#how-it-works', label: 'How it works' },
            { href: '/lobby', label: 'Lobby' },
          ]
        : []
      : [
          { href: '/', label: 'Games' },
          { href: '/lobby', label: 'Lobby' },
          ...(user ? [{ href: '/stats', label: 'My Stats' }] : []),
        ]

  const accountItems: MenuItem[] = [
    { href: '/', label: 'Home', icon: <IconHome size={16} /> },
    { href: '/lobby', label: 'Lobby', icon: <IconArrowRight size={15} /> },
    { href: '/profile', label: 'Profile', icon: <IconUser size={16} /> },
    { href: '/stats', label: 'My Stats', icon: <IconBarChart size={16} /> },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin Dashboard', icon: <IconDashboard size={16} />, accent: true }] : []),
  ]

  const ctaHref = user ? '/lobby' : '/auth/signin'
  const ctaLabel = user ? 'Open lobby' : variant === 'marketing' ? 'Get started' : 'Sign in'

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
      className={`sticky top-0 z-50 ${
        variant === 'marketing'
          ? `${isScrolled ? '' : 'marketing-rail-layout'} border-b border-transparent bg-transparent`
          : 'border-b border-[var(--border)]/50 bg-[var(--background)]/80 backdrop-blur-xl'
      }`}
    >
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${variant === 'marketing' ? 'py-3' : ''}`}>
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className={`flex items-center justify-between ${
            variant === 'marketing'
              ? [
                  'min-h-[64px] px-4 sm:px-6',
                  isScrolled
                    ? 'rounded-[16px] border shadow-[var(--marketing-shadow-strong)] backdrop-blur-xl'
                    : 'rounded-none border border-transparent bg-transparent',
                ].join(' ')
              : 'h-16'
          }`}
          style={
            variant === 'marketing' && isScrolled
              ? {
                  backgroundColor: 'var(--marketing-header-sticky-bg)',
                  borderColor: 'var(--marketing-header-sticky-border)',
                }
              : undefined
          }
        >
          <Link
            href="/"
            className={`flex items-center gap-3 transition-colors ${
              variant === 'marketing'
                ? 'text-[var(--text-primary)] hover:text-[var(--marketing-accent)]'
                : 'text-[var(--text-primary)] hover:text-[var(--primary-400)]'
            }`}
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-[12px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
              <LogoMark />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-tight">Mini Arcade</span>
            </div>
          </Link>

          {navItems.length > 0 && (
            <nav className="hidden items-center gap-8 md:flex">
              {navItems.map((item) => (
                <NavLink key={item.label} href={item.href} variant={variant}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-3">
            <ThemeToggle
              theme={theme}
              mounted={mounted}
              onToggle={() => setTheme((value) => (value === 'light' ? 'dark' : 'light'))}
            />

            {status === 'loading' ? (
              <div className="hidden h-10 w-[148px] animate-pulse rounded-[12px] bg-[var(--surface)] md:block" />
            ) : user ? (
              <div ref={profileMenuRef} className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((value) => !value)}
                  aria-label="Open account menu"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  className={`flex items-center gap-2.5 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-left transition-all ${
                    profileMenuOpen
                      ? 'shadow-[var(--marketing-shadow)] ring-1 ring-[var(--marketing-accent)]/20'
                      : 'hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={user.name || 'User'}
                      className="h-8 w-8 rounded-full ring-1 ring-[var(--border)]"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)]">
                      <IconUser size={14} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="max-w-[124px] truncate text-sm font-semibold text-[var(--text-primary)]">
                      {user.name ?? 'Player'}
                    </p>
                    <p className="max-w-[124px] truncate text-[11px] text-[var(--text-tertiary)]">
                      {isAdmin ? 'Admin access enabled' : user.email ?? 'Account menu'}
                    </p>
                  </div>
                  <motion.span
                    animate={{ rotate: profileMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[var(--text-tertiary)]"
                  >
                    <IconChevronDown size={16} />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-[calc(100%+12px)] w-[280px] overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--marketing-panel-bg)] shadow-[var(--marketing-shadow-strong)] backdrop-blur-xl"
                    >
                      <div className="border-b border-[var(--border)] px-4 py-4">
                        <p className="text-base font-semibold text-[var(--text-primary)]">
                          {user.name ?? 'Player'}
                        </p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {user.email ?? 'Signed in'}
                        </p>
                        <div className="mt-3 inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-tertiary)]">
                          {isAdmin ? 'Administrator' : 'Player account'}
                        </div>
                      </div>

                      <div className="px-3 py-3">
                        <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                          Pages
                        </p>
                        <div className="mt-1 space-y-1">
                          {accountItems.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={() => setProfileMenuOpen(false)}
                              className={`flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium transition-colors ${
                                item.accent
                                  ? 'text-[var(--warning-500)] hover:bg-[var(--warning-500)]/10'
                                  : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                              }`}
                            >
                              <span className={item.accent ? 'text-[var(--warning-500)]' : 'text-[var(--text-tertiary)]'}>
                                {item.icon}
                              </span>
                              <span>{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--border)] p-3">
                        <button
                          type="button"
                          onClick={() => void signOut({ callbackUrl: '/' })}
                          className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium text-[var(--error-500)] transition-colors hover:bg-[var(--error-500)]/10"
                        >
                          <IconLogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : variant === 'marketing' ? (
              <div className="hidden items-center gap-3 md:flex">
                <button
                  onClick={() => signIn()}
                  className="text-sm font-semibold text-[var(--text-primary)]/88 transition-colors hover:text-[var(--text-primary)]"
                >
                  Sign in
                </button>
                <Link
                  href={ctaHref}
                  className="inline-flex items-center gap-2 rounded-[12px] bg-[var(--text-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--text-inverse)] transition-transform hover:-translate-y-0.5"
                >
                  {ctaLabel}
                  <IconArrowRight />
                </Link>
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

            <button
              className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] md:hidden"
              onClick={() => setMobileMenuOpen((value) => !value)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[60] md:hidden"
            aria-modal="true"
            role="dialog"
          >
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-[rgba(15,23,42,0.42)] backdrop-blur-[2px]"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col border-l border-[var(--border)] bg-[var(--background)] shadow-[var(--marketing-shadow-strong)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Navigation
                  </p>
                  {user ? (
                    <div className="mt-2 flex items-center gap-3">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image}
                          alt={user.name || 'User'}
                          className="h-11 w-11 rounded-full ring-1 ring-[var(--border)]"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)]">
                          <IconUser size={18} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[var(--text-primary)]">
                          {user.name ?? 'Player'}
                        </p>
                        <p className="truncate text-xs text-[var(--text-secondary)]">
                          {user.email ?? 'Signed in'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                      Mini Arcade
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  aria-label="Close menu"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {navItems.length > 0 && (
                  <div className="space-y-1">
                    <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      Explore
                    </p>
                    {navItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="block rounded-[14px] px-3 py-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}

                {user ? (
                  <>
                    <div className="space-y-1">
                      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                        Pages
                      </p>
                      {accountItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-medium transition-colors ${
                            item.accent
                              ? 'text-[var(--warning-500)] hover:bg-[var(--warning-500)]/10'
                              : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className={item.accent ? 'text-[var(--warning-500)]' : 'text-[var(--text-tertiary)]'}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      Account
                    </p>
                    <button
                      onClick={() => signIn()}
                      className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      <IconLogIn size={16} />
                      Sign In
                    </button>
                    {variant === 'marketing' && (
                      <Link
                        href={ctaHref}
                        className="mt-2 flex items-center justify-center gap-2 rounded-[14px] bg-[var(--text-primary)] px-3 py-3 text-sm font-semibold text-[var(--text-inverse)]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {ctaLabel}
                        <IconArrowRight />
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {user && (
                <div className="border-t border-[var(--border)] p-5">
                  <button
                    onClick={() => void signOut({ callbackUrl: '/' })}
                    className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-medium text-[var(--error-500)] transition-colors hover:bg-[var(--error-500)]/10"
                  >
                    <IconLogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
