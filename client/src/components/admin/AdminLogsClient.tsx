'use client'

import { motion } from 'motion/react'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  Settings,
  Shield,
  Trash2,
  User,
  UserCog,
  X,
} from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'

interface AdminLog {
  id: string
  action: string
  actorId: string
  actorName: string
  actorEmail: string
  actorRole: string
  targetType: string | null
  targetId: string | null
  details: Record<string, unknown> | null
  createdAt: string
}

interface AdminLogFilters {
  page: number
  actor: string
  action: string
  targetType: string
  dateFrom: string
  dateTo: string
}

interface AdminLogsClientProps {
  logs: AdminLog[]
  filters: AdminLogFilters
  totalCount: number
  totalPages: number
  pageSize: number
  availableActions: string[]
  availableTargetTypes: string[]
}

const ACTION_ICONS: Record<string, typeof Activity> = {
  'user.update': UserCog,
  'user.ban': AlertTriangle,
  'user.delete': Trash2,
  'settings.update': Settings,
  'room.delete': Trash2,
  'room.force_end': AlertTriangle,
  'room.remove_player': UserCog,
  'moderation.trivia.approve': CheckCircle2,
  'moderation.trivia.reject': AlertTriangle,
  'moderation.trivia.hide': AlertTriangle,
  'moderation.trivia.escalate': Shield,
  'moderation.trivia.mark_reviewed': FileText,
  'trivia.question.update_status': Settings,
  'game.config': Settings,
}

const ACTION_COLORS: Record<string, string> = {
  'user.update': 'var(--primary-500)',
  'user.ban': 'var(--error-500)',
  'user.delete': 'var(--error-500)',
  'settings.update': 'var(--warning-500)',
  'room.delete': 'var(--error-500)',
  'room.force_end': 'var(--warning-500)',
  'room.remove_player': 'var(--warning-500)',
  'moderation.trivia.approve': 'var(--success-500)',
  'moderation.trivia.reject': 'var(--error-500)',
  'moderation.trivia.hide': 'var(--error-500)',
  'moderation.trivia.escalate': 'var(--warning-500)',
  'moderation.trivia.mark_reviewed': 'var(--primary-500)',
  'trivia.question.update_status': 'var(--game-trivia)',
  'game.config': 'var(--success-500)',
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
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

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'user.update': 'Updated user',
    'user.ban': 'Banned user',
    'user.delete': 'Deleted user',
    'settings.update': 'Updated settings',
    'room.delete': 'Deleted room',
    'room.force_end': 'Force ended room',
    'room.remove_player': 'Removed player from room',
    'moderation.trivia.approve': 'Approved trivia item',
    'moderation.trivia.reject': 'Rejected trivia item',
    'moderation.trivia.hide': 'Hid trivia item',
    'moderation.trivia.escalate': 'Escalated trivia item',
    'moderation.trivia.mark_reviewed': 'Marked trivia item reviewed',
    'trivia.question.update_status': 'Updated trivia lifecycle status',
    'game.config': 'Updated game config',
  }

  return labels[action] || action
}

export function AdminLogsClient({
  logs,
  filters,
  totalCount,
  totalPages,
  pageSize,
  availableActions,
  availableTargetTypes,
}: AdminLogsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [draftFilters, setDraftFilters] = useState(filters)
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null)

  const groupedByDate = useMemo(
    () =>
      logs.reduce(
        (acc, log) => {
          const dateKey = formatDate(log.createdAt)
          if (!acc[dateKey]) {
            acc[dateKey] = []
          }
          acc[dateKey].push(log)
          return acc
        },
        {} as Record<string, AdminLog[]>,
      ),
    [logs],
  )

  const uniqueActorsOnPage = useMemo(
    () => new Set(logs.map((log) => log.actorEmail || log.actorId)).size,
    [logs],
  )

  function pushFilters(next: Partial<AdminLogFilters>) {
    const params = new URLSearchParams()
    const merged = { ...filters, ...next }

    if (merged.page > 1) {
      params.set('page', String(merged.page))
    }

    if (merged.actor) {
      params.set('actor', merged.actor)
    }

    if (merged.action) {
      params.set('action', merged.action)
    }

    if (merged.targetType) {
      params.set('targetType', merged.targetType)
    }

    if (merged.dateFrom) {
      params.set('dateFrom', merged.dateFrom)
    }

    if (merged.dateTo) {
      params.set('dateTo', merged.dateTo)
    }

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  function applyFilters() {
    pushFilters({
      ...draftFilters,
      page: 1,
    })
  }

  function resetFilters() {
    const cleared = {
      page: 1,
      actor: '',
      action: '',
      targetType: '',
      dateFrom: '',
      dateTo: '',
    }
    setDraftFilters(cleared)
    pushFilters(cleared)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          Activity Logs
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Track administrative actions with searchable filters and full context.
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          { label: 'Matching Actions', value: totalCount, color: 'var(--primary-500)' },
          { label: 'This Page', value: logs.length, color: 'var(--success-500)' },
          { label: 'Actors On Page', value: uniqueActorsOnPage, color: 'var(--warning-500)' },
          { label: 'Page Size', value: pageSize, color: 'var(--text-secondary)' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={staggerItem} className="card">
            <p className="text-xs font-medium text-[var(--text-tertiary)]">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <div className="card">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by actor name or email"
              value={draftFilters.actor}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, actor: event.target.value }))
              }
              className="input pl-10"
            />
          </div>

          <div className="relative">
            <select
              value={draftFilters.action}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, action: event.target.value }))
              }
              className="input appearance-none pr-8"
            >
              <option value="">All Actions</option>
              {availableActions.map((action) => (
                <option key={action} value={action}>
                  {getActionLabel(action)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          </div>

          <div className="relative">
            <select
              value={draftFilters.targetType}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, targetType: event.target.value }))
              }
              className="input appearance-none pr-8"
            >
              <option value="">All Targets</option>
              {availableTargetTypes.map((targetType) => (
                <option key={targetType} value={targetType}>
                  {targetType}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          </div>

          <input
            type="date"
            value={draftFilters.dateFrom}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, dateFrom: event.target.value }))
            }
            className="input"
          />

          <input
            type="date"
            value={draftFilters.dateTo}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, dateTo: event.target.value }))
            }
            className="input"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={applyFilters} className="btn btn-primary btn-sm">
            Apply Filters
          </button>
          <button onClick={resetFilters} className="btn btn-ghost btn-sm">
            Reset
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        {Object.keys(groupedByDate).length > 0 ? (
          Object.entries(groupedByDate).map(([date, dateLogs]) => (
            <div key={date}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-7 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--text-tertiary)]">
                  {date}
                </div>
                <div className="flex-1 border-t border-[var(--border-subtle)]" />
              </div>

              <div className="space-y-1">
                {dateLogs.map((log, index) => {
                  const ActionIcon = ACTION_ICONS[log.action] || Activity
                  const actionColor = ACTION_COLORS[log.action] || 'var(--primary-500)'

                  return (
                    <motion.button
                      key={log.id}
                      type="button"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * index }}
                      onClick={() => setSelectedLog(log)}
                      className="group relative flex w-full items-start gap-4 rounded-lg px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      {index < dateLogs.length - 1 && (
                        <div className="absolute left-[29px] top-[44px] h-[calc(100%-20px)] w-px bg-[var(--border-subtle)]" />
                      )}

                      <div
                        className="relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${actionColor} 15%, transparent)`,
                        }}
                      >
                        <ActionIcon className="h-4 w-4" style={{ color: actionColor }} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[var(--text-primary)]">
                          <span className="font-medium">{getActionLabel(log.action)}</span>
                          {log.targetType && (
                            <span className="text-[var(--text-tertiary)]">
                              {' -> '}
                              {log.targetType}
                              {log.targetId && (
                                <span className="ml-1 font-mono text-xs">
                                  {log.targetId.slice(0, 8)}...
                                </span>
                              )}
                            </span>
                          )}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-tertiary)]">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.actorName || log.actorEmail}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {log.actorRole}
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs font-medium text-[var(--text-tertiary)]">
                          {formatTimeAgo(log.createdAt)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)] opacity-60">
                          {new Date(log.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="card py-16 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-[var(--text-tertiary)]" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              No activity logs matched these filters
            </p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Try widening the date range or clearing one of the filters.
            </p>
          </div>
        )}
      </motion.div>

      <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--text-tertiary)]">
          Page {filters.page} of {totalPages} with {totalCount} matching action
          {totalCount === 1 ? '' : 's'}.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => pushFilters({ page: filters.page - 1 })}
            disabled={filters.page <= 1}
            className="btn btn-ghost btn-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <button
            onClick={() => pushFilters({ page: filters.page + 1 })}
            disabled={filters.page >= totalPages}
            className="btn btn-ghost btn-sm"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div
            className="absolute inset-0"
            onClick={() => setSelectedLog(null)}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  Audit Entry
                </p>
                <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
                  {getActionLabel(selectedLog.action)}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {formatDateTime(selectedLog.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="btn btn-ghost btn-sm !p-2"
                aria-label="Close audit entry"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Actor
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {selectedLog.actorName || 'Unknown'}
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {selectedLog.actorEmail || selectedLog.actorId}
                </p>
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                  Role: {selectedLog.actorRole}
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Target
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {selectedLog.targetType ?? 'No target'}
                </p>
                <p className="mt-1 break-all font-mono text-xs text-[var(--text-secondary)]">
                  {selectedLog.targetId ?? 'N/A'}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Details
              </p>
              {selectedLog.details ? (
                <pre className="mt-3 overflow-auto rounded-lg bg-[var(--surface-hover)] p-3 text-xs text-[var(--text-secondary)]">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              ) : (
                <p className="mt-3 text-sm text-[var(--text-tertiary)]">
                  This entry did not include additional metadata.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
