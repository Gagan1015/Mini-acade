'use client'

import { motion } from 'motion/react'
import { usePathname, useRouter } from 'next/navigation'
import { startTransition, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSearch,
  Filter,
  Flag,
  MessageSquareWarning,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react'

import { useToast } from '@/components/ui/Toast'

type ModerationItem = {
  id: string
  contentType: string
  title: string
  status: string
  reportCount: number
  usageCount: number
  correctCount: number
  category: string
  difficulty: string
  source: string
  explanation: string | null
  tags: string[]
  answers: unknown
  correctId: string
  createdAt: string
  updatedAt: string
  lastUsedAt: string | null
  history: Array<{
    id: string
    action: string
    actorName: string
    actorEmail: string
    actorRole: string
    details: Record<string, unknown> | null
    createdAt: string
  }>
}

type ModerationFilters = {
  page: number
  status: string
  contentType: string
  reportMin: number
  search: string
}

type ModerationAction = 'approve' | 'reject' | 'hide' | 'escalate' | 'mark_reviewed'

interface AdminModerationClientProps {
  items: ModerationItem[]
  filters: ModerationFilters
  totalCount: number
  totalPages: number
  pageSize: number
  availableStatuses: string[]
  availableContentTypes: string[]
  statusCounts: Array<{
    status: string
    count: number
  }>
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; tone: string }> = {
  approved: {
    label: 'Approved',
    badge: 'badge-success',
    tone: 'text-[var(--success-500)]',
  },
  reviewed: {
    label: 'Reviewed',
    badge: 'badge-primary',
    tone: 'text-[var(--primary-500)]',
  },
  escalated: {
    label: 'Escalated',
    badge: 'badge-warning',
    tone: 'text-[var(--warning-500)]',
  },
  hidden: {
    label: 'Hidden',
    badge: 'badge-error',
    tone: 'text-[var(--error-500)]',
  },
  rejected: {
    label: 'Rejected',
    badge: 'badge-error',
    tone: 'text-[var(--error-500)]',
  },
}

const ACTION_CONFIG: Record<
  ModerationAction,
  {
    label: string
    color: string
  }
> = {
  approve: { label: 'Approve', color: 'bg-[var(--success-500)]' },
  reject: { label: 'Reject', color: 'bg-[var(--error-500)]' },
  hide: { label: 'Hide', color: 'bg-[var(--error-500)]' },
  escalate: { label: 'Escalate', color: 'bg-[var(--warning-500)]' },
  mark_reviewed: { label: 'Mark Reviewed', color: 'bg-[var(--primary-500)]' },
}

const REASON_CODES = [
  { value: 'report_threshold', label: 'Report Threshold' },
  { value: 'incorrect_answer', label: 'Incorrect Answer' },
  { value: 'low_quality', label: 'Low Quality' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'off_topic', label: 'Off Topic' },
  { value: 'offensive', label: 'Offensive' },
  { value: 'manual_review', label: 'Manual Review' },
  { value: 'approved_after_review', label: 'Approved After Review' },
  { value: 'other', label: 'Other' },
] as const

function formatDateTime(dateString: string | null) {
  if (!dateString) {
    return '-'
  }

  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatRelative(dateString: string | null) {
  if (!dateString) {
    return 'Never'
  }

  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  return formatDateTime(dateString)
}

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    'moderation.trivia.approve': 'Approved',
    'moderation.trivia.reject': 'Rejected',
    'moderation.trivia.hide': 'Hidden',
    'moderation.trivia.escalate': 'Escalated',
    'moderation.trivia.mark_reviewed': 'Marked reviewed',
  }

  return labels[action] ?? action
}

function parseAnswers(
  answers: unknown,
): Array<{ id: string; text: string }> {
  if (!Array.isArray(answers)) {
    return []
  }

  return answers
    .map((answer) => {
      if (!answer || typeof answer !== 'object') {
        return null
      }

      const candidate = answer as { id?: unknown; text?: unknown }
      if (typeof candidate.id !== 'string' || typeof candidate.text !== 'string') {
        return null
      }

      return {
        id: candidate.id,
        text: candidate.text,
      }
    })
    .filter((answer): answer is { id: string; text: string } => Boolean(answer))
}

export function AdminModerationClient({
  items,
  filters,
  totalCount,
  totalPages,
  pageSize,
  availableStatuses,
  availableContentTypes,
  statusCounts,
}: AdminModerationClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const toast = useToast()
  const [draftFilters, setDraftFilters] = useState(filters)
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [pendingAction, setPendingAction] = useState<ModerationAction | null>(null)
  const [reasonCode, setReasonCode] = useState('report_threshold')
  const [note, setNote] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const escalatedCount = useMemo(
    () => statusCounts.find((entry) => entry.status === 'escalated')?.count ?? 0,
    [statusCounts],
  )

  function pushFilters(next: Partial<ModerationFilters>) {
    const params = new URLSearchParams()
    const merged = { ...filters, ...next }

    if (merged.page > 1) {
      params.set('page', String(merged.page))
    }

    if (merged.status) {
      params.set('status', merged.status)
    }

    if (merged.contentType) {
      params.set('contentType', merged.contentType)
    }

    if (merged.reportMin !== 1) {
      params.set('reportMin', String(merged.reportMin))
    }

    if (merged.search) {
      params.set('search', merged.search)
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
      status: '',
      contentType: 'TRIVIA_QUESTION',
      reportMin: 1,
      search: '',
    }

    setDraftFilters(cleared)
    pushFilters(cleared)
  }

  function openItem(item: ModerationItem) {
    setSelectedItem(item)
    setPendingAction(null)
    setReasonCode('report_threshold')
    setNote('')
    setActionError(null)
  }

  async function submitAction() {
    if (!selectedItem || !pendingAction) {
      return
    }

    setIsSubmitting(true)
    setActionError(null)

    try {
      const response = await fetch(`/api/admin/moderation/${selectedItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: pendingAction,
          reasonCode,
          note,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string
            item?: {
              status: string
            }
          }
        | null

      if (!response.ok) {
        setActionError(payload?.error ?? 'Unable to apply moderation action right now.')
        return
      }

      toast.success(`${ACTION_CONFIG[pendingAction].label} action saved to the moderation log.`)
      setPendingAction(null)
      startTransition(() => {
        router.refresh()
      })
    } catch {
      setActionError('Unable to apply moderation action right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          Moderation Queue
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Review flagged trivia content with audit-backed actions and history.
        </p>
      </div>



      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Queue Items', value: totalCount, icon: FileSearch, color: 'var(--primary-500)' },
          { label: 'Escalated', value: escalatedCount, icon: ShieldAlert, color: 'var(--warning-500)' },
          { label: 'This Page', value: items.length, icon: Eye, color: 'var(--success-500)' },
          { label: 'Page Size', value: pageSize, icon: Filter, color: 'var(--text-secondary)' },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center gap-2">
              <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
              <p className="text-xs font-medium text-[var(--text-tertiary)]">{stat.label}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={draftFilters.search}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Search question, category, or difficulty"
              className="input pl-10"
            />
          </div>

          <div className="relative">
            <select
              value={draftFilters.status}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, status: event.target.value }))
              }
              className="input appearance-none pr-8"
            >
              <option value="">All Statuses</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {STATUS_CONFIG[status]?.label ?? status}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          </div>

          <div className="relative">
            <select
              value={draftFilters.contentType}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, contentType: event.target.value }))
              }
              className="input appearance-none pr-8"
            >
              {availableContentTypes.map((contentType) => (
                <option key={contentType} value={contentType}>
                  {contentType === 'TRIVIA_QUESTION' ? 'Trivia Questions' : contentType}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          </div>

          <div className="relative">
            <select
              value={String(draftFilters.reportMin)}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  reportMin: Number(event.target.value),
                }))
              }
              className="input appearance-none pr-8"
            >
              <option value="0">Any report count</option>
              <option value="1">1+ reports</option>
              <option value="2">2+ reports</option>
              <option value="3">3+ reports</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          </div>
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

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => {
            const statusInfo = STATUS_CONFIG[item.status] ?? {
              label: item.status,
              badge: 'badge-primary',
              tone: 'text-[var(--primary-500)]',
            }

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openItem(item)}
                className="card w-full text-left transition-colors hover:bg-[var(--surface-hover)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${statusInfo.badge}`}>{statusInfo.label}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                        <Flag className="h-3 w-3" />
                        {item.reportCount} reports
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                        {item.category}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                        {item.difficulty}
                      </span>
                    </div>

                    <h2 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
                      {item.title}
                    </h2>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[11px] text-[var(--text-tertiary)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid min-w-[240px] grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                        Usage
                      </p>
                      <p className="mt-1 font-semibold text-[var(--text-primary)]">
                        {item.usageCount} uses
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                        Accuracy
                      </p>
                      <p className="mt-1 font-semibold text-[var(--text-primary)]">
                        {item.correctCount} correct
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                        Last Used
                      </p>
                      <p className="mt-1 font-semibold text-[var(--text-primary)]">
                        {formatRelative(item.lastUsedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                        Review Events
                      </p>
                      <p className="mt-1 font-semibold text-[var(--text-primary)]">
                        {item.history.length}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.button>
            )
          })
        ) : (
          <div className="card py-16 text-center">
            <MessageSquareWarning className="mx-auto mb-3 h-12 w-12 text-[var(--text-tertiary)]" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              No moderation items matched these filters
            </p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Try lowering the report threshold or clearing one of the filters.
            </p>
          </div>
        )}
      </div>

      <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--text-tertiary)]">
          Page {filters.page} of {totalPages} with {totalCount} moderation item
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

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="absolute inset-0" onClick={() => setSelectedItem(null)} aria-hidden="true" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  Trivia Moderation
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                  {selectedItem.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="btn btn-ghost btn-sm !p-2"
                aria-label="Close moderation item"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge ${STATUS_CONFIG[selectedItem.status]?.badge ?? 'badge-primary'}`}>
                      {STATUS_CONFIG[selectedItem.status]?.label ?? selectedItem.status}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                      <Flag className="h-3 w-3" />
                      {selectedItem.reportCount} reports
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Category</p>
                      <p className="mt-1 font-medium text-[var(--text-primary)]">{selectedItem.category}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Difficulty</p>
                      <p className="mt-1 font-medium text-[var(--text-primary)]">{selectedItem.difficulty}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Source</p>
                      <p className="mt-1 font-medium text-[var(--text-primary)]">{selectedItem.source}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Last Used</p>
                      <p className="mt-1 font-medium text-[var(--text-primary)]">{formatRelative(selectedItem.lastUsedAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Answers
                  </p>
                  <div className="mt-4 space-y-2">
                    {parseAnswers(selectedItem.answers).map((answer) => (
                      <div
                        key={answer.id}
                        className={`rounded-xl border px-4 py-3 text-sm ${
                          answer.id === selectedItem.correctId
                            ? 'border-[var(--success-500)]/30 bg-[var(--success-500)]/10'
                            : 'border-[var(--border)] bg-[var(--surface)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-medium text-[var(--text-primary)]">{answer.text}</span>
                          {answer.id === selectedItem.correctId && (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[var(--success-500)]" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedItem.explanation && (
                    <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Explanation
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {selectedItem.explanation}
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <div className="flex items-center gap-2">
                    <FileSearch className="h-4 w-4 text-[var(--primary-500)]" />
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Review History</p>
                  </div>

                  {selectedItem.history.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {selectedItem.history.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-[var(--text-primary)]">
                                {getActionLabel(entry.action)}
                              </p>
                              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                                by {entry.actorName}
                                {entry.actorEmail ? ` (${entry.actorEmail})` : ''}
                              </p>
                            </div>
                            <span className="text-xs text-[var(--text-tertiary)]">
                              {formatRelative(entry.createdAt)}
                            </span>
                          </div>
                          {entry.details && (
                            <pre className="mt-3 overflow-auto rounded-lg bg-[var(--background)] p-3 text-[11px] text-[var(--text-secondary)]">
                              {JSON.stringify(entry.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-[var(--text-tertiary)]">
                      No review actions recorded for this item yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Moderation Actions</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                    Each action requires a reason code and will be written to the admin log.
                  </p>

                  <div className="mt-4 space-y-2">
                    {(Object.keys(ACTION_CONFIG) as ModerationAction[]).map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => {
                          setPendingAction(action)
                          setActionError(null)
                        }}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                          pendingAction === action
                            ? 'border-[var(--primary-500)] bg-[var(--primary-500)]/10 text-[var(--primary-500)]'
                            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                        }`}
                      >
                        <span>{ACTION_CONFIG[action].label}</span>
                        <span className={`h-2.5 w-2.5 rounded-full ${ACTION_CONFIG[action].color}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {pendingAction && (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--warning-500)]" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          Confirm {ACTION_CONFIG[pendingAction].label.toLowerCase()}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                          This changes the moderation status for the selected trivia question.
                        </p>
                      </div>
                    </div>

                    <label className="mt-4 block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Reason Code
                      </span>
                      <div className="relative">
                        <select
                          value={reasonCode}
                          onChange={(event) => setReasonCode(event.target.value)}
                          className="input appearance-none pr-8"
                        >
                          {REASON_CODES.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                      </div>
                    </label>

                    <label className="mt-4 block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Note
                      </span>
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={4}
                        placeholder="Optional context for the review log..."
                        className="input min-h-[112px] resize-none"
                      />
                    </label>

                    {actionError && (
                      <p className="mt-4 rounded-xl border border-[var(--danger-500)]/30 bg-[var(--danger-500)]/10 px-3 py-2 text-sm font-medium text-[var(--danger-500)]">
                        {actionError}
                      </p>
                    )}

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => void submitAction()}
                        disabled={isSubmitting}
                        className="btn btn-primary btn-sm"
                      >
                        {isSubmitting ? 'Saving...' : ACTION_CONFIG[pendingAction].label}
                      </button>
                      <button
                        onClick={() => setPendingAction(null)}
                        className="btn btn-ghost btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Item Metadata</p>
                  <dl className="mt-4 space-y-3 text-sm">
                    {[
                      { label: 'Created', value: formatDateTime(selectedItem.createdAt) },
                      { label: 'Updated', value: formatDateTime(selectedItem.updatedAt) },
                      { label: 'Reports', value: String(selectedItem.reportCount) },
                      { label: 'Uses', value: String(selectedItem.usageCount) },
                      { label: 'Correct Answers', value: String(selectedItem.correctCount) },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-4">
                        <dt className="text-[var(--text-tertiary)]">{item.label}</dt>
                        <dd className="text-right font-medium text-[var(--text-primary)]">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
