'use client'

import { motion, AnimatePresence } from 'motion/react'

import type {
  Player,
  TriviaAnswerResultPayload,
  TriviaGameEnded,
  TriviaRoundEnded,
  TriviaRoundStarted,
} from '@mini-arcade/shared'

type TriviaPlayAreaProps = {
  currentUserId: string
  players: Player[]
  phase: 'waiting' | 'playing' | 'roundEnd' | 'gameEnd'
  currentRound: number
  totalRounds: number
  timeRemaining: number
  question: TriviaRoundStarted['question'] | null
  answeredPlayers: string[]
  selectedAnswerId: string | null
  answerFeedback: TriviaAnswerResultPayload | null
  roundResults: TriviaRoundEnded | null
  scores: Record<string, number>
  finalScores: TriviaGameEnded['finalScores']
  onSubmitAnswer: (questionId: string, answerId: string) => void
}

/* ── SVG Icons ── */

function IconTrophy({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconX({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function TriviaPlayArea({
  currentUserId,
  players,
  phase,
  currentRound,
  totalRounds,
  timeRemaining,
  question,
  answeredPlayers,
  selectedAnswerId,
  answerFeedback,
  roundResults,
  scores,
  finalScores,
  onSubmitAnswer,
}: TriviaPlayAreaProps) {
  const sortedPlayers = [...players].sort((left, right) => (scores[right.id] ?? 0) - (scores[left.id] ?? 0))
  const leaderboardEntries: TriviaGameEnded['finalScores'] =
    finalScores.length > 0
      ? finalScores
      : sortedPlayers.map((player, index) => ({
          playerId: player.id,
          playerName: player.name,
          score: scores[player.id] ?? 0,
          correctAnswers: 0,
          rank: index + 1,
        }))

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--game-trivia)]/80">Trivia Match</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">Answer fast, score bigger</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
            Everyone sees the same question at the same time. Correct answers score by speed.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-secondary)]">
            Round <span className="font-semibold text-[var(--text-primary)]">{currentRound}</span> / {totalRounds}
          </p>
          <p className={`mt-2 font-mono text-3xl font-bold ${timeRemaining <= 5 ? 'text-[var(--error-500)]' : 'text-[var(--text-primary)]'}`}>
            {timeRemaining}s
          </p>
        </div>
      </div>

      {/* Question */}
      {question ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-[var(--border)]/40 bg-[var(--surface)]/30 p-6"
        >
          <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            {question.category ? <span>{question.category}</span> : null}
            {question.difficulty ? <span>{question.difficulty}</span> : null}
          </div>
          <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">{question.question}</h3>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {question.answers.map((answer) => {
              const isSelected = selectedAnswerId === answer.id
              return (
                <motion.button
                  key={answer.id}
                  whileHover={!selectedAnswerId && phase === 'playing' ? { scale: 1.01 } : {}}
                  whileTap={!selectedAnswerId && phase === 'playing' ? { scale: 0.99 } : {}}
                  type="button"
                  onClick={() => onSubmitAnswer(question.id, answer.id)}
                  disabled={phase !== 'playing' || Boolean(selectedAnswerId)}
                  className={`rounded-xl border px-4 py-4 text-left text-sm transition-all duration-200 ${
                    isSelected
                      ? 'border-[var(--primary-500)]/40 bg-[var(--primary-500)]/10 text-[var(--primary-400)]'
                      : 'border-[var(--border)]/40 bg-[var(--surface)]/20 text-[var(--text-primary)] hover:bg-[var(--surface)]/50'
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {answer.text}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)]/40 bg-[var(--surface)]/30 p-6 text-sm text-[var(--text-secondary)]">
          Waiting for the next trivia question...
        </div>
      )}

      {/* Answer feedback */}
      <AnimatePresence>
        {answerFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              answerFeedback.isCorrect
                ? 'border-[var(--success-500)]/20 bg-[var(--success-500)]/5 text-[var(--success-500)]'
                : 'border-[var(--error-500)]/20 bg-[var(--error-500)]/5 text-[var(--error-500)]'
            }`}
          >
            {answerFeedback.isCorrect ? <IconCheck size={16} /> : <IconX size={16} />}
            {answerFeedback.isCorrect
              ? `Correct! +${answerFeedback.pointsEarned} points.`
              : 'Incorrect answer.'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Round results */}
      <AnimatePresence>
        {roundResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[var(--warning-500)]/20 bg-[var(--warning-500)]/5 px-4 py-3 text-sm text-[var(--warning-500)]"
          >
            Correct answer: <span className="font-semibold">{question?.answers.find((answer) => answer.id === roundResults.correctAnswerId)?.text ??
              roundResults.correctAnswerId}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer status + Leaderboard */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Answer status */}
        <div>
          <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Answer Status</h3>
          <div className="space-y-2">
            {players.map((player) => {
              const didAnswer = answeredPlayers.includes(player.id)
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)]/40 bg-[var(--surface)]/30 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {player.name}
                      {player.id === currentUserId ? ' (You)' : ''}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      {didAnswer ? 'Locked in' : 'Thinking'}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-[var(--primary-400)]">{scores[player.id] ?? 0} pts</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            <IconTrophy />
            Leaderboard
          </h3>
          <div className="space-y-2">
            {leaderboardEntries.map((entry) => (
              <div
                key={entry.playerId}
                className="flex items-center justify-between rounded-xl border border-[var(--border)]/40 bg-[var(--surface)]/30 px-4 py-3"
              >
                <p className="text-sm text-[var(--text-primary)]">
                  <span className="font-mono text-[var(--text-tertiary)]">#{entry.rank}</span>{' '}
                  {entry.playerName}
                </p>
                <p className="text-sm font-medium text-[var(--primary-400)]">{entry.score} pts</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
