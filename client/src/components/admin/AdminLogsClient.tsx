'use client'

import { motion } from 'motion/react'
import { useState } from 'react'
import {
  FileText,
  Search,
  Clock,
  Shield,
  User,
  Activity,
  ChevronDown,
  AlertTriangle,
  UserCog,
  Settings,
  Trash2,
  Eye,
} from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'

interface AdminLog {
  id: string
  action: string
  actorName: string
  actorEmail: string
  actorRole: string
  targetType: string | null
  targetId: string | null
  createdAt: string
}

interface AdminLogsClientProps {
  logs: AdminLog[]
}

const ACTION_ICONS: Record<string, typeof Activity> = {
  'user.update': UserCog,
  'user.ban': AlertTriangle,
  'user.delete': Trash2,
  'settings.update': Settings,
  'room.delete': Trash2,
  'game.config': Settings,
}

const ACTION_COLORS: Record<string, string> = {
  'user.update': 'var(--primary-500)',
  'user.ban': 'var(--error-500)',
  'user.delete': 'var(--error-500)',
  'settings.update': 'var(--warning-500)',
  'room.delete': 'var(--error-500)',
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

function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
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
    'game.config': 'Updated game config',
  }
  return labels[action] || action
}

export function AdminLogsClient({ logs }: AdminLogsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')

  const uniqueActions = [...new Set(logs.map((l) => l.action))]

  const filtered = logs.filter((log) => {
    const matchSearch =
      !searchQuery ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase())
    const matchAction = actionFilter === 'ALL' || log.action === actionFilter
    return matchSearch && matchAction
  })

  // Group logs by date
  const groupedByDate = filtered.reduce(
    (acc, log) => {
      const dateKey = new Date(log.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(log)
      return acc
    },
    {} as Record<string, AdminLog[]>,
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          Activity Logs
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Track all administrative actions and changes
        </p>
      </div>

      {/* ── Quick Stats ── */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {[
          { label: 'Total Actions', value: logs.length, color: 'var(--primary-500)' },
          {
            label: 'Today',
            value: logs.filter(
              (l) => new Date(l.createdAt).toDateString() === new Date().toDateString(),
            ).length,
            color: 'var(--success-500)',
          },
          {
            label: 'Unique Actors',
            value: new Set(logs.map((l) => l.actorEmail)).size,
            color: 'var(--warning-500)',
          },
        ].map((stat) => (
          <motion.div key={stat.label} variants={staggerItem} className="card">
            <p className="text-xs font-medium text-[var(--text-tertiary)]">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Filters ── */}
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search logs…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="input appearance-none pr-8 sm:w-48"
            >
              <option value="ALL">All Actions</option>
              {uniqueActions.map((a) => (
                <option key={a} value={a}>
                  {getActionLabel(a)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          </div>
        </div>
      </div>

      {/* ── Timeline Feed ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        {Object.keys(groupedByDate).length > 0 ? (
          Object.entries(groupedByDate).map(([date, dateLogs]) => (
            <div key={date}>
              {/* Date header */}
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-7 items-center rounded-full bg-[var(--surface)] px-3 text-xs font-medium text-[var(--text-tertiary)] border border-[var(--border)]">
                  {date}
                </div>
                <div className="flex-1 border-t border-[var(--border-subtle)]" />
              </div>

              {/* Log entries */}
              <div className="space-y-1">
                {dateLogs.map((log, i) => {
                  const ActionIcon = ACTION_ICONS[log.action] || Activity
                  const actionColor = ACTION_COLORS[log.action] || 'var(--primary-500)'

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * i }}
                      className="group relative flex items-start gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      {/* Timeline connector */}
                      {i < dateLogs.length - 1 && (
                        <div className="absolute left-[29px] top-[44px] h-[calc(100%-20px)] w-px bg-[var(--border-subtle)]" />
                      )}

                      {/* Icon */}
                      <div
                        className="relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${actionColor} 15%, transparent)`,
                        }}
                      >
                        <ActionIcon className="h-4 w-4" style={{ color: actionColor }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)]">
                          <span className="font-medium">{getActionLabel(log.action)}</span>
                          {log.targetType && (
                            <span className="text-[var(--text-tertiary)]">
                              {' '}
                              → {log.targetType}
                              {log.targetId && (
                                <span className="ml-1 font-mono text-xs">
                                  {log.targetId.slice(0, 8)}…
                                </span>
                              )}
                            </span>
                          )}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
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

                      {/* Timestamp */}
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
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="card py-16 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-[var(--text-tertiary)]" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">No activity logs yet</p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Admin actions will appear here when they occur
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
