'use client'

import { motion } from 'motion/react'
import { usePathname, useRouter } from 'next/navigation'
import { startTransition, useMemo, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Gamepad2,
  Layers,
  Save,
  Search,
  Settings,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react'

import { GameIcon } from '@/components/ui/GameIcons'

interface GameConfig {
  id: string
  gameId: string
  name: string
  description: string | null
  isEnabled: boolean
  minPlayers: number
  maxPlayers: number
  defaultRounds: number
  roundTime: number
  settings: Record<string, unknown> | null
  updatedAt: string
}

interface TriviaQuestionItem {
  id: string
  question: string
  status: string
  category: string
  difficulty: string
  reportCount: number
  usageCount: number
  correctCount: number
  lastUsedAt: string | null
  source: string
  tags: string[]
  explanation: string | null
  answers: unknown
  correctId: string
  createdAt: string
  updatedAt: string
  recentActions: Array<{
    id: string
    action: string
    actorName: string
    actorEmail: string
    actorRole: string
    details: Record<string, unknown> | null
    createdAt: string
  }>
}

interface TriviaQuestionFilters {
  page: number
  status: string
  category: string
  difficulty: string
  search: string
}

interface SummaryStats {
  totalGames: number
  enabledGames: number
  totalQuestions: number
  reportedQuestions: number
  restrictedQuestions: number
}

interface AdminGamesClientProps {
  gameConfigs: GameConfig[]
  triviaQuestions: TriviaQuestionItem[]
  filters: TriviaQuestionFilters
  totalTriviaCount: number
  totalTriviaPages: number
  triviaPageSize: number
  availableStatuses: string[]
  availableCategories: string[]
  availableDifficulties: string[]
  summary: SummaryStats
}

type EditableGameField = 'minPlayers' | 'maxPlayers' | 'defaultRounds' | 'roundTime'

const GAME_COLORS: Record<string, string> = {
  skribble: 'var(--game-skribble)',
  trivia: 'var(--game-trivia)',
  wordel: 'var(--game-wordel)',
  flagel: 'var(--game-flagel)',
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  approved: { label: 'Approved', badge: 'badge-success' },
  reviewed: { label: 'Reviewed', badge: 'badge-primary' },
  escalated: { label: 'Escalated', badge: 'badge-warning' },
  hidden: { label: 'Hidden', badge: 'badge-error' },
  rejected: { label: 'Rejected', badge: 'badge-error' },
}

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

function getHistoryActionLabel(action: string) {
  const labels: Record<string, string> = {
    'trivia.question.update_status': 'Updated lifecycle status',
    'moderation.trivia.approve': 'Approved',
    'moderation.trivia.reject': 'Rejected',
    'moderation.trivia.hide': 'Hidden',
    'moderation.trivia.escalate': 'Escalated',
    'moderation.trivia.mark_reviewed': 'Marked reviewed',
  }

  return labels[action] ?? action
}

export function AdminGamesClient({
  gameConfigs: initialGameConfigs,
  triviaQuestions,
  filters,
  totalTriviaCount,
  totalTriviaPages,
  triviaPageSize,
  availableStatuses,
  availableCategories,
  availableDifficulties,
  summary,
}: AdminGamesClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [gameConfigs, setGameConfigs] = useState(initialGameConfigs)
  const [draftFilters, setDraftFilters] = useState(filters)
  const [selectedQuestion, setSelectedQuestion] = useState<TriviaQuestionItem | null>(null)
  const [editingGame, setEditingGame] = useState<string | null>(null)
  const [savingGame, setSavingGame] = useState<string | null>(null)
  const [updatingQuestionId, setUpdatingQuestionId] = useState<string | null>(null)
  const [questionStatusDraft, setQuestionStatusDraft] = useState('')
  const [questionStatusNote, setQuestionStatusNote] = useState('')
  const [gameEdits, setGameEdits] = useState<Record<string, Partial<GameConfig>>>({})
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  const restrictedCountLabel = useMemo(() => {
    if (summary.restrictedQuestions === 0) {
      return 'No restricted items'
    }

    return `${summary.restrictedQuestions} restricted`
  }, [summary.restrictedQuestions])

  function pushFilters(next: Partial<TriviaQuestionFilters>) {
    const params = new URLSearchParams()
    const merged = { ...filters, ...next }

    if (merged.page > 1) {
      params.set('page', String(merged.page))
    }

    if (merged.status) {
      params.set('status', merged.status)
    }

    if (merged.category) {
      params.set('category', merged.category)
    }

    if (merged.difficulty) {
      params.set('difficulty', merged.difficulty)
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
      category: '',
      difficulty: '',
      search: '',
    }

    setDraftFilters(cleared)
    pushFilters(cleared)
  }

  function updateGameEdit(gameId: string, field: EditableGameField, value: number) {
    setGameEdits((current) => ({
      ...current,
      [gameId]: { ...current[gameId], [field]: value },
    }))
  }

  async function toggleGame(gameId: string, isEnabled: boolean) {
    setSavingGame(gameId)
    setFeedback(null)

    try {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | (Partial<GameConfig> & { error?: string })
        | null

      if (!response.ok) {
        setFeedback({
          type: 'error',
          message: payload?.error ?? 'Unable to update game availability.',
        })
        return
      }

      setGameConfigs((current) =>
        current.map((game) => (game.gameId === gameId ? { ...game, ...(payload ?? {}) } : game)),
      )
      setFeedback({
        type: 'success',
        message: `${gameId} ${isEnabled ? 'enabled' : 'disabled'} successfully.`,
      })
    } catch {
      setFeedback({
        type: 'error',
        message: 'Unable to update game availability.',
      })
    } finally {
      setSavingGame(null)
    }
  }

  async function saveGameConfig(gameId: string) {
    const edits = gameEdits[gameId]
    if (!edits) {
      return
    }

    setSavingGame(gameId)
    setFeedback(null)

    try {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edits),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | (Partial<GameConfig> & { error?: string })
        | null

      if (!response.ok) {
        setFeedback({
          type: 'error',
          message: payload?.error ?? 'Unable to save game configuration.',
        })
        return
      }

      setGameConfigs((current) =>
        current.map((game) => (game.gameId === gameId ? { ...game, ...(payload ?? {}) } : game)),
      )
      setGameEdits((current) => {
        const next = { ...current }
        delete next[gameId]
        return next
      })
      setEditingGame(null)
      setFeedback({
        type: 'success',
        message: `${gameId} settings saved.`,
      })
    } catch {
      setFeedback({
        type: 'error',
        message: 'Unable to save game configuration.',
      })
    } finally {
      setSavingGame(null)
    }
  }

  function openQuestion(question: TriviaQuestionItem) {
    setSelectedQuestion(question)
    setQuestionStatusDraft(question.status)
    setQuestionStatusNote('')
    setFeedback(null)
  }

  async function updateQuestionStatus() {
    if (!selectedQuestion || !questionStatusDraft || questionStatusDraft === selectedQuestion.status) {
      return
    }

    setUpdatingQuestionId(selectedQuestion.id)
    setFeedback(null)

    try {
      const response = await fetch(`/api/admin/trivia-questions/${selectedQuestion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: questionStatusDraft,
          note: questionStatusNote,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string
            question?: {
              status: string
              updatedAt: string
            }
          }
        | null

      if (!response.ok) {
        setFeedback({
          type: 'error',
          message: payload?.error ?? 'Unable to update trivia question status.',
        })
        return
      }

      setSelectedQuestion((current) =>
        current
          ? {
              ...current,
              status: payload?.question?.status ?? questionStatusDraft,
              updatedAt: payload?.question?.updatedAt ?? current.updatedAt,
            }
          : null,
      )

      setFeedback({
        type: 'success',
        message: 'Trivia question lifecycle updated successfully.',
      })

      startTransition(() => {
        router.refresh()
      })
    } catch {
      setFeedback({
        type: 'error',
        message: 'Unable to update trivia question status.',
      })
    } finally {
      setUpdatingQuestionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">Games</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage runtime game configuration and browse trivia content with lifecycle controls.
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'error'
              ? 'border-[var(--error-500)]/25 bg-[var(--error-500)]/8 text-[var(--error-500)]'
              : 'border-[var(--success-500)]/25 bg-[var(--success-500)]/8 text-[var(--success-500)]'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Games', value: summary.totalGames, icon: Gamepad2, color: 'var(--primary-500)' },
          { label: 'Enabled', value: summary.enabledGames, icon: CheckCircle2, color: 'var(--success-500)' },
          { label: 'Questions', value: summary.totalQuestions, icon: BookOpen, color: 'var(--game-trivia)' },
          { label: 'Reported', value: summary.reportedQuestions, icon: ShieldAlert, color: 'var(--warning-500)' },
          { label: 'Restricted', value: restrictedCountLabel, icon: Eye, color: 'var(--error-500)' },
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

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Game Configuration</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Runtime defaults for each game now live here instead of being buried in Settings.
          </p>
        </div>

        <div className="space-y-4">
          {gameConfigs.map((game) => {
            const color = GAME_COLORS[game.gameId] || 'var(--primary-500)'
            const isEditing = editingGame === game.gameId
            const isSaving = savingGame === game.gameId
            const edits = gameEdits[game.gameId] || {}
            const currentValues = {
              minPlayers: edits.minPlayers ?? game.minPlayers,
              maxPlayers: edits.maxPlayers ?? game.maxPlayers,
              defaultRounds: edits.defaultRounds ?? game.defaultRounds,
              roundTime: edits.roundTime ?? game.roundTime,
            }

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card relative overflow-hidden"
              >
                <div
                  className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
                  style={{ backgroundColor: color }}
                />

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                      }}
                    >
                      <GameIcon gameId={game.gameId} size={28} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{game.name}</h3>
                        <span className={`badge ${game.isEnabled ? 'badge-success' : 'badge-error'}`}>
                          {game.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {game.description || `Game ID: ${game.gameId}`}
                      </p>
                      <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                        Updated {formatRelative(game.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => void toggleGame(game.gameId, !game.isEnabled)}
                      disabled={isSaving}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        game.isEnabled ? 'bg-[var(--success-500)]' : 'bg-[var(--border-strong)]'
                      } ${isSaving ? 'opacity-50' : ''}`}
                      title={game.isEnabled ? 'Disable game' : 'Enable game'}
                    >
                      <motion.span
                        animate={{ x: game.isEnabled ? 22 : 3 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="inline-block h-5 w-5 rounded-full bg-white shadow-md"
                      />
                    </button>

                    {isEditing ? (
                      <>
                        <button
                          onClick={() => {
                            setEditingGame(null)
                            setGameEdits((current) => {
                              const next = { ...current }
                              delete next[game.gameId]
                              return next
                            })
                          }}
                          className="btn btn-ghost btn-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => void saveGameConfig(game.gameId)}
                          disabled={isSaving || Object.keys(edits).length === 0}
                          className="btn btn-primary btn-sm"
                        >
                          <Save className="h-3.5 w-3.5" />
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditingGame(game.gameId)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Configure
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-5 sm:grid-cols-4">
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)]">
                        <Users className="h-3.5 w-3.5" />
                        Min Players
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={currentValues.minPlayers}
                        onChange={(event) =>
                          updateGameEdit(game.gameId, 'minPlayers', Number(event.target.value))
                        }
                        className="input text-center"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)]">
                        <Users className="h-3.5 w-3.5" />
                        Max Players
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={currentValues.maxPlayers}
                        onChange={(event) =>
                          updateGameEdit(game.gameId, 'maxPlayers', Number(event.target.value))
                        }
                        className="input text-center"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)]">
                        <Layers className="h-3.5 w-3.5" />
                        Rounds
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={currentValues.defaultRounds}
                        onChange={(event) =>
                          updateGameEdit(game.gameId, 'defaultRounds', Number(event.target.value))
                        }
                        className="input text-center"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)]">
                        <Clock className="h-3.5 w-3.5" />
                        Round Time
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={300}
                        value={currentValues.roundTime}
                        onChange={(event) =>
                          updateGameEdit(game.gameId, 'roundTime', Number(event.target.value))
                        }
                        className="input text-center"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="badge badge-primary">
                      <Users className="mr-1 h-3 w-3" />
                      {game.minPlayers}-{game.maxPlayers} players
                    </span>
                    <span className="badge badge-primary">
                      <Layers className="mr-1 h-3 w-3" />
                      {game.defaultRounds} rounds
                    </span>
                    <span className="badge badge-primary">
                      <Clock className="mr-1 h-3 w-3" />
                      {game.roundTime}s
                    </span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Trivia Question Browser</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Search trivia content, inspect answers and usage metadata, and adjust lifecycle state safely.
          </p>
        </div>

        <div className="card">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={draftFilters.search}
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Search question text, source, or tag"
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
                <option value="">All statuses</option>
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
                value={draftFilters.category}
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, category: event.target.value }))
                }
                className="input appearance-none pr-8"
              >
                <option value="">All categories</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            </div>

            <div className="relative">
              <select
                value={draftFilters.difficulty}
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, difficulty: event.target.value }))
                }
                className="input appearance-none pr-8"
              >
                <option value="">All difficulties</option>
                {availableDifficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            </div>

            <div className="flex items-center gap-2">
              <button onClick={applyFilters} className="btn btn-primary btn-sm w-full">
                Apply
              </button>
              <button onClick={resetFilters} className="btn btn-ghost btn-sm w-full">
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="card !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Question
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Status
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Reports
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Usage
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Updated
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Inspect
                  </th>
                </tr>
              </thead>
              <tbody>
                {triviaQuestions.length > 0 ? (
                  triviaQuestions.map((question) => (
                    <tr
                      key={question.id}
                      className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{question.question}</p>
                          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                            {question.category} · {question.difficulty} · {question.source}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge ${STATUS_CONFIG[question.status]?.badge ?? 'badge-primary'}`}>
                          {STATUS_CONFIG[question.status]?.label ?? question.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-[var(--text-primary)]">
                        {question.reportCount}
                      </td>
                      <td className="px-5 py-4 text-[var(--text-secondary)]">
                        {question.usageCount}
                      </td>
                      <td className="px-5 py-4 text-[var(--text-tertiary)]">
                        {formatRelative(question.updatedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => openQuestion(question)}
                          className="btn btn-ghost btn-sm"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <FileText className="mx-auto mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
                      <p className="text-sm font-medium text-[var(--text-secondary)]">
                        No trivia questions matched these filters
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        Try clearing one of the filters or broadening the search.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--border)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--text-tertiary)]">
              Page {filters.page} of {totalTriviaPages} with {totalTriviaCount} question
              {totalTriviaCount === 1 ? '' : 's'}.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-tertiary)]">{triviaPageSize} per page</span>
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
                disabled={filters.page >= totalTriviaPages}
                className="btn btn-ghost btn-sm"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="absolute inset-0" onClick={() => setSelectedQuestion(null)} aria-hidden="true" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  Trivia Content
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                  {selectedQuestion.question}
                </h2>
              </div>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="btn btn-ghost btn-sm !p-2"
                aria-label="Close trivia question details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge ${STATUS_CONFIG[selectedQuestion.status]?.badge ?? 'badge-primary'}`}>
                      {STATUS_CONFIG[selectedQuestion.status]?.label ?? selectedQuestion.status}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                      <ShieldAlert className="h-3 w-3" />
                      {selectedQuestion.reportCount} reports
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Category</p>
                      <p className="mt-1 font-medium text-[var(--text-primary)]">{selectedQuestion.category}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Difficulty</p>
                      <p className="mt-1 font-medium text-[var(--text-primary)]">{selectedQuestion.difficulty}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Source</p>
                      <p className="mt-1 font-medium text-[var(--text-primary)]">{selectedQuestion.source}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Last Used</p>
                      <p className="mt-1 font-medium text-[var(--text-primary)]">{formatRelative(selectedQuestion.lastUsedAt)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedQuestion.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[11px] text-[var(--text-tertiary)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Answers
                  </p>
                  <div className="mt-4 space-y-2">
                    {parseAnswers(selectedQuestion.answers).map((answer) => (
                      <div
                        key={answer.id}
                        className={`rounded-xl border px-4 py-3 text-sm ${
                          answer.id === selectedQuestion.correctId
                            ? 'border-[var(--success-500)]/30 bg-[var(--success-500)]/10'
                            : 'border-[var(--border)] bg-[var(--surface)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-medium text-[var(--text-primary)]">{answer.text}</span>
                          {answer.id === selectedQuestion.correctId && (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[var(--success-500)]" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedQuestion.explanation && (
                    <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Explanation
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {selectedQuestion.explanation}
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[var(--primary-500)]" />
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Recent Review Activity</p>
                  </div>

                  {selectedQuestion.recentActions.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {selectedQuestion.recentActions.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-[var(--text-primary)]">
                                {getHistoryActionLabel(entry.action)}
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
                      No admin history recorded for this question yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Lifecycle Controls</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                    Change the availability state for this question without opening the moderation queue.
                  </p>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Status
                    </span>
                    <div className="relative">
                      <select
                        value={questionStatusDraft}
                        onChange={(event) => setQuestionStatusDraft(event.target.value)}
                        className="input appearance-none pr-8"
                      >
                        {availableStatuses.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_CONFIG[status]?.label ?? status}
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
                      value={questionStatusNote}
                      onChange={(event) => setQuestionStatusNote(event.target.value)}
                      rows={4}
                      placeholder="Optional note for the audit log..."
                      className="input min-h-[112px] resize-none"
                    />
                  </label>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => void updateQuestionStatus()}
                      disabled={
                        updatingQuestionId === selectedQuestion.id ||
                        questionStatusDraft === selectedQuestion.status
                      }
                      className="btn btn-primary btn-sm"
                    >
                      {updatingQuestionId === selectedQuestion.id ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Question Metadata</p>
                  <dl className="mt-4 space-y-3 text-sm">
                    {[
                      { label: 'Created', value: formatDateTime(selectedQuestion.createdAt) },
                      { label: 'Updated', value: formatDateTime(selectedQuestion.updatedAt) },
                      { label: 'Usage Count', value: String(selectedQuestion.usageCount) },
                      { label: 'Correct Count', value: String(selectedQuestion.correctCount) },
                      { label: 'Reports', value: String(selectedQuestion.reportCount) },
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
