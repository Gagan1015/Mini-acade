'use client'

import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Ban,
  CheckCircle2,
  PauseCircle,
  Clock,
  Calendar,
  Mail,
  Gamepad2,
  Trophy,
  Target,
  Timer,
  Hash,
  Activity,
  Server,
  AlertTriangle,
} from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { UserAvatar } from '@/components/ui/UserAvatar'

/* ── Types ── */
interface UserData {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  status: string
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  emailVerified: string | null
  _count: {
    roomsCreated: number
    roomPlayers: number
    gameResults: number
    sessions: number
    accounts: number
  }
}

interface GameStatData {
  id: string
  gameId: string
  gamesPlayed: number
  gamesWon: number
  totalScore: number
  highScore: number
  totalTime: number
}

interface RecentResult {
  id: string
  gameId: string
  score: number
  rank: number | null
  isWinner: boolean
  duration: number | null
  roomCode: string
  createdAt: string
}

interface RecentRoom {
  id: string
  code: string
  gameId: string
  status: string
  playerCount: number
  createdAt: string
}

interface AdminLog {
  id: string
  action: string
  actorName: string
  details: Record<string, unknown> | null
  createdAt: string
}

interface Props {
  user: UserData
  gameStats: GameStatData[]
  recentResults: RecentResult[]
  recentRooms: RecentRoom[]
  adminLogs: AdminLog[]
}

/* ── Config ── */
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Shield }> = {
  USER: { label: 'User', color: 'var(--primary-500)', bg: 'rgba(59,130,246,0.1)', icon: Shield },
  MODERATOR: { label: 'Moderator', color: 'var(--warning-500)', bg: 'rgba(245,158,11,0.1)', icon: ShieldCheck },
  ADMIN: { label: 'Admin', color: 'var(--success-500)', bg: 'rgba(16,185,129,0.1)', icon: ShieldAlert },
  SUPER_ADMIN: { label: 'Super Admin', color: 'var(--error-500)', bg: 'rgba(239,68,68,0.1)', icon: Crown },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  ACTIVE: { label: 'Active', color: 'var(--success-500)', bg: 'rgba(16,185,129,0.1)', dot: 'bg-[var(--success-500)]' },
  SUSPENDED: { label: 'Suspended', color: 'var(--warning-500)', bg: 'rgba(245,158,11,0.1)', dot: 'bg-[var(--warning-500)]' },
  BANNED: { label: 'Banned', color: 'var(--error-500)', bg: 'rgba(239,68,68,0.1)', dot: 'bg-[var(--error-500)]' },
}

const GAME_LABELS: Record<string, string> = {
  skribble: 'Skribble',
  trivia: 'Trivia',
  wordel: 'Wordel',
  flagel: 'Flagel',
}

const GAME_COLORS: Record<string, string> = {
  skribble: 'var(--game-skribble)',
  trivia: 'var(--game-trivia)',
  wordel: 'var(--game-wordel)',
  flagel: 'var(--game-flagel)',
}

const ROOM_STATUS_STYLE: Record<string, string> = {
  WAITING: 'badge-warning',
  PLAYING: 'badge-success',
  FINISHED: 'badge-primary',
  ABANDONED: 'badge-error',
}

/* ── Helpers ── */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatRelative(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(dateString)
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  if (h <= 0) return `${m}m`
  return `${h}h ${m}m`
}

/* ══════════════════════════════════════════════
   Admin User Detail Client
   ══════════════════════════════════════════════ */

export function AdminUserDetailClient({
  user,
  gameStats,
  recentResults,
  recentRooms,
  adminLogs,
}: Props) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(user)
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'role' | 'status'; value: string } | null>(null)

  const roleInfo = ROLE_CONFIG[currentUser.role] ?? ROLE_CONFIG.USER
  const statusInfo = STATUS_CONFIG[currentUser.status] ?? STATUS_CONFIG.ACTIVE
  const RoleIcon = roleInfo.icon

  // Computed stats
  const totalGames = gameStats.reduce((s, g) => s + g.gamesPlayed, 0)
  const totalWins = gameStats.reduce((s, g) => s + g.gamesWon, 0)
  const totalScore = gameStats.reduce((s, g) => s + g.totalScore, 0)
  const bestScore = gameStats.reduce((s, g) => Math.max(s, g.highScore), 0)
  const totalTime = gameStats.reduce((s, g) => s + g.totalTime, 0)
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0

  async function applyAction(type: 'role' | 'status', value: string) {
    setLoading(true)
    try {
      const body = type === 'role' ? { role: value } : { status: value }
      const res = await fetch(`/api/admin/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const updated = await res.json()
        setCurrentUser((prev) => ({
          ...prev,
          role: updated.role ?? prev.role,
          status: updated.status ?? prev.status,
        }))
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
      setConfirmAction(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Back + title ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/users')}
          className="btn btn-ghost btn-sm !p-2"
          aria-label="Back to users"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            User Details
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-tertiary)]">
            ID: <span className="font-mono text-[var(--text-secondary)]">{currentUser.id}</span>
          </p>
        </div>
      </div>

      {/* ── Profile hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <UserAvatar
              src={currentUser.image}
              name={currentUser.name}
              alt={currentUser.name}
              className="h-20 w-20 rounded-2xl ring-2 ring-[var(--border)]"
              fallbackClassName="bg-[var(--primary-500)]/15 text-2xl text-[var(--primary-400)]"
              iconClassName="h-7 w-7"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{currentUser.name}</h2>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {currentUser.email || 'No email'}
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: roleInfo.bg, color: roleInfo.color }}
              >
                <RoleIcon className="h-3.5 w-3.5" />
                {roleInfo.label}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: statusInfo.bg, color: statusInfo.color }}
              >
                <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
                {statusInfo.label}
              </span>
              {currentUser.emailVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-500)]/10 px-3 py-1 text-xs font-semibold text-[var(--success-500)]">
                  <CheckCircle2 className="h-3 w-3" />
                  Email verified
                </span>
              )}
            </div>
          </div>

          {/* Quick meta */}
          <div className="flex-shrink-0 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
              <Calendar className="h-3.5 w-3.5" />
              <span>Joined {formatDate(currentUser.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Last login{' '}
                {currentUser.lastLoginAt ? formatRelative(currentUser.lastLoginAt) : 'never'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
              <Server className="h-3.5 w-3.5" />
              <span>{currentUser._count.sessions} active session(s)</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
              <Activity className="h-3.5 w-3.5" />
              <span>{currentUser._count.accounts} linked account(s)</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Quick Stats ── */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        {[
          { label: 'Games Played', value: totalGames, icon: Gamepad2, color: 'var(--primary-500)' },
          { label: 'Wins', value: totalWins, icon: Trophy, color: 'var(--success-500)' },
          { label: 'Win Rate', value: `${winRate}%`, icon: Target, color: 'var(--warning-500)' },
          { label: 'Total Score', value: totalScore.toLocaleString(), icon: Hash, color: 'var(--game-skribble)' },
          { label: 'Best Score', value: bestScore, icon: Trophy, color: 'var(--game-flagel)' },
          { label: 'Time Played', value: formatDuration(totalTime), icon: Timer, color: 'var(--game-trivia)' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} variants={staggerItem} className="card">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" style={{ color: stat.color }} />
                <p className="text-xs font-medium text-[var(--text-tertiary)]">{stat.label}</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* ── Content grid ── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* ── Admin Actions ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card"
          >
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Admin Actions</h3>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Change role or account status for this user.
            </p>

            {/* Confirm dialog */}
            {confirmAction && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 rounded-lg border border-[var(--warning-500)]/30 bg-[var(--warning-500)]/5 p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--warning-500)]" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Confirm {confirmAction.type} change
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {confirmAction.type === 'role'
                        ? `Set role to "${ROLE_CONFIG[confirmAction.value]?.label ?? confirmAction.value}" for ${currentUser.name}?`
                        : `Set status to "${STATUS_CONFIG[confirmAction.value]?.label ?? confirmAction.value}" for ${currentUser.name}?`}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => applyAction(confirmAction.type, confirmAction.value)}
                        disabled={loading}
                        className="btn btn-primary btn-sm"
                      >
                        {loading ? 'Applying…' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmAction(null)}
                        className="btn btn-ghost btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {/* Role panel */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Change Role
                </p>
                <div className="mt-2 space-y-1">
                  {(['USER', 'MODERATOR', 'ADMIN'] as const).map((role) => {
                    const r = ROLE_CONFIG[role]
                    const Icon = r.icon
                    const isActive = currentUser.role === role
                    return (
                      <button
                        key={role}
                        onClick={() => !isActive && setConfirmAction({ type: 'role', value: role })}
                        disabled={isActive || loading}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[var(--primary-500)]/10 text-[var(--primary-500)] cursor-default'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                        } disabled:opacity-40`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{r.label}</span>
                        {isActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                            Current
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Status panel */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Account Status
                </p>
                <div className="mt-2 space-y-1">
                  {([
                    { status: 'ACTIVE', icon: CheckCircle2, label: 'Activate' },
                    { status: 'SUSPENDED', icon: PauseCircle, label: 'Suspend' },
                    { status: 'BANNED', icon: Ban, label: 'Ban' },
                  ] as const).map((item) => {
                    const Icon = item.icon
                    const s = STATUS_CONFIG[item.status]
                    const isActive = currentUser.status === item.status
                    return (
                      <button
                        key={item.status}
                        onClick={() => !isActive && setConfirmAction({ type: 'status', value: item.status })}
                        disabled={isActive || loading}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'cursor-default'
                            : 'hover:bg-[var(--surface-hover)]'
                        } disabled:opacity-40`}
                        style={{
                          color: isActive ? s.color : undefined,
                          background: isActive ? s.bg : undefined,
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {isActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                            Current
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Game Stats ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Game Statistics</h3>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Per-game breakdown for this user.
            </p>

            {gameStats.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {gameStats.map((stat) => {
                  const gameWr = stat.gamesPlayed > 0 ? Math.round((stat.gamesWon / stat.gamesPlayed) * 100) : 0
                  const color = GAME_COLORS[stat.gameId] ?? 'var(--primary-500)'
                  return (
                    <div
                      key={stat.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-semibold text-[var(--text-primary)]">
                            {GAME_LABELS[stat.gameId] ?? stat.gameId}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-[var(--text-tertiary)]">
                          {stat.gamesPlayed} played
                        </span>
                      </div>

                      {/* Win rate bar */}
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${gameWr}%`, background: color }}
                          />
                        </div>
                        <span className="text-xs font-mono font-semibold text-[var(--text-secondary)]">
                          {gameWr}%
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[var(--text-tertiary)]">Wins</span>
                          <span className="font-semibold text-[var(--text-primary)]">{stat.gamesWon}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-tertiary)]">High</span>
                          <span className="font-semibold text-[var(--text-primary)]">{stat.highScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-tertiary)]">Total</span>
                          <span className="font-semibold text-[var(--text-primary)]">{stat.totalScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-tertiary)]">Time</span>
                          <span className="font-semibold text-[var(--text-primary)]">{formatDuration(stat.totalTime)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-tertiary)]">
                No game statistics recorded yet.
              </div>
            )}
          </motion.div>

          {/* ── Recent Game Results ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card !p-0"
          >
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Recent Game Results</h3>
              <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                Last {recentResults.length} game outcomes
              </p>
            </div>

            {recentResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Game
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Room
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Score
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Rank
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Result
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentResults.map((result) => (
                      <tr key={result.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: GAME_COLORS[result.gameId] ?? 'var(--primary-500)' }}
                            />
                            <span className="font-medium text-[var(--text-primary)]">
                              {GAME_LABELS[result.gameId] ?? result.gameId}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-[var(--text-secondary)]">
                          {result.roomCode}
                        </td>
                        <td className="px-5 py-3 font-semibold text-[var(--text-primary)]">
                          {result.score}
                        </td>
                        <td className="px-5 py-3 text-[var(--text-secondary)]">
                          {result.rank ? `#${result.rank}` : '—'}
                        </td>
                        <td className="px-5 py-3">
                          {result.isWinner ? (
                            <span className="badge badge-success">Winner</span>
                          ) : (
                            <span className="text-xs text-[var(--text-tertiary)]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-[var(--text-tertiary)]">
                          {formatRelative(result.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-[var(--text-tertiary)]">
                No game results recorded.
              </div>
            )}
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* ── Account Details ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Account Details</h3>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                { label: 'User ID', value: currentUser.id, mono: true },
                { label: 'Email', value: currentUser.email || '—' },
                { label: 'Email Verified', value: currentUser.emailVerified ? formatDate(currentUser.emailVerified) : 'Not verified' },
                { label: 'Created', value: formatDateTime(currentUser.createdAt) },
                { label: 'Last Updated', value: formatDateTime(currentUser.updatedAt) },
                { label: 'Last Login', value: currentUser.lastLoginAt ? formatDateTime(currentUser.lastLoginAt) : 'Never' },
                { label: 'Active Sessions', value: String(currentUser._count.sessions) },
                { label: 'Linked Accounts', value: String(currentUser._count.accounts) },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4">
                  <dt className="text-[var(--text-tertiary)] whitespace-nowrap">{item.label}</dt>
                  <dd className={`text-right font-medium text-[var(--text-primary)] ${item.mono ? 'font-mono text-xs break-all' : ''}`}>
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>

          {/* ── Activity Summary ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card"
          >
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Activity Summary</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--text-tertiary)]">Rooms Created</dt>
                <dd className="font-semibold text-[var(--text-primary)]">{currentUser._count.roomsCreated}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-tertiary)]">Rooms Joined</dt>
                <dd className="font-semibold text-[var(--text-primary)]">{currentUser._count.roomPlayers}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-tertiary)]">Games Recorded</dt>
                <dd className="font-semibold text-[var(--text-primary)]">{currentUser._count.gameResults}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-tertiary)]">Total Score</dt>
                <dd className="font-semibold text-[var(--text-primary)]">{totalScore.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-tertiary)]">Time Played</dt>
                <dd className="font-semibold text-[var(--text-primary)]">{formatDuration(totalTime)}</dd>
              </div>
            </dl>
          </motion.div>

          {/* ── Recent Rooms ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Recent Rooms</h3>
            {recentRooms.length > 0 ? (
              <div className="mt-3 space-y-2">
                {recentRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: GAME_COLORS[room.gameId] ?? 'var(--primary-500)' }}
                      />
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          <span className="font-mono">{room.code}</span>
                          <span className="ml-2 text-xs text-[var(--text-tertiary)]">
                            {GAME_LABELS[room.gameId] ?? room.gameId}
                          </span>
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {room.playerCount} players · {formatRelative(room.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${ROOM_STATUS_STYLE[room.status] ?? 'badge-primary'}`}>
                      {room.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-tertiary)]">No rooms found.</p>
            )}
          </motion.div>

          {/* ── Admin Audit Log ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card"
          >
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Audit Log</h3>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
              Admin actions involving this user
            </p>
            {adminLogs.length > 0 ? (
              <div className="mt-3 space-y-2">
                {adminLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {log.action}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          by {log.actorName}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-[var(--text-tertiary)]">
                        {formatRelative(log.createdAt)}
                      </span>
                    </div>
                    {log.details && (
                      <pre className="mt-2 overflow-auto rounded bg-[var(--surface-hover)] px-2 py-1 text-[10px] font-mono text-[var(--text-secondary)]">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-tertiary)]">No audit entries.</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
