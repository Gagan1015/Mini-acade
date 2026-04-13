'use client'

import { useDeferredValue, useEffect, useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import {
  FLAGEL_COUNTRIES,
  findFlagelCountryByGuess,
  getFlagelAccuracyPercent,
  normalizeCountryGuess,
  type FlagelCountry,
  type FlagelGameEnded,
  type FlagelGuessResult,
  type Player,
} from '@mini-arcade/shared'

type FlagelPlayAreaProps = {
  currentUserId: string
  players: Player[]
  phase: 'waiting' | 'playing' | 'roundEnd' | 'gameEnd'
  currentRound: number
  totalRounds: number
  flagEmoji?: string
  flagImageUrl?: string
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

const FLAG_TILE_COLUMNS = 3
const FLAG_TILE_ROWS = 2
const FLAG_TILE_COUNT = FLAG_TILE_COLUMNS * FLAG_TILE_ROWS
const FULL_FLAG_GRID_HIDE_DELAY_MS = 1100
const DROPDOWN_LIMIT = 8

const DIRECTION_ARROWS: Record<string, string> = {
  N: '↑',
  NE: '↗',
  E: '→',
  SE: '↘',
  S: '↓',
  SW: '↙',
  W: '←',
  NW: '↖',
  HERE: '◎',
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

function IconTarget({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconGlobe({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a14.5 14.5 0 0 1 0 20" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20" />
    </svg>
  )
}

function IconChevronDown({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function IconCompass({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16 8 14 14 8 16 10 10 16 8" />
    </svg>
  )
}

function getDirectionArrow(direction?: string) {
  if (!direction) {
    return '•'
  }

  return DIRECTION_ARROWS[direction] ?? direction
}

function getFlagSliceStyle(index: number) {
  const column = index % FLAG_TILE_COLUMNS
  const row = Math.floor(index / FLAG_TILE_COLUMNS)

  return {
    width: `${FLAG_TILE_COLUMNS * 100}%`,
    height: `${FLAG_TILE_ROWS * 100}%`,
    left: `${column * -100}%`,
    top: `${row * -100}%`,
  }
}

function matchesCountry(country: FlagelCountry, normalizedSearch: string) {
  if (!normalizedSearch) {
    return true
  }

  return [country.name, country.officialName, country.code, country.alpha3Code, ...country.aliases].some(
    (candidate) => normalizeCountryGuess(candidate).includes(normalizedSearch)
  )
}

function getAccuracyTone(percent: number) {
  if (percent >= 85) return 'border-emerald-400/45 bg-emerald-500/12 text-emerald-200'
  if (percent >= 60) return 'border-amber-400/45 bg-amber-500/12 text-amber-100'
  return 'border-slate-400/25 bg-slate-500/10 text-slate-200'
}

function getCountryCodeFromFlagEmoji(flagEmoji?: string) {
  if (!flagEmoji) {
    return null
  }

  const codePoints = Array.from(flagEmoji.trim())
    .map((character) => character.codePointAt(0))
    .filter((value): value is number => typeof value === 'number')

  if (codePoints.length !== 2) {
    return null
  }

  const countryCode = codePoints
    .map((codePoint) => {
      if (codePoint < 0x1f1e6 || codePoint > 0x1f1ff) {
        return null
      }

      return String.fromCharCode(65 + codePoint - 0x1f1e6)
    })
    .join('')

  return /^[A-Z]{2}$/.test(countryCode) ? countryCode : null
}

function deriveFlagImageUrl(flagImageUrl?: string, flagEmoji?: string) {
  if (flagImageUrl) {
    const codeFromRemoteUrl = flagImageUrl.match(/flagcdn\.com\/(?:w\d+\/)?([a-z]{2})\.(?:png|svg)$/i)?.[1]
    if (codeFromRemoteUrl) {
      return `/api/flags/${codeFromRemoteUrl.toLowerCase()}`
    }

    return flagImageUrl
  }

  const possibleCode = flagEmoji?.trim().toLowerCase()

  if (possibleCode && /^[a-z]{2}$/.test(possibleCode)) {
    return `/api/flags/${possibleCode}`
  }

  const emojiCountryCode = getCountryCodeFromFlagEmoji(flagEmoji)
  if (emojiCountryCode) {
    return `/api/flags/${emojiCountryCode.toLowerCase()}`
  }

  return undefined
}

export function FlagelPlayArea({
  currentUserId,
  players,
  phase,
  currentRound,
  totalRounds,
  flagEmoji,
  flagImageUrl,
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [flagImageFailed, setFlagImageFailed] = useState(false)
  const [showWholeFlag, setShowWholeFlag] = useState(false)
  const reducedMotion = useReducedMotion()
  const listboxId = useId()

  const deferredGuess = useDeferredValue(guess)
  const normalizedSearch = normalizeCountryGuess(deferredGuess)
  const currentPlayerStatus = playerStatuses[currentUserId]
  const usedAttempts = currentPlayerStatus?.attemptCount ?? guesses.length
  const finished = currentPlayerStatus?.finished ?? false
  const solved = currentPlayerStatus?.solved ?? false
  const canSubmit = phase === 'playing' && normalizeCountryGuess(guess).length > 0 && !finished
  const lastGuess = guesses[guesses.length - 1]
  const revealedTiles =
    phase === 'roundEnd' || phase === 'gameEnd' || solved || lastGuess?.isCorrect
      ? FLAG_TILE_COUNT
      : Math.min(guesses.length, FLAG_TILE_COUNT)
  const isFlagFullyRevealed = revealedTiles === FLAG_TILE_COUNT
  const remainingAttempts = Math.max(maxAttempts - usedAttempts, 0)
  const currentGuessNumber = Math.max(1, Math.min(usedAttempts + (finished ? 0 : 1), maxAttempts))
  const resolvedGuess = findFlagelCountryByGuess(guess)
  const effectiveFlagImageUrl = deriveFlagImageUrl(flagImageUrl, flagEmoji)
  const shouldUseFlagImage = Boolean(effectiveFlagImageUrl) && !flagImageFailed
  const fallbackFlagLabel =
    flagEmoji && /^[A-Z]{2}$/.test(flagEmoji.trim())
      ? flagEmoji.trim().toUpperCase()
      : flagEmoji ?? 'FLAG'

  const matchingCountries = FLAGEL_COUNTRIES.filter((country) => matchesCountry(country, normalizedSearch))
  const visibleCountries = matchingCountries.slice(0, DROPDOWN_LIMIT)
  const displayGuesses = [...guesses].reverse()
  const leaderboard = finalScores.length
    ? finalScores
    : [...players]
        .sort((left, right) => (scores[right.id] ?? 0) - (scores[left.id] ?? 0))
        .map((player, index) => ({
          playerId: player.id,
          score: scores[player.id] ?? 0,
          rank: index + 1,
        }))

  useEffect(() => {
    setGuess('')
    setIsDropdownOpen(false)
  }, [currentRound, guesses.length])

  useEffect(() => {
    setFlagImageFailed(false)
  }, [currentRound, effectiveFlagImageUrl])

  useEffect(() => {
    if (!isFlagFullyRevealed) {
      setShowWholeFlag(false)
      return
    }

    if (reducedMotion) {
      setShowWholeFlag(true)
      return
    }

    const timeoutId = window.setTimeout(() => {
      setShowWholeFlag(true)
    }, FULL_FLAG_GRID_HIDE_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [isFlagFullyRevealed, reducedMotion])

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.35 }}
      className="mx-auto w-full max-w-[660px] space-y-4"
    >
      <div className="flex flex-col gap-3 border-b border-white/12 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--game-flagel)]/75">
            Flagel
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-[28px]">
            Reveal the flag, name the country
          </h2>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[var(--text-secondary)]">
            Each guess flips over another part of the flag. Use the distance and arrow hints to home in on the answer.
          </p>
        </div>
        <div className="min-w-32 border border-white/20 bg-[rgba(9,14,25,0.72)] px-4 py-2.5 text-right shadow-[0_14px_36px_rgba(0,0,0,0.2)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--text-tertiary)]">
            Round {currentRound}/{totalRounds}
          </p>
          <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
            Guess {currentGuessNumber} / {maxAttempts}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            {finished ? 'Round complete' : `${remainingAttempts} attempts remaining`}
          </p>
        </div>
      </div>

      <div className="border border-white/22 bg-[linear-gradient(180deg,rgba(15,21,36,0.96),rgba(8,12,22,0.98))] p-4 shadow-[0_20px_56px_rgba(0,0,0,0.24)]">
        <div className="border border-white/28 bg-[var(--background)]/65">
          {showWholeFlag ? (
            <div className="relative aspect-[2/1] overflow-hidden bg-[rgba(42,51,79,0.98)]">
              {shouldUseFlagImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={effectiveFlagImageUrl}
                  alt=""
                  draggable={false}
                  onError={() => {
                    console.warn('[mini-arcade][flagel:image-error]', {
                      flagEmoji,
                      flagImageUrl,
                      effectiveFlagImageUrl,
                    })
                    setFlagImageFailed(true)
                  }}
                  className="pointer-events-none h-full w-full select-none object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,rgba(54,62,90,0.95),rgba(20,26,42,0.98))] text-[clamp(18px,2.8vw,32px)] font-semibold uppercase tracking-[0.08em] text-white/92">
                  {fallbackFlagLabel}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[2px] overflow-hidden bg-[rgba(185,196,224,0.58)]">
              {Array.from({ length: FLAG_TILE_COUNT }, (_, index) => {
                const isRevealed = index < revealedTiles
                return (
                  <div
                    key={index}
                    className="relative aspect-[4/3] overflow-hidden bg-[rgba(42,51,79,0.98)] [perspective:1400px]"
                  >
                    <motion.div
                      initial={false}
                      animate={{ rotateY: isRevealed ? 180 : 0 }}
                      transition={{
                        duration: reducedMotion ? 0 : 0.8,
                        delay: reducedMotion || !isRevealed ? 0 : (index % FLAG_TILE_COLUMNS) * 0.08 + Math.floor(index / FLAG_TILE_COLUMNS) * 0.12,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="relative h-full w-full [transform-style:preserve-3d]"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(76,88,126,0.96),rgba(38,48,78,0.98))] [backface-visibility:hidden]" />
                      <div className="absolute inset-0 overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        {shouldUseFlagImage ? (
                          // We intentionally use a raw img so each tile can crop the same flag asset.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={effectiveFlagImageUrl}
                            alt=""
                            draggable={false}
                            onError={() => {
                              console.warn('[mini-arcade][flagel:image-error]', {
                                flagEmoji,
                                flagImageUrl,
                                effectiveFlagImageUrl,
                              })
                              setFlagImageFailed(true)
                            }}
                            className="pointer-events-none absolute max-w-none select-none object-cover"
                            style={getFlagSliceStyle(index)}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,rgba(54,62,90,0.95),rgba(20,26,42,0.98))] text-[clamp(18px,2.8vw,32px)] font-semibold uppercase tracking-[0.08em] text-white/92">
                            {fallbackFlagLabel}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-[13px] text-[var(--text-secondary)]">
          {isFlagFullyRevealed
            ? 'The full flag is uncovered.'
            : `${revealedTiles} of ${FLAG_TILE_COUNT} flag panels uncovered.`}
        </p>
      </div>

      <div className="space-y-3">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (!canSubmit) {
              return
            }

            onSubmitGuess((resolvedGuess ?? (matchingCountries.length === 1 ? matchingCountries[0] : null))?.name ?? guess.trim())
          }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="relative flex-1">
              <label htmlFor="flagel-country-guess" className="sr-only">
                Country name
              </label>
              <div className="relative">
                <input
                  id="flagel-country-guess"
                  value={guess}
                  onChange={(event) => {
                    setGuess(event.target.value)
                    setIsDropdownOpen(true)
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setIsDropdownOpen(false)
                    }, 120)
                  }}
                  placeholder="Country..."
                  autoComplete="off"
                  disabled={phase !== 'playing' || finished}
                  role="combobox"
                  aria-expanded={isDropdownOpen}
                  aria-controls={listboxId}
                  aria-autocomplete="list"
                  className="w-full border border-[var(--border)]/70 bg-[linear-gradient(180deg,rgba(22,29,49,0.98),rgba(18,24,42,0.94))] px-5 py-3.5 pr-12 text-base text-[var(--text-primary)] shadow-[0_12px_30px_rgba(0,0,0,0.18)] outline-none transition focus:border-[var(--primary-400)] focus:shadow-[0_12px_30px_rgba(0,0,0,0.18)] placeholder:text-[var(--text-tertiary)] disabled:cursor-not-allowed disabled:opacity-60"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--text-tertiary)]">
                  <IconChevronDown />
                </span>
              </div>

              <AnimatePresence>
                {isDropdownOpen && visibleCountries.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: reducedMotion ? 0 : 0.18 }}
                    id={listboxId}
                    role="listbox"
                    className="absolute left-0 right-0 z-20 mt-2 overflow-hidden border border-[var(--border)]/65 bg-[rgba(10,14,24,0.98)] shadow-[0_28px_70px_rgba(0,0,0,0.36)] backdrop-blur"
                  >
                    <div className="max-h-72 overflow-y-auto p-1.5">
                      {visibleCountries.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setGuess(country.name)
                            setIsDropdownOpen(false)
                          }}
                          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-white/10"
                        >
                          <span>
                            <span className="block text-sm font-semibold text-[var(--text-primary)]">
                              {country.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-[var(--text-tertiary)]">
                              {country.officialName}
                            </span>
                          </span>
                          <span className="border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                            {country.code}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={reducedMotion ? undefined : { scale: 1.02 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              type="submit"
              disabled={!canSubmit}
              className="inline-flex min-h-[56px] items-center justify-center gap-3 border border-lime-300/45 bg-[linear-gradient(180deg,#84cc16,#65a30d)] px-6 text-base font-semibold text-white shadow-[0_16px_36px_rgba(101,163,13,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <IconGlobe />
              Guess
            </motion.button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 border border-[var(--border)]/55 bg-[var(--surface)]/24 px-4 py-2.5">
          <div className="text-[13px] text-[var(--text-secondary)]">
            {visibleCountries.length > 0
              ? `Search across ${FLAGEL_COUNTRIES.length} countries and territories.`
              : 'No country matches that search yet.'}
          </div>
          <motion.button
            whileHover={reducedMotion ? undefined : { scale: 1.01 }}
            whileTap={reducedMotion ? undefined : { scale: 0.98 }}
            type="button"
            onClick={onSkip}
            disabled={phase !== 'playing' || finished}
            className="inline-flex items-center gap-2 border border-[var(--border)]/65 px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:border-white/20 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Skip round
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {correctCountry && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-wrap items-center justify-between gap-3 border border-emerald-400/25 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-100"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center border border-emerald-300/20 bg-emerald-400/14 text-emerald-200">
                <IconTarget />
              </span>
              <div>
                <p className="font-semibold text-white">Answer: {correctCountry}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-emerald-200/85">
                  {countryCode ?? 'Solved'}
                </p>
              </div>
            </div>
            <div className="text-sm text-emerald-100/90">
              {solved ? 'You found it.' : 'Flag fully revealed.'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {displayGuesses.length === 0 ? (
          <div className="border border-dashed border-[var(--border)]/55 bg-[var(--surface)]/14 px-5 py-5 text-center text-[13px] text-[var(--text-tertiary)]">
            Your guesses will appear here with distance, direction, and accuracy hints.
          </div>
        ) : (
          displayGuesses.map((entry) => {
            const percent = entry.isCorrect ? 100 : getFlagelAccuracyPercent(entry.distance ?? 0)
            return (
              <motion.div
                key={`${entry.guess}-${entry.attemptsUsed}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.24 }}
                className="grid gap-2 sm:grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)_82px_82px]"
              >
                <div className="border border-[var(--border)]/60 bg-[var(--surface)]/22 px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.04em] text-[var(--text-primary)]">
                  {entry.guess}
                </div>
                <div className="border border-[var(--border)]/60 bg-[var(--surface)]/22 px-4 py-2.5 text-sm text-[var(--text-primary)]">
                  {entry.isCorrect ? '0 km' : `${(entry.distance ?? 0).toLocaleString()} km`}
                </div>
                <div className="flex items-center justify-center gap-2 border border-[var(--border)]/60 bg-[var(--surface)]/22 px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)]">
                  <IconCompass size={14} />
                  <span>{entry.isCorrect ? '✓' : getDirectionArrow(entry.direction)}</span>
                </div>
                <div
                  className={`flex items-center justify-center border px-4 py-2.5 text-sm font-semibold ${getAccuracyTone(percent)}`}
                >
                  {percent}%
                </div>
              </motion.div>
            )
          })
        )}

        <div className="bg-[linear-gradient(180deg,rgba(86,102,132,0.9),rgba(63,78,103,0.92))] px-4 py-2.5 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white/90">
          {finished ? 'Round complete' : `Guess ${currentGuessNumber} / ${maxAttempts}`}
        </div>
      </div>

      {players.length > 1 && (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Room Progress
            </h3>
            <div className="space-y-2">
              {players.map((player) => {
                const status = playerStatuses[player.id]
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between border border-[var(--border)]/55 bg-[var(--surface)]/22 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {player.name}
                        {player.id === currentUserId ? ' (You)' : ''}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        Attempts {status?.attemptCount ?? 0} / {maxAttempts}
                        {status?.solved ? ' • Solved' : status?.finished ? ' • Finished' : ' • Guessing'}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--primary-400)]">
                      {scores[player.id] ?? 0} pts
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              <IconTrophy />
              Leaderboard
            </h3>
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.playerId}
                  className="flex items-center justify-between border border-[var(--border)]/55 bg-[var(--surface)]/22 px-4 py-3"
                >
                  <p className="text-sm text-[var(--text-primary)]">
                    <span className="font-mono text-[var(--text-tertiary)]">#{entry.rank}</span>{' '}
                    {players.find((player) => player.id === entry.playerId)?.name ?? entry.playerId}
                  </p>
                  <p className="text-sm font-semibold text-[var(--primary-400)]">{entry.score} pts</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.section>
  )
}
