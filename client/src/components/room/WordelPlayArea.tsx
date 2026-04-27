'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

import type { Player, WordelGuessResult, WordelLetterResult } from '@arcado/shared'

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
  submitError?: string | null
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

/* â”€â”€ Constants â”€â”€ */

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
]

const FLIP_DURATION = 0.75 // seconds per tile
const FLIP_STAGGER = 0.32 // seconds between tiles

/* â”€â”€ Color helpers â”€â”€ */

const COLORS = {
  correct: '#538d4e',
  present: '#b59f3b',
  absent: 'var(--wordel-absent)',
  tileEmpty: 'var(--wordel-tile-empty)',
  tileBorderEmpty: 'var(--wordel-tile-border-empty)',
  tileBorderFilled: 'var(--wordel-tile-border-filled)',
  keyDefault: 'var(--wordel-key-default)',
  white: 'var(--wordel-text)',
}

function getTileBg(result?: WordelLetterResult): string {
  if (!result) return COLORS.tileEmpty
  return COLORS[result]
}

function getTileBorder(result?: WordelLetterResult, hasLetter?: boolean): string {
  if (result) return COLORS[result]
  return hasLetter ? COLORS.tileBorderFilled : COLORS.tileBorderEmpty
}

function getKeyBg(status?: WordelLetterResult): string {
  if (!status) return COLORS.keyDefault
  return COLORS[status]
}


/* â”€â”€ SVG Icons â”€â”€ */

function IconBackspace({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <line x1="18" y1="9" x2="12" y2="15" />
      <line x1="12" y1="9" x2="18" y2="15" />
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

/* â”€â”€ Main component â”€â”€ */

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
  submitError,
  playerStatuses,
  onSubmitGuess,
  onPlayAgain,
}: WordelPlayAreaProps) {
  const [currentGuess, setCurrentGuess] = useState('')
  const [pendingGuess, setPendingGuess] = useState('')
  const [shakeRow, setShakeRow] = useState(false)
  const [popCol, setPopCol] = useState(-1)
  const [isWaitingForResult, setIsWaitingForResult] = useState(false)

  // â”€â”€ Flip animation state â”€â”€
  // Which row index is currently playing the flip animation (-1 = none)
  const [flippingRow, setFlippingRow] = useState(-1)
  // Which tiles in the flipping row have passed the 180Â° midpoint (color revealed)
  const [revealedTiles, setRevealedTiles] = useState<Set<number>>(new Set())
  // Is the full flip sequence still running?
  const [isFlipAnimating, setIsFlipAnimating] = useState(false)
  // Tracks previous guesses count so we detect new arrivals from the server
  const prevGuessCountRef = useRef(guesses.length)
  // Unique key to force framer-motion to re-mount and replay the flip
  const [flipKey, setFlipKey] = useState(0)

  const activePlayerState = playerStatuses[currentUserId]
  const isFinished = activePlayerState?.finished ?? false
  const canType = phase === 'playing' && !isFinished && !isWaitingForResult && !isFlipAnimating
  const showCorrectWord = Boolean(correctWord && phase !== 'playing')
  const canPlayAgain = phase === 'gameEnd' && isHost
  const isSolo = players.length <= 1
  const pendingIncomingRow = guesses.length > prevGuessCountRef.current ? guesses.length - 1 : -1
  const visualFlippingRow = pendingIncomingRow !== -1 ? pendingIncomingRow : flippingRow
  const showPendingGuessInGrid = isWaitingForResult && pendingIncomingRow === -1

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Detect when a NEW guess arrives from the server
   * and kick off the sequential tile-flip animation.
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  useEffect(() => {
    if (guesses.length < prevGuessCountRef.current) {
      setFlippingRow(-1)
      setRevealedTiles(new Set())
      setIsFlipAnimating(false)
      setIsWaitingForResult(false)
      setPendingGuess('')
      setCurrentGuess('')
      prevGuessCountRef.current = guesses.length
      return
    }

    if (guesses.length > prevGuessCountRef.current) {
      const newRowIndex = guesses.length - 1

      // Start flip animation for the newly-arrived row
      setFlippingRow(newRowIndex)
      setRevealedTiles(new Set())
      setIsFlipAnimating(true)
      setIsWaitingForResult(false)
      setPendingGuess('')
      setCurrentGuess('')
      setFlipKey((k) => k + 1) // force re-mount so animation replays

      // Stagger color reveals at each tile's 180Â° midpoint
      const timers: ReturnType<typeof setTimeout>[] = []
      for (let i = 0; i < wordLength; i++) {
        const midpointMs = (i * FLIP_STAGGER + FLIP_DURATION / 2) * 1000
        timers.push(
          setTimeout(() => {
            setRevealedTiles((prev) => {
              const next = new Set(prev)
              next.add(i)
              return next
            })
          }, midpointMs)
        )
      }

      // Mark animation as complete after the last tile finishes
      const totalAnimMs =
        ((wordLength - 1) * FLIP_STAGGER + FLIP_DURATION) * 1000 + 50
      timers.push(
        setTimeout(() => {
          setIsFlipAnimating(false)
          setFlippingRow(-1)
        }, totalAnimMs)
      )

      prevGuessCountRef.current = guesses.length
      return () => timers.forEach(clearTimeout)
    }

    prevGuessCountRef.current = guesses.length
  }, [guesses.length, wordLength])

  useEffect(() => {
    if (!isWaitingForResult || !submitError) {
      return
    }

    setIsWaitingForResult(false)
    setCurrentGuess(pendingGuess)
    setPendingGuess('')
    setShakeRow(true)
    const timeoutId = window.setTimeout(() => setShakeRow(false), 450)

    return () => window.clearTimeout(timeoutId)
  }, [isWaitingForResult, pendingGuess, submitError])

  /* Build letter status map from all guesses for keyboard coloring.
   * Only include tiles whose colors are actually visible on screen. */
  const letterStatuses = useMemo(() => {
    const map: Record<string, WordelLetterResult> = {}
    for (let gi = 0; gi < guesses.length; gi++) {
      const isRowFlipping = gi === visualFlippingRow
      if (pendingIncomingRow === gi) continue

      const g = guesses[gi]
      const letters = g.guess.split('')
      for (let i = 0; i < letters.length; i++) {
        // If this row is mid-flip, only include tiles past the midpoint
        if (isRowFlipping && !revealedTiles.has(i)) continue

        const letter = letters[i]
        const result = g.results[i]
        const current = map[letter]
        if (result === 'correct') {
          map[letter] = 'correct'
        } else if (result === 'present' && current !== 'correct') {
          map[letter] = 'present'
        } else if (result === 'absent' && !current) {
          map[letter] = 'absent'
        }
      }
    }
    return map
  }, [guesses, pendingIncomingRow, revealedTiles, visualFlippingRow])

  /* Build the visual grid rows */
  const rows = useMemo(() => {
    const grid: Array<{
      letters: string[]
      results?: WordelLetterResult[]
      isRevealed: boolean
    }> = []

    for (let i = 0; i < maxAttempts; i++) {
      if (i < guesses.length) {
        grid.push({
          letters: guesses[i].guess.split(''),
          results: guesses[i].results,
          isRevealed: true,
        })
      } else if (i === guesses.length) {
        const draftGuess = showPendingGuessInGrid ? pendingGuess : currentGuess
        const padded = draftGuess.split('')
        while (padded.length < wordLength) padded.push('')
        grid.push({ letters: padded, isRevealed: false })
      } else {
        grid.push({ letters: Array(wordLength).fill(''), isRevealed: false })
      }
    }
    return grid
  }, [currentGuess, guesses, maxAttempts, pendingGuess, showPendingGuessInGrid, wordLength])

  /* Handle virtual/physical keyboard input */
  const handleKeyPress = useCallback(
    (key: string) => {
      if (!canType) return

      if (key === 'ENTER') {
        if (currentGuess.length === wordLength) {
          // Send guess to server â€” don't clear or animate yet.
          // The flip will start when the server response arrives.
          const submittedGuess = currentGuess.toUpperCase()
          setPendingGuess(submittedGuess)
          setCurrentGuess('')
          onSubmitGuess(submittedGuess)
          setIsWaitingForResult(true)
        } else {
          setShakeRow(true)
          setTimeout(() => setShakeRow(false), 600)
        }
        return
      }

      if (key === 'BACKSPACE') {
        setCurrentGuess((prev) => prev.slice(0, -1))
        return
      }

      if (currentGuess.length < wordLength && /^[A-Z]$/.test(key)) {
        setPopCol(currentGuess.length)
        setTimeout(() => setPopCol(-1), 100)
        setCurrentGuess((prev) => prev + key)
      }
    },
    [canType, currentGuess, wordLength, onSubmitGuess]
  )

  /* Physical keyboard listener */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Enter') {
        e.preventDefault()
        handleKeyPress('ENTER')
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleKeyPress('BACKSPACE')
      } else {
        const letter = e.key.toUpperCase()
        if (/^[A-Z]$/.test(letter)) {
          e.preventDefault()
          handleKeyPress(letter)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyPress])

  /* â”€â”€ Render â”€â”€ */
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        width: '100%',
        padding: '8px 0',
        userSelect: 'none',
      }}
    >
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={isSolo ? '' : 'grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]'}
        style={{ width: '100%' }}
      >
        {/* â”€â”€ Left: grid + keyboard â”€â”€ */}
        <div className="flex flex-col items-center">
          {/* Attempt counter */}
          <div className="mb-2">
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
              Attempt {guesses.length} / {maxAttempts}
            </span>
          </div>

          {/* â”€â”€ TILE GRID â”€â”€ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 0' }}>
            {rows.map((row, rowIndex) => {
              const isCurrentRow = rowIndex === guesses.length && !row.isRevealed
              return (
                <motion.div
                  key={rowIndex}
                  style={{ display: 'flex', gap: '6px', justifyContent: 'center', perspective: '1000px' }}
                  animate={isCurrentRow && shakeRow ? { x: [0, -4, 4, -4, 4, -2, 2, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {row.letters.map((letter, colIndex) => {
                    const result = row.results?.[colIndex]
                    const hasLetter = letter !== ''
                    const isFlipping = rowIndex === visualFlippingRow
                    // Show color ONLY if:
                    // - row belongs to a finished guess, OR
                    // - row is mid-flip AND this tile passed the 180Â° midpoint
                    const tileColorRevealed =
                      rowIndex < guesses.length &&
                      (isFlipping
                        ? pendingIncomingRow === rowIndex
                          ? false
                          : revealedTiles.has(colIndex)
                        : true)

                    // Color swaps at the 180Â° midpoint of the flip
                    const bg = tileColorRevealed ? getTileBg(result) : COLORS.tileEmpty
                    const border = tileColorRevealed
                      ? getTileBorder(result)
                      : getTileBorder(undefined, hasLetter)
                    const textColor = tileColorRevealed && result ? '#ffffff' : COLORS.white
                    const isPop = isCurrentRow && colIndex === popCol

                    return (
                      <motion.div
                        // flipKey forces re-mount so framer replays the animation
                        key={isFlipping ? `flip-${flipKey}-${colIndex}` : `${rowIndex}-${colIndex}`}
                        style={{
                          width: '62px',
                          height: '62px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2rem',
                          fontWeight: 700,
                          fontFamily: 'var(--font-sans)',
                          textTransform: 'uppercase',
                          border: `2px solid ${border}`,
                          backgroundColor: bg,
                          color: textColor,
                          lineHeight: 1,
                          boxSizing: 'border-box',
                          transformStyle: 'preserve-3d',
                          backfaceVisibility: 'hidden',
                        }}
                        animate={
                          isPop
                            ? { scale: [1, 1.1, 1] }
                            : isFlipping
                              ? { rotateX: [0, 180, 360] }
                              : {}
                        }
                        transition={
                          isPop
                            ? { duration: 0.1 }
                            : isFlipping
                              ? {
                                  delay: colIndex * FLIP_STAGGER,
                                  duration: FLIP_DURATION,
                                  ease: [0.45, 0, 0.55, 1],
                                }
                              : {}
                        }
                      >
                        {letter}
                      </motion.div>
                    )
                  })}
                </motion.div>
              )
            })}
          </div>

          {/* â”€â”€ Result banner â”€â”€ */}
          <AnimatePresence>
            {(showCorrectWord || canPlayAgain) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '20px 24px',
                  borderRadius: '16px',
                  border: `1px solid ${activePlayerState?.solved ? 'rgba(83,141,78,0.3)' : 'rgba(181,159,59,0.3)'}`,
                  background: activePlayerState?.solved ? 'rgba(83,141,78,0.08)' : 'rgba(181,159,59,0.08)',
                  textAlign: 'center',
                  width: '100%',
                  maxWidth: '420px',
                  marginTop: '16px',
                }}
              >
                <p
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.18em',
                    color: activePlayerState?.solved ? COLORS.correct : COLORS.present,
                    margin: 0,
                  }}
                >
                  {activePlayerState?.solved
                    ? phase === 'gameEnd' ? 'You Won!' : 'Correct!'
                    : phase === 'gameEnd' ? 'Round Complete' : 'Answer Revealed'}
                </p>
                {showCorrectWord && (
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      color: activePlayerState?.solved ? COLORS.correct : COLORS.present,
                      margin: 0,
                    }}
                  >
                    {correctWord}
                  </p>
                )}
                {canPlayAgain && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={onPlayAgain}
                    className="btn btn-primary mt-2 px-8 py-2.5"
                  >
                    Play Again
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* â”€â”€ ON-SCREEN KEYBOARD â”€â”€ */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '0 8px',
              maxWidth: '500px',
              width: '100%',
              marginTop: '20px',
            }}
          >
            {KEYBOARD_ROWS.map((row, rowIndex) => (
              <div
                key={rowIndex}
                style={{
                  display: 'flex',
                  gap: '6px',
                  justifyContent: 'center',
                }}
              >
                {/* Spacer for middle row to center it */}
                {rowIndex === 1 && <div style={{ flex: '0.5' }} />}
                {row.map((key) => {
                  const isWide = key === 'ENTER' || key === 'BACKSPACE'
                  const status = letterStatuses[key]
                  const bg = isWide ? COLORS.keyDefault : getKeyBg(status)

                  return (
                    <button
                      key={key}
                      onClick={() => handleKeyPress(key)}
                      disabled={!canType}
                      aria-label={key === 'BACKSPACE' ? 'Delete' : key === 'ENTER' ? 'Submit' : key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '58px',
                        minWidth: isWide ? '65px' : '43px',
                        maxWidth: isWide ? '65px' : undefined,
                        flex: isWide ? 'none' : '1',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: isWide ? '0.7rem' : '0.85rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-sans)',
                        textTransform: 'uppercase',
                        cursor: canType ? 'pointer' : 'not-allowed',
                        padding: 0,
                        backgroundColor: bg,
                        color: status ? '#ffffff' : COLORS.white,
                        letterSpacing: isWide ? '0.05em' : '0.02em',
                        opacity: canType ? 1 : 0.5,
                        transition: 'opacity 0.1s ease',
                      }}
                    >
                      {key === 'BACKSPACE' ? <IconBackspace size={20} /> : key}
                    </button>
                  )
                })}
                {rowIndex === 1 && <div style={{ flex: '0.5' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* â”€â”€ Right sidebar: Player Progress â€” multiplayer only â”€â”€ */}
        {!isSolo && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Player Progress
              </h3>
              <div className="space-y-2">
                {players.map((player) => {
                  const status = playerStatuses[player.id]
                  const isActive = (status?.attemptCount ?? 0) > 0 || status?.solved
                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded-xl px-4 py-3"
                      style={{
                        border: `1px solid ${isActive ? 'rgba(83,141,78,0.25)' : 'var(--border)'}`,
                        background: isActive ? 'rgba(83,141,78,0.05)' : 'var(--surface)',
                        opacity: isActive ? 1 : 0.5,
                      }}
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
                        <p className="text-sm font-medium" style={{ color: COLORS.correct }}>
                          {status?.score ?? 0} pts
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                          {status?.solved
                            ? '\u2713 Solved'
                            : status?.finished
                              ? '\u2717 Out'
                              : 'Guessing\u2026'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Final scores */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                <IconTrophy />
                Final Scores
              </h3>
              <div className="space-y-2">
                {finalScores.length > 0 ? (
                  finalScores.map((entry) => {
                    const player = players.find((p) => p.id === entry.playerId)
                    return (
                      <div
                        key={entry.playerId}
                        className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{
                          border: '1px solid rgba(83,141,78,0.25)',
                          background: 'rgba(83,141,78,0.05)',
                        }}
                      >
                        <p className="text-sm text-[var(--text-primary)]">
                          <span className="font-mono text-[var(--text-tertiary)]">#{entry.rank}</span>{' '}
                          {player?.name ?? entry.playerId}
                        </p>
                        <p className="text-sm font-medium" style={{ color: COLORS.correct }}>
                          {entry.score} pts
                        </p>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Final standings appear when the round ends.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.section>
    </div>
  )
}
