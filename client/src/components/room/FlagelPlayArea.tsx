'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

import type { FlagelGameEnded, FlagelGuessResult, Player } from '@mini-arcade/shared'

type FlagelPlayAreaProps = {
  currentUserId: string
  players: Player[]
  phase: 'waiting' | 'playing' | 'roundEnd' | 'gameEnd'
  currentRound: number
  totalRounds: number
  flagEmoji?: string
  maxAttempts: number
  guesses: FlagelGuessResult[]
  playerStatuses: Record<
    string,
    {
      attemptCount: number
      solved: boolean
      finished: boolean
      score: number
    }
  >
  scores: Record<string, number>
  finalScores: FlagelGameEnded['finalScores']
  correctCountry?: string
  countryCode?: string
  onSubmitGuess: (guess: string) => void
  onSkip: () => void
}

/* ── SVG Icons ── */

function IconGlobe({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--game-flagel)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

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

export function FlagelPlayArea({
  currentUserId,
  players,
  phase,
  currentRound,
  totalRounds,
  flagEmoji,
  maxAttempts,
  guesses,
  playerStatuses,
  scores,
  finalScores,
  correctCountry,
  countryCode,
  onSubmitGuess,
  onSkip,
}: FlagelPlayAreaProps) {
  const [guess, setGuess] = useState('')
  const canSubmit =
    phase === 'playing' &&
    guess.trim().length > 0 &&
    !(playerStatuses[currentUserId]?.finished ?? false)

  const leaderboard = finalScores.length
    ? finalScores
    : [...players]
        .sort((left, right) => (scores[right.id] ?? 0) - (scores[left.id] ?? 0))
        .map((player, index) => ({
          playerId: player.id,
          score: scores[player.id] ?? 0,
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
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--game-flagel)]/80">Flagel Match</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">Read the flag, chase the country</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
            Guess the country name. Wrong guesses reveal distance and direction.
          </p>
        </div>
        <div className="text-right text-sm text-[var(--text-secondary)]">
          <p>
            Round <span className="font-semibold text-[var(--text-primary)]">{currentRound}</span> / {totalRounds}
          </p>
          <p className="mt-2">
            Attempts: <span className="font-semibold text-[var(--text-primary)]">{playerStatuses[currentUserId]?.attemptCount ?? 0}</span> / {maxAttempts}
          </p>
        </div>
      </div>

      {/* Flag display */}
      <div className="rounded-2xl border border-[var(--border)]/40 bg-[var(--surface)]/30 p-8 text-center">
        {flagEmoji ? (
          <div className="text-7xl leading-none">{flagEmoji}</div>
        ) : (
          <div className="flex justify-center">
            <IconGlobe size={64} />
          </div>
        )}
        <p className="mt-5 text-sm text-[var(--text-tertiary)]">
          Enter a country name, code, or common alias from the bundled list.
        </p>

        <form
          className="mt-6 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            if (!canSubmit) return
            onSubmitGuess(guess)
            setGuess('')
          }}
        >
          <input
            value={guess}
            onChange={(event) => setGuess(event.target.value)}
            placeholder="Guess a country"
            disabled={phase !== 'playing' || (playerStatuses[currentUserId]?.finished ?? false)}
            className="input flex-1"
          />
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!canSubmit}
            className="btn btn-primary px-6"
          >
            Submit guess
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onSkip}
            disabled={phase !== 'playing' || (playerStatuses[currentUserId]?.finished ?? false)}
            className="btn btn-secondary px-6"
          >
            Skip round
          </motion.button>
        </form>
      </div>

      {/* Correct answer reveal */}
      <AnimatePresence>
        {correctCountry && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[var(--warning-500)]/20 bg-[var(--warning-500)]/5 px-4 py-3 text-sm text-[var(--warning-500)]"
          >
            Correct answer: <span className="font-semibold">{correctCountry}</span> {countryCode ? `(${countryCode})` : ''}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guess feed + Room progress */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Guess feed */}
        <div>
          <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Your Guess Feed</h3>
          <div className="space-y-2">
            {guesses.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">No guesses yet.</p>
            ) : (
              guesses.map((entry) => (
                <motion.div
                  key={`${entry.guess}-${entry.attemptsUsed}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-xl border border-[var(--border)]/40 bg-[var(--surface)]/30 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{entry.guess}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Try {entry.attemptsUsed}</p>
                  </div>
                  <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                    {entry.isCorrect
                      ? 'Correct'
                      : `${entry.distance?.toLocaleString() ?? '?'} km away, direction ${entry.direction ?? '?'}`
                    }
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Room progress */}
        <div>
          <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Room Progress</h3>
          <div className="space-y-2">
            {players.map((player) => {
              const status = playerStatuses[player.id]
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
                      Attempts: {status?.attemptCount ?? 0} / {maxAttempts}
                      {status?.solved ? ' · Solved' : status?.finished ? ' · Finished' : ' · Guessing'}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-[var(--primary-400)]">{scores[player.id] ?? 0} pts</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
          <IconTrophy />
          Leaderboard
        </h3>
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div
              key={entry.playerId}
              className="flex items-center justify-between rounded-xl border border-[var(--border)]/40 bg-[var(--surface)]/30 px-4 py-3"
            >
              <p className="text-sm text-[var(--text-primary)]">
                <span className="font-mono text-[var(--text-tertiary)]">#{entry.rank}</span>{' '}
                {players.find((player) => player.id === entry.playerId)?.name ?? entry.playerId}
              </p>
              <p className="text-sm font-medium text-[var(--primary-400)]">{entry.score} pts</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
