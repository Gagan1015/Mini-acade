'use client'

import { type FormEvent, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

import type { Player, WordelGuessResult } from '@mini-arcade/shared'

type WordelPlayAreaProps = {
  currentUserId: string
  players: Player[]
  isHost: boolean
  phase: 'waiting' | 'playing' | 'roundEnd' | 'gameEnd'
  wordLength: number
  maxAttempts: number
  guesses: WordelGuessResult[]
  correctWord?: string
  finalScores: Array<{
    playerId: string
    score: number
    rank: number
  }>
  playerStatuses: Record<
    string,
    {
      attemptCount: number
      solved: boolean
      finished: boolean
      score: number
    }
  >
  onSubmitGuess: (guess: string) => void
  onPlayAgain: () => void
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

function IconSend({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

export function WordelPlayArea({
  currentUserId,
  players,
  isHost,
  phase,
  wordLength,
  maxAttempts,
  guesses,
  correctWord,
  finalScores,
  playerStatuses,
  onSubmitGuess,
  onPlayAgain,
}: WordelPlayAreaProps) {
  const [guess, setGuess] = useState('')

  const activePlayerState = playerStatuses[currentUserId]
  const canSubmit =
    phase === 'playing' &&
    guess.trim().length === wordLength &&
    !(activePlayerState?.finished ?? false)
  const showCorrectWord = Boolean(correctWord && phase !== 'playing')
  const canPlayAgain = phase === 'gameEnd' && isHost

  const rows = useMemo(() => {
    const paddedRows = [...guesses]
    while (paddedRows.length < maxAttempts) {
      paddedRows.push(undefined as unknown as WordelGuessResult)
    }
    return paddedRows
  }, [guesses, maxAttempts])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    onSubmitGuess(guess.trim().toUpperCase())
    setGuess('')
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--game-wordel)]/80">Wordel Match</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">Solve the hidden word</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
              Everyone gets the same five-letter answer. Faster solves score higher.
            </p>
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            Attempts: <span className="font-semibold text-[var(--text-primary)]">{guesses.length}</span> / {maxAttempts}
          </div>
        </div>

        {/* Word grid */}
        <div className="mx-auto flex w-full max-w-md flex-col gap-2">
          {rows.map((row, rowIndex) => (
            <motion.div
              key={`${row?.guess ?? 'row'}-${rowIndex}`}
              initial={row ? { opacity: 0, y: 8 } : {}}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex justify-center gap-2"
            >
              {(row?.guess ?? ''.padEnd(wordLength, ' ')).split('').map((letter, cellIndex) => {
                const result = row?.results?.[cellIndex]
                const colorClass =
                  result === 'correct'
                    ? 'border-[var(--success-500)]/50 bg-[var(--success-500)]/12 text-[var(--success-500)]'
                    : result === 'present'
                      ? 'border-[var(--warning-500)]/50 bg-[var(--warning-500)]/12 text-[var(--warning-500)]'
                      : result === 'absent'
                        ? 'border-[var(--border)] bg-[var(--surface)]/60 text-[var(--text-tertiary)]'
                        : 'border-[var(--border)]/50 bg-[var(--surface)]/20 text-[var(--text-tertiary)]'

                return (
                  <motion.div
                    key={`${rowIndex}-${cellIndex}`}
                    initial={result ? { rotateX: 90 } : {}}
                    animate={{ rotateX: 0 }}
                    transition={{ delay: cellIndex * 0.05, duration: 0.3 }}
                    className={`flex h-14 w-14 items-center justify-center rounded-xl border font-mono text-xl font-semibold uppercase ${colorClass}`}
                  >
                    {letter.trim()}
                  </motion.div>
                )
              })}
            </motion.div>
          ))}
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
          <input
            value={guess}
            onChange={(event) => setGuess(event.target.value.toUpperCase())}
            maxLength={wordLength}
            disabled={phase !== 'playing' || activePlayerState?.finished}
            placeholder="Type your guess"
            className="input flex-1 font-mono tracking-[0.25em] uppercase"
          />
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!canSubmit}
            className="btn btn-primary gap-2 px-6"
          >
            <IconSend size={15} />
            Submit guess
          </motion.button>
        </form>

        <AnimatePresence>
          {(showCorrectWord || canPlayAgain) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-[var(--warning-500)]/25 bg-[var(--warning-500)]/8 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--warning-500)]/85">
                  {phase === 'gameEnd' ? 'Round Complete' : 'Answer Revealed'}
                </p>
                {showCorrectWord && (
                  <p className="font-mono text-lg font-semibold tracking-[0.18em] text-[var(--warning-500)]">
                    {correctWord}
                  </p>
                )}
              </div>
              {canPlayAgain && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onPlayAgain}
                  className="btn btn-primary whitespace-nowrap px-5"
                >
                  Play again
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Player Progress</h3>
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
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[var(--primary-400)]">{status?.score ?? 0} pts</p>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      {status?.solved
                        ? 'Solved'
                        : status?.finished
                          ? 'Out of tries'
                          : 'Still guessing'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            <IconTrophy />
            Final Scores
          </h3>
          <div className="space-y-2">
            {finalScores.length > 0 ? (
              finalScores.map((entry) => {
                const player = players.find((candidate) => candidate.id === entry.playerId)
                return (
                  <div
                    key={entry.playerId}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)]/40 bg-[var(--surface)]/30 px-4 py-3"
                  >
                    <p className="text-sm text-[var(--text-primary)]">
                      <span className="font-mono text-[var(--text-tertiary)]">#{entry.rank}</span>{' '}
                      {player?.name ?? entry.playerId}
                    </p>
                    <p className="text-sm font-medium text-[var(--primary-400)]">{entry.score} pts</p>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">
                Final standings will appear here when the round ends.
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
