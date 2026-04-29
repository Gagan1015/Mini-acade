'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { usePathname, useRouter } from 'next/navigation'
import { startTransition } from 'react'
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  DoorOpen,
  Flag,
  Megaphone,
  ShieldAlert,
  TrendingUp,
  UserPlus,
} from 'lucide-react'

import { GameIcon } from '@/components/ui/GameIcons'

type AnalyticsRange = '7d' | '30d' | '90d'

type AnalyticsPoint = {
  label: string
  value: number
}

type GameBreakdownEntry = {
  gameId: string
  rooms: number
  plays: number
}

type RecentAdminAction = {
  id: string
  action: string
  actorName: string
  actorEmail: string
  createdAt: string
}

interface AdminAnalyticsClientProps {
  filters: {
    range: AnalyticsRange
  }
  summary: {
    usersAdded: number
    roomsCreated: number
    gamesPlayed: number
    adminActions: number
    activeRoomsNow: number
    activeAnnouncements: number
    moderationActions: number
    reportedQuestions: number
    restrictedQuestions: number
  }
  trend: {
    users: AnalyticsPoint[]
    rooms: AnalyticsPoint[]
    games: AnalyticsPoint[]
  }
  gameBreakdown: GameBreakdownEntry[]
  questionStatusCounts: Array<{
    status: string
    count: number
  }>
  recentActions: RecentAdminAction[]
}

const GAME_COLORS: Record<string, string> = {
  skribble: 'var(--game-skribble)',
  trivia: 'var(--game-trivia)',
  wordel: 'var(--game-wordel)',
  flagel: 'var(--game-flagel)',
}

const RANGE_OPTIONS: Array<{ value: AnalyticsRange; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  approved: { label: 'Approved', badge: 'badge-success' },
  reviewed: { label: 'Reviewed', badge: 'badge-primary' },
  escalated: { label: 'Escalated', badge: 'badge-warning' },
  hidden: { label: 'Hidden', badge: 'badge-error' },
  rejected: { label: 'Rejected', badge: 'badge-error' },
}

function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const then = new Date(dateString)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    'game.config': 'Updated game config',
    'room.force_end': 'Force ended room',
    'room.remove_player': 'Removed player from room',
    'trivia.question.update_status': 'Updated trivia lifecycle',
    'moderation.trivia.approve': 'Approved trivia item',
    'moderation.trivia.reject': 'Rejected trivia item',
    'moderation.trivia.hide': 'Hid trivia item',
    'moderation.trivia.escalate': 'Escalated trivia item',
    'moderation.trivia.mark_reviewed': 'Marked trivia reviewed',
  }

  return labels[action] ?? action
}

function TrendChart({
  title,
  points,
  color,
}: {
  title: string
  points: AnalyticsPoint[]
  color: string
}) {
  const maxValue = Math.max(...points.map((point) => point.value), 0)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        <span className="text-xs text-[var(--text-tertiary)]">
          Peak {maxValue}
        </span>
      </div>

      <div className="relative flex h-[200px] items-end gap-2">
        {points.map((point, index) => {
          const height = maxValue > 0 ? (point.value / maxValue) * 100 : 0
          const visibleHeight = point.value > 0 ? Math.max(height, 5) : 0

          return (
            <motion.div
              key={`${title}-${point.label}`}
              initial={{ height: 0 }}
              animate={{ height: `${visibleHeight}%` }}
              transition={{ delay: 0.03 * index, duration: 0.35 }}
              className="group relative flex-1 rounded-t-md"
              style={{
                background: `linear-gradient(to top, ${color}, color-mix(in srgb, ${color} 55%, transparent))`,
              }}
            >
              <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--surface)] px-2 py-1 text-xs font-medium text-[var(--text-primary)] shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
                {point.label}: {point.value}
              </div>
            </motion.div>
          )
        })}

        {maxValue === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--text-tertiary)]">
            No activity in this range.
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2 text-[10px] text-[var(--text-tertiary)]">
        {points.map((point, index) => {
          const shouldShowLabel =
            points.length <= 8 || index % Math.ceil(points.length / 6) === 0 || index === points.length - 1

          return (
            <span key={`${title}-${point.label}-label`} className="flex-1 text-center">
              {shouldShowLabel ? point.label : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function AdminAnalyticsClient({
  filters,
  summary,
  trend,
  gameBreakdown,
  questionStatusCounts,
  recentActions,
}: AdminAnalyticsClientProps) {
  const router = useRouter()
  const pathname = usePathname()

  function updateRange(range: AnalyticsRange) {
    const params = new URLSearchParams()
    if (range !== '30d') {
      params.set('range', range)
    }

    const query = params.toString()
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }

  const topGameBreakdown = [...gameBreakdown].sort(
    (left, right) => right.plays - left.plays || right.rooms - left.rooms,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Track platform growth, room activity, game volume, and moderation pressure over time.
          </p>
        </div>

        <div className="relative w-full sm:w-56">
          <select
            value={filters.range}
            onChange={(event) => updateRange(event.target.value as AnalyticsRange)}
            className="input appearance-none pr-8"
            aria-label="Analytics range"
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Users Added',
            value: summary.usersAdded,
            icon: UserPlus,
            color: 'var(--primary-500)',
          },
          {
            label: 'Rooms Created',
            value: summary.roomsCreated,
            icon: DoorOpen,
            color: 'var(--success-500)',
          },
          {
            label: 'Games Played',
            value: summary.gamesPlayed,
            icon: Activity,
            color: 'var(--game-trivia)',
          },
          {
            label: 'Admin Actions',
            value: summary.adminActions,
            icon: BarChart3,
            color: 'var(--warning-500)',
          },
          {
            label: 'Live Rooms',
            value: summary.activeRoomsNow,
            icon: TrendingUp,
            color: 'var(--success-500)',
          },
          {
            label: 'Active Announcements',
            value: summary.activeAnnouncements,
            icon: Megaphone,
            color: 'var(--primary-500)',
          },
          {
            label: 'Moderation Actions',
            value: summary.moderationActions,
            icon: ShieldAlert,
            color: 'var(--warning-500)',
          },
          {
            label: 'Reported Questions',
            value: summary.reportedQuestions,
            icon: Flag,
            color: 'var(--error-500)',
          },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center gap-2">
              <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
              <p className="text-xs font-medium text-[var(--text-tertiary)]">{stat.label}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <TrendChart title="User Signups" points={trend.users} color="var(--primary-500)" />
        <TrendChart title="Rooms Created" points={trend.rooms} color="var(--success-500)" />
        <TrendChart title="Games Played" points={trend.games} color="var(--game-trivia)" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Game Breakdown</h2>
              <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                Rooms created and game results recorded in the selected range
              </p>
            </div>
            <Link
              href="/admin/games"
              className="flex items-center gap-1 text-xs font-medium text-[var(--primary-400)] hover:text-[var(--primary-300)]"
            >
              Open games <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {topGameBreakdown.length > 0 ? (
              topGameBreakdown.map((entry) => {
                const color = GAME_COLORS[entry.gameId] || 'var(--primary-500)'
                const maxPlays = Math.max(...topGameBreakdown.map((item) => item.plays), 1)
                const playWidth = `${Math.max((entry.plays / maxPlays) * 100, entry.plays > 0 ? 10 : 0)}%`

                return (
                  <div
                    key={entry.gameId}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
                          }}
                        >
                          <span className="scale-90">
                            <GameIcon gameId={entry.gameId} size={22} />
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold capitalize text-[var(--text-primary)]">
                            {entry.gameId}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {entry.rooms} rooms · {entry.plays} plays
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {entry.plays}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">results</p>
                      </div>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: playWidth,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-tertiary)]">
                No game activity recorded in this range.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Content Health</h2>
                <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                  Current trivia lifecycle distribution across all content
                </p>
              </div>
              <Link
                href="/admin/moderation"
                className="flex items-center gap-1 text-xs font-medium text-[var(--primary-400)] hover:text-[var(--primary-300)]"
              >
                Open moderation <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {questionStatusCounts.map((entry) => (
                <div
                  key={entry.status}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[var(--game-trivia)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {STATUS_CONFIG[entry.status]?.label ?? entry.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${STATUS_CONFIG[entry.status]?.badge ?? 'badge-primary'}`}>
                      {entry.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                  Reported
                </p>
                <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                  {summary.reportedQuestions}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                  Restricted
                </p>
                <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                  {summary.restrictedQuestions}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Admin Actions</h2>
                <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                  Latest actions inside the selected range
                </p>
              </div>
              <Link
                href="/admin/logs"
                className="flex items-center gap-1 text-xs font-medium text-[var(--primary-400)] hover:text-[var(--primary-300)]"
              >
                View logs <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentActions.length > 0 ? (
              <div className="space-y-2">
                {recentActions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {getActionLabel(action.action)}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                          by {action.actorName}
                          {action.actorEmail ? ` (${action.actorEmail})` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-[var(--text-tertiary)]">
                        {formatTimeAgo(action.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-tertiary)]">
                No admin activity logged in this range.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
