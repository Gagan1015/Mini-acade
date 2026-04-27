'use client'

import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { DonutChart, SparkLine, VerticalBarChart } from '@/components/ui/Charts'
import type { TriviaRoundHistoryEntry } from '@/hooks/useRoom'
import type { TriviaGameEnded } from '@arcado/shared'

type FilterType = 'all' | 'correct' | 'wrong' | 'unanswered'

type TriviaDetailedResultsProps = {
  isOpen: boolean
  onClose: () => void
  roundHistory: TriviaRoundHistoryEntry[]
  finalScores: TriviaGameEnded['finalScores']
  currentUserId: string
  totalRounds: number
}

function IconArrowLeft({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function IconCheck({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconX({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconMinus({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function TriviaDetailedResults({
  isOpen,
  onClose,
  roundHistory,
  finalScores,
  currentUserId,
  totalRounds,
}: TriviaDetailedResultsProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  const correct = roundHistory.filter((r) => r.isCorrect).length
  const wrong = roundHistory.filter((r) => !r.isCorrect && r.selectedAnswerId !== null).length
  const unanswered = roundHistory.filter((r) => r.selectedAnswerId === null).length
  const totalPoints = roundHistory.reduce((sum, r) => sum + r.pointsEarned, 0)
  const maxPoints = totalRounds * 1000
  const accuracy = roundHistory.length > 0 ? Math.round((correct / roundHistory.length) * 100) : 0

  const currentPlayer = finalScores.find((s) => s.playerId === currentUserId)
  const rank = currentPlayer?.rank ?? 1

  const filteredHistory = useMemo(() => {
    switch (filter) {
      case 'correct':
        return roundHistory.filter((r) => r.isCorrect)
      case 'wrong':
        return roundHistory.filter((r) => !r.isCorrect && r.selectedAnswerId !== null)
      case 'unanswered':
        return roundHistory.filter((r) => r.selectedAnswerId === null)
      default:
        return roundHistory
    }
  }, [filter, roundHistory])

  const cumulativeScores = roundHistory.reduce<number[]>((acc, r) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : 0
    acc.push(prev + r.pointsEarned)
    return acc
  }, [])

  const perRoundBars = roundHistory.map((r, i) => ({
    label: `Q${i + 1}`,
    value: r.pointsEarned,
    color: r.isCorrect ? 'var(--success-500)' : r.selectedAnswerId ? 'var(--error-500)' : 'var(--text-tertiary)',
  }))

  const donutSegments = [
    { value: correct, color: 'var(--success-500)', label: 'Correct' },
    { value: wrong, color: 'var(--error-500)', label: 'Wrong' },
    { value: unanswered, color: 'var(--text-tertiary)', label: 'Unanswered' },
  ]

  const filterButtons: { key: FilterType; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'All', count: roundHistory.length, color: 'var(--game-trivia)' },
    { key: 'correct', label: 'Correct', count: correct, color: 'var(--success-500)' },
    { key: 'wrong', label: 'Wrong', count: wrong, color: 'var(--error-500)' },
    { key: 'unanswered', label: 'Skipped', count: unanswered, color: 'var(--text-tertiary)' },
  ]

  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] overflow-y-auto bg-[var(--background)]"
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-[61] border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <IconArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-[var(--text-primary)]">Trivia Results</h1>
            <p className="text-xs text-[var(--text-tertiary)]">
              {roundHistory.length} questions {'\u00B7'} {totalPoints.toLocaleString()} pts
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-bold text-[var(--text-primary)]">{accuracy}%</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Accuracy</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-8">

        {/* Performance Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Rank', value: `#${rank}`, sub: `of ${finalScores.length}`, accent: 'var(--warning-500)' },
            { label: 'Score', value: totalPoints.toLocaleString(), sub: `/ ${maxPoints.toLocaleString()}`, accent: 'var(--game-trivia)' },
            { label: 'Correct', value: String(correct), sub: `of ${roundHistory.length}`, accent: 'var(--success-500)' },
            { label: 'Accuracy', value: `${accuracy}%`, sub: correct > wrong ? 'Great!' : 'Keep trying', accent: accuracy >= 70 ? 'var(--success-500)' : 'var(--error-500)' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-[var(--border)]/40 bg-[var(--surface)]/30 p-5 text-center"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{card.label}</p>
              <p className="mt-2 font-display text-2xl font-bold" style={{ color: card.accent }}>
                {card.value}
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Donut Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-[var(--border)]/40 bg-[var(--surface)]/30 p-6"
          >
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Answer Breakdown
            </p>
            <div className="flex items-center justify-center gap-6">
              <DonutChart
                segments={donutSegments}
                size={140}
                strokeWidth={18}
                centerValue={`${correct}`}
                centerLabel="Correct"
              />
              <div className="space-y-3">
                {donutSegments.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full" style={{ background: seg.color }} />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{seg.value}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">{seg.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Score Progression */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-[var(--border)]/40 bg-[var(--surface)]/30 p-6"
          >
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Score Progression
            </p>
            {cumulativeScores.length > 1 ? (
              <SparkLine
                data={[0, ...cumulativeScores]}
                width={400}
                height={90}
                color="var(--game-trivia)"
                style={{ width: '100%' }}
              />
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">Not enough data to display chart.</p>
            )}
          </motion.div>
        </div>

        {/* Per-Question Bar Chart */}
        {perRoundBars.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border border-[var(--border)]/40 bg-[var(--surface)]/30 p-6"
          >
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Points Per Question
            </p>
            <VerticalBarChart data={perRoundBars} height={120} />
          </motion.div>
        )}

        {/* Filter Bar */}
        <div>
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            Question Details
          </p>
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((fb) => (
              <button
                key={fb.key}
                onClick={() => setFilter(fb.key)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  filter === fb.key
                    ? 'border-transparent text-white shadow-md'
                    : 'border-[var(--border)] bg-[var(--surface)]/30 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
                style={filter === fb.key ? { background: fb.color } : undefined}
              >
                {fb.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  filter === fb.key ? 'bg-white/20' : 'bg-[var(--border)]/50'
                }`}>
                  {fb.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Question Cards */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredHistory.map((entry, i) => (
              <QuestionCard key={entry.roundNumber} entry={entry} index={i} />
            ))}
          </AnimatePresence>
          {filteredHistory.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
              <p className="text-sm text-[var(--text-tertiary)]">No questions match this filter.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>,
    document.body
  )
}

function QuestionCard({ entry, index }: { entry: TriviaRoundHistoryEntry; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const wasUnanswered = entry.selectedAnswerId === null

  const statusConfig = entry.isCorrect
    ? { icon: <IconCheck />, label: 'Correct', bg: 'bg-[var(--success-500)]/10', border: 'border-[var(--success-500)]/25', text: 'text-[var(--success-500)]', dot: 'bg-[var(--success-500)]' }
    : wasUnanswered
      ? { icon: <IconMinus />, label: 'Skipped', bg: 'bg-[var(--text-tertiary)]/10', border: 'border-[var(--text-tertiary)]/25', text: 'text-[var(--text-tertiary)]', dot: 'bg-[var(--text-tertiary)]' }
      : { icon: <IconX />, label: 'Wrong', bg: 'bg-[var(--error-500)]/10', border: 'border-[var(--error-500)]/25', text: 'text-[var(--error-500)]', dot: 'bg-[var(--error-500)]' }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-2xl border ${statusConfig.border} ${statusConfig.bg} overflow-hidden`}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left cursor-pointer"
      >
        {/* Status indicator */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
          {statusConfig.icon}
        </div>

        {/* Question preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
              Q{entry.roundNumber}
            </span>
            {entry.category && (
              <span className="rounded-full bg-[var(--surface)]/50 px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                {entry.category}
              </span>
            )}
            {entry.difficulty && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                entry.difficulty === 'hard'
                  ? 'bg-[var(--error-500)]/10 text-[var(--error-500)]'
                  : entry.difficulty === 'easy'
                    ? 'bg-[var(--success-500)]/10 text-[var(--success-500)]'
                    : 'bg-[var(--warning-500)]/10 text-[var(--warning-500)]'
              }`}>
                {entry.difficulty}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{entry.question.question}</p>
        </div>

        {/* Points */}
        <div className="text-right shrink-0">
          <p className={`font-mono text-sm font-bold ${statusConfig.text}`}>
            {entry.isCorrect ? `+${entry.pointsEarned}` : '0'}
          </p>
          <p className="text-[10px] text-[var(--text-tertiary)]">pts</p>
        </div>

        {/* Expand chevron */}
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border)]/30 px-5 py-4 space-y-3">
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{entry.question.question}</p>

              {/* Answer Options */}
              <div className="grid gap-2 md:grid-cols-2">
                {entry.question.answers.map((answer) => {
                  const isCorrectAnswer = answer.id === entry.correctAnswerId
                  const isUserAnswer = answer.id === entry.selectedAnswerId
                  return (
                    <div
                      key={answer.id}
                      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${
                        isCorrectAnswer
                          ? 'border-[var(--success-500)]/40 bg-[var(--success-500)]/10 text-[var(--text-primary)]'
                          : isUserAnswer
                            ? 'border-[var(--error-500)]/40 bg-[var(--error-500)]/10 text-[var(--text-primary)]'
                            : 'border-[var(--border)]/30 bg-[var(--surface)]/20 text-[var(--text-secondary)]'
                      }`}
                    >
                      {isCorrectAnswer && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--success-500)] text-white">
                          <IconCheck size={10} />
                        </span>
                      )}
                      {isUserAnswer && !isCorrectAnswer && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--error-500)] text-white">
                          <IconX size={10} />
                        </span>
                      )}
                      {!isCorrectAnswer && !isUserAnswer && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border)]/40 text-[var(--text-tertiary)] text-[10px] font-bold">
                          {answer.id.toUpperCase()}
                        </span>
                      )}
                      <span className="flex-1">{answer.text}</span>
                    </div>
                  )
                })}
              </div>

              {/* Explanation */}
              {entry.explanation && (
                <div className="rounded-xl border border-[var(--border)]/30 bg-[var(--surface)]/20 px-4 py-3">
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{entry.explanation}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
