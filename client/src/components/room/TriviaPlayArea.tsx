'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

import type {
  Player,
  TriviaAnswerResultPayload,
  TriviaGameEnded,
  TriviaQuestion,
  TriviaRoundEnded,
  TriviaRoundStarted,
} from '@arcado/shared'
import type { TriviaRoundHistoryEntry } from '@/hooks/useRoom'
import { TriviaResultsModal } from './TriviaResultsModal'
import { TriviaDetailedResults } from './TriviaDetailedResults'

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
  roundHistory: TriviaRoundHistoryEntry[]
  onSubmitAnswer: (questionId: string, answerId: TriviaQuestion['answers'][number]['id']) => void
}

/* â”€â”€ SVG Icons â”€â”€ */

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
  roundHistory,
  onSubmitAnswer,
}: TriviaPlayAreaProps) {
  const sortedPlayers = [...players].sort((left, right) => (scores[right.id] ?? 0) - (scores[left.id] ?? 0))
  const maxPossibleScore = totalRounds * 1000
  const isReveal = phase === 'roundEnd' || phase === 'gameEnd'
  const [displayTimeRemaining, setDisplayTimeRemaining] = useState(timeRemaining)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [showDetailedResults, setShowDetailedResults] = useState(false)
  const [prevPhase, setPrevPhase] = useState(phase)
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

  useEffect(() => {
    if (phase !== 'roundEnd' || !roundResults?.nextRoundStartsAt) {
      setDisplayTimeRemaining(timeRemaining)
      return
    }

    const updateCountdown = () => {
      setDisplayTimeRemaining(getRemainingSeconds(roundResults.nextRoundStartsAt))
    }

    updateCountdown()
    const intervalId = window.setInterval(updateCountdown, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [phase, roundResults?.nextRoundStartsAt, timeRemaining])

  // Auto-open results modal when game ends
  useEffect(() => {
    if (prevPhase !== 'gameEnd' && phase === 'gameEnd') {
      setShowResultsModal(true)
    }
    setPrevPhase(phase)
  }, [phase, prevPhase])

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
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Max score {maxPossibleScore.toLocaleString()} pts
          </p>
          <div
            className={`mt-3 inline-flex min-w-[112px] flex-col rounded-2xl border px-4 py-3 ${
              phase === 'roundEnd'
                ? 'border-[var(--warning-500)]/25 bg-[var(--warning-500)]/10'
                : displayTimeRemaining <= 5
                  ? 'border-[var(--error-500)]/25 bg-[var(--error-500)]/10'
                  : 'border-[var(--border)]/40 bg-[var(--surface)]/35'
            }`}
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              {phase === 'roundEnd' ? 'Next Question In' : 'Time Left'}
            </span>
            <span className="mt-1 font-mono text-3xl font-bold text-[var(--text-primary)]">
              {displayTimeRemaining}s
            </span>
          </div>
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
              const isCorrectAnswer = roundResults?.correctAnswerId === answer.id
              const isInstantCorrect = isSelected && answerFeedback?.isCorrect === true
              const isInstantWrong = isSelected && answerFeedback?.isCorrect === false
              const showCorrectState = isCorrectAnswer || (!isReveal && isInstantCorrect)
              const showWrongState = !showCorrectState && (isReveal ? isSelected && !isCorrectAnswer : isInstantWrong)

              return (
                <motion.button
                  key={answer.id}
                  whileHover={!selectedAnswerId && phase === 'playing' ? { scale: 1.01 } : {}}
                  whileTap={!selectedAnswerId && phase === 'playing' ? { scale: 0.99 } : {}}
                  type="button"
                  onClick={() => onSubmitAnswer(question.id, answer.id)}
                  disabled={phase !== 'playing' || Boolean(selectedAnswerId)}
                  className={`rounded-xl border px-4 py-4 text-left text-sm transition-all duration-200 ${
                    showCorrectState
                      ? 'border-[var(--success-500)]/35 bg-[var(--success-500)]/12 text-[var(--success-500)] shadow-[0_16px_36px_-28px_rgba(16,185,129,0.45)]'
                      : showWrongState
                        ? 'border-[var(--error-500)]/30 bg-[var(--error-500)]/10 text-[var(--error-500)] shadow-[0_16px_36px_-28px_rgba(239,68,68,0.38)]'
                        : isSelected
                      ? 'border-[var(--primary-500)]/45 bg-[var(--primary-500)]/14 text-[var(--text-primary)]'
                      : 'border-[var(--border)]/40 bg-[var(--surface)]/20 text-[var(--text-primary)] hover:bg-[var(--surface)]/50'
                  } disabled:cursor-not-allowed`}
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
                ? 'border-[var(--success-500)]/35 bg-[var(--success-500)]/12 text-[var(--success-500)] shadow-[0_16px_36px_-28px_rgba(16,185,129,0.42)]'
                : 'border-[var(--error-500)]/30 bg-[var(--error-500)]/10 text-[var(--error-500)] shadow-[0_16px_36px_-28px_rgba(239,68,68,0.34)]'
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
            className="rounded-xl border border-[var(--warning-500)]/25 bg-[var(--warning-500)]/12 px-4 py-3 text-sm text-[var(--text-primary)]"
          >
            Correct answer: <span className="font-semibold">{question?.answers.find((answer) => answer.id === roundResults.correctAnswerId)?.text ??
              roundResults.correctAnswerId}</span>
            {roundResults.explanation && (
              <p className="mt-2 text-[var(--text-secondary)]">{roundResults.explanation}</p>
            )}
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
                  <p className="text-sm font-medium text-[var(--primary-400)]">
                    {(scores[player.id] ?? 0).toLocaleString()} / {maxPossibleScore.toLocaleString()}
                  </p>
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
                <p className="text-sm font-medium text-[var(--primary-400)]">
                  {entry.score.toLocaleString()} / {maxPossibleScore.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Game End Results Button */}
      {phase === 'gameEnd' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-3"
        >
          <button
            onClick={() => setShowResultsModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--game-trivia)] px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            View Results
          </button>
        </motion.div>
      )}

      {/* Results Modal */}
      <TriviaResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        onViewDetails={() => {
          setShowResultsModal(false)
          setShowDetailedResults(true)
        }}
        roundHistory={roundHistory}
        finalScores={finalScores}
        currentUserId={currentUserId}
        totalRounds={totalRounds}
      />

      {/* Detailed Results Full Page */}
      <AnimatePresence>
        {showDetailedResults && (
          <TriviaDetailedResults
            isOpen={showDetailedResults}
            onClose={() => setShowDetailedResults(false)}
            roundHistory={roundHistory}
            finalScores={finalScores}
            currentUserId={currentUserId}
            totalRounds={totalRounds}
          />
        )}
      </AnimatePresence>
    </motion.section>
  )
}

function getRemainingSeconds(nextRoundStartsAt?: string) {
  if (!nextRoundStartsAt) {
    return 0
  }

  return Math.max(0, Math.ceil((new Date(nextRoundStartsAt).getTime() - Date.now()) / 1000))
}
