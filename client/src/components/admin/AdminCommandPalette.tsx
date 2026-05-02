'use client'

import { useState, useEffect, useRef, useCallback, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  Users,
  DoorOpen,
  Gamepad2,
  TrendingUp,
  FileText,
  ShieldAlert,
  Settings,
  BarChart3,
  Hash,
  CornerDownLeft,
} from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SearchUser = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string
  status: string
}

type SearchRoom = {
  id: string
  code: string
  gameId: string
  status: string
  createdAt: string
  creator: { name: string | null }
  _count: { players: number }
}

type SearchGame = {
  id: string
  gameId: string
  name: string
  isEnabled: boolean
}

type SearchResults = {
  users: SearchUser[]
  rooms: SearchRoom[]
  games: SearchGame[]
}

type QuickAction = {
  label: string
  href: string
  icon: ReactNode
  description: string
}

const quickActions: QuickAction[] = [
  { label: 'Dashboard', href: '/admin', icon: <BarChart3 className="h-4 w-4" />, description: 'Overview & stats' },
  { label: 'Users', href: '/admin/users', icon: <Users className="h-4 w-4" />, description: 'Manage all users' },
  { label: 'Rooms', href: '/admin/rooms', icon: <DoorOpen className="h-4 w-4" />, description: 'Active & past rooms' },
  { label: 'Games', href: '/admin/games', icon: <Gamepad2 className="h-4 w-4" />, description: 'Game configuration' },
  { label: 'Analytics', href: '/admin/analytics', icon: <TrendingUp className="h-4 w-4" />, description: 'Traffic & usage' },
  { label: 'Moderation', href: '/admin/moderation', icon: <ShieldAlert className="h-4 w-4" />, description: 'Reports & flags' },
  { label: 'Activity Logs', href: '/admin/logs', icon: <FileText className="h-4 w-4" />, description: 'Admin action history' },
  { label: 'Settings', href: '/admin/settings', icon: <Settings className="h-4 w-4" />, description: 'System settings' },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusDot = (status: string) => {
  switch (status) {
    case 'ACTIVE':
    case 'WAITING':
      return 'bg-[var(--success-500)]'
    case 'PLAYING':
      return 'bg-[var(--primary-500)]'
    case 'SUSPENDED':
      return 'bg-[var(--warning-500)]'
    case 'BANNED':
    case 'ABANDONED':
      return 'bg-[var(--error-500)]'
    default:
      return 'bg-[var(--text-tertiary)]'
  }
}

const roleBadgeStyle = (role: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'bg-[var(--error-500)]/12 text-[var(--error-500)] border-[var(--error-500)]/20'
    case 'ADMIN':
      return 'bg-[var(--warning-500)]/12 text-[var(--warning-500)] border-[var(--warning-500)]/20'
    case 'MODERATOR':
      return 'bg-[var(--primary-500)]/12 text-[var(--primary-500)] border-[var(--primary-500)]/20'
    default:
      return 'bg-[var(--surface)] text-[var(--text-tertiary)] border-[var(--border)]'
  }
}

const gameColor = (gameId: string) => {
  switch (gameId) {
    case 'skribble':
      return 'var(--game-skribble)'
    case 'trivia':
      return 'var(--game-trivia)'
    case 'wordel':
      return 'var(--game-wordel)'
    case 'flagel':
      return 'var(--game-flagel)'
    default:
      return 'var(--text-tertiary)'
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminCommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({
    users: [],
    rooms: [],
    games: [],
  })
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const router = useRouter()

  const isSearching = query.length >= 2
  const hasResults =
    results.users.length + results.rooms.length + results.games.length > 0

  // Build flat navigable item list for keyboard nav
  type FlatItem = { type: string; href: string; key: string }
  const flatItems: FlatItem[] = isSearching
    ? [
        ...results.users.map((u) => ({
          type: 'user',
          href: `/admin/users/${u.id}`,
          key: `u-${u.id}`,
        })),
        ...results.rooms.map((r) => ({
          type: 'room',
          href: `/admin/rooms/${r.id}`,
          key: `r-${r.id}`,
        })),
        ...results.games.map((g) => ({
          type: 'game',
          href: '/admin/games',
          key: `g-${g.id}`,
        })),
      ]
    : quickActions.map((a) => ({
        type: 'quick',
        href: a.href,
        key: `q-${a.href}`,
      }))

  const totalItems = flatItems.length

  /* ── Keyboard shortcut ── */
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  /* ── Reset on open ── */
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults({ users: [], rooms: [], games: [] })
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  /* ── Scroll active item into view ── */
  useEffect(() => {
    if (!listRef.current) return
    const active = listRef.current.querySelector('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  /* ── Debounced search ── */
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults({ users: [], rooms: [], games: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/search?q=${encodeURIComponent(q)}`
      )
      if (res.ok) {
        const data = await res.json()
        setResults(data)
        setActiveIndex(0)
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setActiveIndex(0)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 220)
  }

  const navigate = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % Math.max(totalItems, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(
        (i) => (i - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1)
      )
    } else if (e.key === 'Enter' && flatItems[activeIndex]) {
      e.preventDefault()
      navigate(flatItems[activeIndex].href)
    }
  }

  /* ── Running index tracker for grouped results ── */
  let idx = -1
  const nextIdx = () => ++idx

  /* ── Shared item row class builder ── */
  const rowCls = (i: number) =>
    `group/row relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] outline-none transition-all duration-100 ${
      activeIndex === i
        ? 'bg-[var(--primary-500)]/[0.08] text-[var(--text-primary)]'
        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
    }`

  const activeBar = (i: number) =>
    activeIndex === i ? (
      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--primary-500)]" />
    ) : null

  return (
    <>
      {/* ── Trigger ── */}
      <button
        onClick={() => setOpen(true)}
        className="group relative flex max-w-md flex-1 items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-left text-sm text-[var(--text-tertiary)] transition-all hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]"
      >
        <Search className="h-3.5 w-3.5 flex-shrink-0 opacity-50 transition-opacity group-hover:opacity-80" />
        <span className="flex-1 truncate">Search anything…</span>
        <kbd className="ml-auto hidden rounded-md border border-[var(--border)] bg-[var(--background)] px-1.5 py-[3px] font-mono text-[10px] leading-none sm:inline">
          ⌘K
        </kbd>
      </button>

      {/* ── Modal ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]"
            onClick={() => setOpen(false)}
          >
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-[var(--border-strong)]/60 bg-[var(--background)] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5)]"
              style={{
                backgroundImage:
                  'linear-gradient(to bottom, var(--surface) 0%, var(--background) 100%)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Search input ── */}
              <div className="relative flex items-center border-b border-[var(--border)] transition-colors focus-within:border-[var(--primary-500)]/60">
                <div className="pointer-events-none flex h-[52px] w-12 items-center justify-center text-[var(--text-tertiary)]">
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-[1.5px] border-[var(--border-strong)] border-t-[var(--primary-400)]" />
                  ) : (
                    <Search className="h-[18px] w-[18px]" />
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search users, rooms, games…"
                  className="h-[52px] flex-1 bg-transparent pr-4 text-[15px] font-medium text-[var(--text-primary)] outline-none focus:outline-none focus-visible:outline-none placeholder:font-normal placeholder:text-[var(--text-tertiary)]/60"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {/* ── Results / Quick actions ── */}
              <div
                ref={listRef}
                className="max-h-[380px] scroll-py-2 overflow-y-auto overscroll-contain p-1.5"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor:
                    'var(--border) transparent',
                }}
              >
                {/* Loading skeleton */}
                {loading && !hasResults && (
                  <div className="space-y-1 p-1.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3">
                        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--surface-hover)]" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-28 animate-pulse rounded bg-[var(--surface-hover)]" />
                          <div className="h-2.5 w-40 animate-pulse rounded bg-[var(--surface-hover)]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No results */}
                {!loading && isSearching && !hasResults && (
                  <div className="flex flex-col items-center py-12">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-hover)]">
                      <Search className="h-5 w-5 text-[var(--text-tertiary)]/50" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">
                      No results found
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      Try searching with a different term
                    </p>
                  </div>
                )}

                {/* Quick actions (when no search query) */}
                {!isSearching && (
                  <>
                    <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]/60">
                      Quick actions
                    </p>
                    {quickActions.map((action) => {
                      const i = nextIdx()
                      return (
                        <button
                          key={action.href}
                          onClick={() => navigate(action.href)}
                          onMouseEnter={() => setActiveIndex(i)}
                          data-active={activeIndex === i}
                          className={rowCls(i)}
                        >
                          {activeBar(i)}
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-tertiary)] transition-colors group-hover/row:text-[var(--text-secondary)]">
                            {action.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-[var(--text-primary)]">
                              {action.label}
                            </span>
                            <span className="ml-2 text-[var(--text-tertiary)]">
                              {action.description}
                            </span>
                          </div>
                          <CornerDownLeft className="h-3.5 w-3.5 text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover/row:opacity-60" />
                        </button>
                      )
                    })}
                  </>
                )}

                {/* ── User results ── */}
                {!loading && results.users.length > 0 && (
                  <div>
                    <p className="px-3 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]/60">
                      Users
                    </p>
                    {results.users.map((user) => {
                      const i = nextIdx()
                      return (
                        <button
                          key={user.id}
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          onMouseEnter={() => setActiveIndex(i)}
                          data-active={activeIndex === i}
                          className={rowCls(i)}
                        >
                          {activeBar(i)}
                          <UserAvatar
                            src={user.image}
                            name={user.name ?? '?'}
                            alt={user.name ?? 'User'}
                            className="h-8 w-8 rounded-full ring-1 ring-[var(--border)]"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-[var(--text-primary)]">
                              {user.name || 'Unnamed'}
                            </p>
                            <p className="flex items-center gap-1.5 truncate text-xs text-[var(--text-tertiary)]">
                              {user.email}
                              <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDot(user.status)}`} />
                              <span className="capitalize">{user.status.toLowerCase()}</span>
                            </p>
                          </div>
                          <span
                            className={`rounded-md border px-1.5 py-[2px] text-[10px] font-semibold uppercase leading-none tracking-wide ${roleBadgeStyle(user.role)}`}
                          >
                            {user.role.replace('_', ' ')}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* ── Room results ── */}
                {!loading && results.rooms.length > 0 && (
                  <div>
                    <p className="px-3 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]/60">
                      Rooms
                    </p>
                    {results.rooms.map((room) => {
                      const i = nextIdx()
                      const color = gameColor(room.gameId)
                      return (
                        <button
                          key={room.id}
                          onClick={() => navigate(`/admin/rooms/${room.id}`)}
                          onMouseEnter={() => setActiveIndex(i)}
                          data-active={activeIndex === i}
                          className={rowCls(i)}
                        >
                          {activeBar(i)}
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)]"
                            style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
                          >
                            <Hash className="h-3.5 w-3.5" style={{ color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                              <span className="font-mono tracking-wide">{room.code}</span>
                              <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDot(room.status)}`} />
                            </p>
                            <p className="truncate text-xs text-[var(--text-tertiary)]">
                              <span className="capitalize">{room.gameId}</span>
                              {' · '}
                              {room._count.players} player{room._count.players !== 1 ? 's' : ''}
                              {room.creator.name ? ` · by ${room.creator.name}` : ''}
                            </p>
                          </div>
                          <span className="text-[11px] capitalize text-[var(--text-tertiary)]">
                            {room.status.toLowerCase()}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* ── Game config results ── */}
                {!loading && results.games.length > 0 && (
                  <div>
                    <p className="px-3 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]/60">
                      Games
                    </p>
                    {results.games.map((game) => {
                      const i = nextIdx()
                      const color = gameColor(game.gameId)
                      return (
                        <button
                          key={game.id}
                          onClick={() => navigate('/admin/games')}
                          onMouseEnter={() => setActiveIndex(i)}
                          data-active={activeIndex === i}
                          className={rowCls(i)}
                        >
                          {activeBar(i)}
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)]"
                            style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
                          >
                            <Gamepad2 className="h-4 w-4" style={{ color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[var(--text-primary)]">
                              {game.name}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)]">
                              {game.isEnabled ? (
                                <span className="text-[var(--success-500)]">Enabled</span>
                              ) : (
                                <span className="text-[var(--error-500)]">Disabled</span>
                              )}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="flex items-center gap-5 border-t border-[var(--border)] px-4 py-2">
                <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]/60">
                  <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-1 font-mono text-[10px] leading-none">
                    ↑
                  </kbd>
                  <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-1 font-mono text-[10px] leading-none">
                    ↓
                  </kbd>
                  <span className="ml-0.5">Navigate</span>
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]/60">
                  <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-1 font-mono text-[10px] leading-none">
                    ↵
                  </kbd>
                  <span className="ml-0.5">Open</span>
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]/60">
                  <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-1 font-mono text-[10px] leading-none">
                    esc
                  </kbd>
                  <span className="ml-0.5">Close</span>
                </span>
                {isSearching && hasResults && (
                  <span className="ml-auto text-[11px] text-[var(--text-tertiary)]/50">
                    {results.users.length + results.rooms.length + results.games.length} results
                  </span>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
