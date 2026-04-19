'use client'

import Link from 'next/link'
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
  isSolo?: boolean
  isHost?: boolean
  onSubmitGuess: (guess: string) => void
  onSkip: () => void
  onPlayAgain?: () => void
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

function IconSearch({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconRefresh({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

function IconArrowLeft({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function IconSkip({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
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

/**
 * Matches a country against the search string.
 * Returns a priority score (lower = better match) or -1 for no match.
 * This ensures the common name is preferred over the official name and aliases.
 */
function getCountryMatchPriority(country: FlagelCountry, normalizedSearch: string): number {
  if (!normalizedSearch) {
    return 0 // show all when no search
  }

  const normalizedName = normalizeCountryGuess(country.name)

  // Priority 1: Common name exact match
  if (normalizedName === normalizedSearch) {
    return 1
  }

  // Priority 2: Common name starts with search
  if (normalizedName.startsWith(normalizedSearch)) {
    return 2
  }

  // Priority 3: Common name contains search
  if (normalizedName.includes(normalizedSearch)) {
    return 3
  }

  // Priority 4: Code match
  const normalizedCode = normalizeCountryGuess(country.code)
  const normalizedAlpha3 = normalizeCountryGuess(country.alpha3Code)
  if (normalizedCode === normalizedSearch || normalizedAlpha3 === normalizedSearch) {
    return 4
  }

  // Priority 5: Official name starts with search
  const normalizedOfficial = normalizeCountryGuess(country.officialName)
  if (normalizedOfficial.startsWith(normalizedSearch)) {
    return 5
  }

  // Priority 6: Official name contains search
  if (normalizedOfficial.includes(normalizedSearch)) {
    return 6
  }

  // Priority 7: Alias match
  const aliasMatch = country.aliases.some(
    (alias) => normalizeCountryGuess(alias).includes(normalizedSearch)
  )
  if (aliasMatch) {
    return 7
  }

  return -1 // no match
}

function getAccuracyColor(percent: number) {
  if (percent >= 85) return { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', text: '#34d399' }
  if (percent >= 60) return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24' }
  if (percent >= 35) return { bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)', text: '#a5b4fc' }
  return { bg: 'rgba(148, 163, 184, 0.08)', border: 'rgba(148, 163, 184, 0.2)', text: '#94a3b8' }
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
  isSolo = false,
  isHost = false,
  onSubmitGuess,
  onSkip,
  onPlayAgain,
}: FlagelPlayAreaProps) {
  const [guess, setGuess] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [flagImageFailed, setFlagImageFailed] = useState(false)
  const [showWholeFlag, setShowWholeFlag] = useState(false)
  const [showResultPopup, setShowResultPopup] = useState(false)
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

  // ── Search: prioritize common name matches ──
  const matchingCountries = FLAGEL_COUNTRIES
    .map((country) => ({
      country,
      priority: getCountryMatchPriority(country, normalizedSearch),
    }))
    .filter((entry) => entry.priority >= 0)
    .sort((a, b) => a.priority - b.priority || a.country.name.localeCompare(b.country.name))
    .map((entry) => entry.country)

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

  const progressPercent = (usedAttempts / maxAttempts) * 100
  const showSoloResultModal = isSolo && (phase === 'roundEnd' || phase === 'gameEnd' || (finished && correctCountry))

  // Show result popup when game finishes in solo mode
  useEffect(() => {
    if (showSoloResultModal) {
      const delay = window.setTimeout(() => {
        setShowResultPopup(true)
      }, 1200)

      return () => window.clearTimeout(delay)
    } else {
      setShowResultPopup(false)
    }
  }, [showSoloResultModal])

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.35 }}
      className="mx-auto w-full max-w-[680px] space-y-5"
    >
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--game-flagel)]">
            Flagel
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-[28px]">
            Reveal the flag, name the country
          </h2>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[var(--text-secondary)]">
            Each guess flips over another part of the flag. Use the distance and arrow hints to home in on the answer.
          </p>
        </div>
        <div className="min-w-[148px] overflow-hidden rounded-2xl border border-[var(--border)]/80 bg-[var(--surface)] shadow-[var(--shadow-md)]">
          <div className="px-4 py-3 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--text-tertiary)]">
              Round {currentRound}/{totalRounds}
            </p>
            <p className="mt-1 text-base font-bold text-[var(--text-primary)]">
              Guess {currentGuessNumber} / {maxAttempts}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              {finished ? 'Round complete' : `${remainingAttempts} left`}
            </p>
          </div>
          {/* Mini progress bar */}
          <div className="h-1 w-full bg-[var(--border)]">
            <motion.div
              className="h-full bg-[var(--game-flagel)]"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* ── Flag Card ── */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
        <div className="p-3 sm:p-4">
          <div className="overflow-hidden rounded-xl border border-[var(--border)]/60">
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
              <div className="grid grid-cols-3 gap-[2px] overflow-hidden bg-[var(--border)]">
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
                        <div className="absolute inset-0 bg-[linear-gradient(145deg,var(--surface-hover),var(--surface))] [backface-visibility:hidden]" />
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

          {/* Tile counter */}
          <div className="mt-3 flex items-center justify-center gap-2">
            {Array.from({ length: FLAG_TILE_COUNT }, (_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-colors duration-300"
                style={{
                  maxWidth: '48px',
                  background: i < revealedTiles
                    ? 'var(--game-flagel)'
                    : 'var(--border)',
                }}
              />
            ))}
          </div>
          <p className="mt-2 text-center text-[12px] text-[var(--text-tertiary)]">
            {isFlagFullyRevealed
              ? 'The full flag is uncovered.'
              : `${revealedTiles} of ${FLAG_TILE_COUNT} panels revealed`}
          </p>
        </div>
      </div>

      {/* ── Input Area ── */}
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
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[var(--text-tertiary)]">
                  <IconSearch />
                </span>
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
                  placeholder="Search for a country..."
                  autoComplete="off"
                  disabled={phase !== 'playing' || finished}
                  role="combobox"
                  aria-expanded={isDropdownOpen}
                  aria-controls={listboxId}
                  aria-autocomplete="list"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3.5 pl-11 pr-12 text-[15px] text-[var(--text-primary)] shadow-[var(--shadow-sm)] outline-none transition-all duration-200 focus:border-[var(--game-flagel)] focus:shadow-[0_0_0_3px_rgba(245,158,11,0.15)] placeholder:text-[var(--text-tertiary)] disabled:cursor-not-allowed disabled:opacity-60"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--text-tertiary)]">
                  <IconChevronDown />
                </span>
              </div>

              <AnimatePresence>
                {isDropdownOpen && visibleCountries.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: reducedMotion ? 0 : 0.15 }}
                    id={listboxId}
                    role="listbox"
                    className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xl)] backdrop-blur-lg"
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
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-100 hover:bg-[var(--surface-hover)]"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                              {country.name}
                            </span>
                            {country.officialName !== country.name && (
                              <span className="mt-0.5 block truncate text-[11px] text-[var(--text-tertiary)]">
                                {country.officialName}
                              </span>
                            )}
                          </span>
                          <span className="flex-shrink-0 rounded-md border border-[var(--border)]/60 bg-[var(--surface-hover)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                            {country.code}
                          </span>
                        </button>
                      ))}
                    </div>
                    {matchingCountries.length > DROPDOWN_LIMIT && (
                      <div className="border-t border-[var(--border)]/60 px-3 py-2 text-center text-[11px] text-[var(--text-tertiary)]">
                        +{matchingCountries.length - DROPDOWN_LIMIT} more results
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={reducedMotion ? undefined : { scale: 1.02 }}
              whileTap={reducedMotion ? undefined : { scale: 0.97 }}
              type="submit"
              disabled={!canSubmit}
              className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 px-6 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(245,158,11,0.3)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <IconGlobe />
              Guess
            </motion.button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)]/60 bg-[var(--surface)]/60 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
            <IconGlobe size={14} />
            {visibleCountries.length > 0
              ? `Search across ${FLAGEL_COUNTRIES.length} countries and territories.`
              : 'No country matches that search yet.'}
          </div>
          <motion.button
            whileHover={reducedMotion ? undefined : { scale: 1.01 }}
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
            type="button"
            onClick={onSkip}
            disabled={phase !== 'playing' || finished}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)]/70 px-3.5 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconSkip size={12} />
            Skip
          </motion.button>
        </div>
      </div>

      {/* ── Answer Reveal ── */}
      <AnimatePresence>
        {correctCountry && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] shadow-[0_4px_20px_rgba(16,185,129,0.1)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/12 text-emerald-400">
                  <IconTarget size={18} />
                </span>
                <div>
                  <p className="text-[15px] font-bold text-[var(--text-primary)]">
                    {correctCountry}
                  </p>
                  <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-emerald-400/80">
                    {countryCode ?? 'Solved'}
                  </p>
                </div>
              </div>
              <div className="rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-medium text-emerald-400">
                {solved ? '✓ You found it!' : 'Flag fully revealed'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Guesses List ── */}
      <div className="space-y-2">
        {displayGuesses.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/40 px-5 py-8 text-center">
            <span className="text-2xl opacity-40">🌍</span>
            <p className="text-[13px] text-[var(--text-tertiary)]">
              Your guesses will appear here with distance, direction, and accuracy hints.
            </p>
          </div>
        ) : (
          displayGuesses.map((entry, i) => {
            const percent = entry.isCorrect ? 100 : getFlagelAccuracyPercent(entry.distance ?? 0)
            const accent = getAccuracyColor(percent)
            return (
              <motion.div
                key={`${entry.guess}-${entry.attemptsUsed}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.22, delay: i === 0 ? 0.05 : 0 }}
                className="grid items-center gap-2 rounded-xl border px-4 py-3 transition-colors sm:grid-cols-[minmax(0,1.5fr)_minmax(0,0.85fr)_72px_72px]"
                style={{
                  borderColor: entry.isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)',
                  background: entry.isCorrect ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface)',
                }}
              >
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {entry.guess}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                  <span className="text-[11px]">📍</span>
                  {entry.isCorrect ? '0 km' : `${(entry.distance ?? 0).toLocaleString()} km`}
                </div>
                <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                  <IconCompass size={13} />
                  <span>{entry.isCorrect ? '✓' : getDirectionArrow(entry.direction)}</span>
                </div>
                <div
                  className="flex items-center justify-center rounded-lg px-2 py-1.5 text-xs font-bold"
                  style={{
                    background: accent.bg,
                    border: `1px solid ${accent.border}`,
                    color: accent.text,
                  }}
                >
                  {percent}%
                </div>
              </motion.div>
            )
          })
        )}

        {/* Status bar */}
        <div className="overflow-hidden rounded-xl">
          <div
            className="px-4 py-2.5 text-center text-[13px] font-semibold uppercase tracking-[0.18em]"
            style={{
              background: finished
                ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))'
                : 'linear-gradient(135deg, var(--surface-hover), var(--surface))',
              color: finished ? '#34d399' : 'var(--text-secondary)',
              border: `1px solid ${finished ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
              borderRadius: '12px',
            }}
          >
            {finished ? '✓ Round complete' : `Guess ${currentGuessNumber} / ${maxAttempts}`}
          </div>
        </div>
      </div>

      {/* ── Multiplayer Panels ── */}
      {players.length > 1 && (
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Room Progress
            </h3>
            <div className="space-y-2">
              {players.map((player) => {
                const status = playerStatuses[player.id]
                const isYou = player.id === currentUserId
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-xl border px-4 py-3 transition-colors"
                    style={{
                      borderColor: isYou ? 'rgba(245, 158, 11, 0.2)' : 'var(--border)',
                      background: isYou ? 'rgba(245, 158, 11, 0.04)' : 'var(--surface)',
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {player.name}
                        {isYou && (
                          <span className="ml-1.5 rounded-md bg-[var(--game-flagel)]/15 px-1.5 py-0.5 text-[10px] font-medium text-[var(--game-flagel)]">
                            You
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        Attempts {status?.attemptCount ?? 0} / {maxAttempts}
                        {status?.solved ? ' • Solved ✓' : status?.finished ? ' • Finished' : ' • Guessing…'}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-[var(--game-flagel)]">
                      {scores[player.id] ?? 0} pts
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              <IconTrophy />
              Leaderboard
            </h3>
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.playerId}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                >
                  <p className="text-sm text-[var(--text-primary)]">
                    <span className="mr-1.5 rounded-md bg-[var(--surface-hover)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-tertiary)]">
                      #{entry.rank}
                    </span>
                    {players.find((player) => player.id === entry.playerId)?.name ?? entry.playerId}
                  </p>
                  <p className="text-sm font-bold text-[var(--game-flagel)]">{entry.score} pts</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Solo Result Popup Modal ── */}
      <AnimatePresence>
        {showResultPopup && isSolo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.55)' }}
            onClick={() => setShowResultPopup(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30, delay: 0.05 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_64px_rgba(0,0,0,0.3)]"
            >
              {/* Decorative top gradient bar */}
              <div
                className="h-1.5 w-full"
                style={{
                  background: solved
                    ? 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7)'
                    : 'linear-gradient(90deg, #f59e0b, #fbbf24, #fde68a)',
                }}
              />

              <div className="px-6 pb-7 pt-6 text-center">
                {/* Result icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, -8, 8, -4, 4, 0] }}
                  transition={{
                    scale: { type: 'spring', stiffness: 300, damping: 15, delay: 0.15 },
                    rotate: { duration: 0.7, ease: 'easeInOut', delay: 0.2 },
                  }}
                  className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full"
                  style={{
                    background: solved
                      ? 'linear-gradient(145deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'
                      : 'linear-gradient(145deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
                    border: `2px solid ${solved ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                  }}
                >
                  <span className="text-3xl">{solved ? '🎉' : '🏁'}</span>
                </motion.div>

                {/* Title */}
                <motion.h3
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold tracking-tight text-[var(--text-primary)]"
                >
                  {solved ? 'Correct!' : 'Round Complete'}
                </motion.h3>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="mt-1.5 text-sm text-[var(--text-secondary)]"
                >
                  {solved
                    ? `You identified the flag in ${usedAttempts} ${usedAttempts === 1 ? 'guess' : 'guesses'}!`
                    : 'Better luck next time!'}
                </motion.p>

                {/* Country card */}
                {correctCountry && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mx-auto mt-5 flex items-center gap-3 rounded-xl border px-4 py-3"
                    style={{
                      borderColor: solved ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)',
                      background: solved ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
                    }}
                  >
                    {shouldUseFlagImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={effectiveFlagImageUrl}
                        alt=""
                        className="h-8 w-12 rounded-md object-cover shadow-sm"
                        draggable={false}
                      />
                    )}
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-[15px] font-bold text-[var(--text-primary)]">
                        {correctCountry}
                      </p>
                      {countryCode && (
                        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                          {countryCode}
                        </p>
                      )}
                    </div>
                    <div
                      className="flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold"
                      style={{
                        background: solved ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.08)',
                        color: solved ? '#34d399' : '#94a3b8',
                      }}
                    >
                      {solved ? '✓' : '✗'}
                    </div>
                  </motion.div>
                )}

                {/* Stats row */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="mt-5 flex justify-center gap-6"
                >
                  <div className="text-center">
                    <p className="text-lg font-bold text-[var(--text-primary)]">{usedAttempts}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Guesses</p>
                  </div>
                  <div className="h-8 w-px bg-[var(--border)]" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-[var(--text-primary)]">{currentRound}/{totalRounds}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Round</p>
                  </div>
                  <div className="h-8 w-px bg-[var(--border)]" />
                  <div className="text-center">
                    <p className="text-lg font-bold" style={{ color: solved ? '#34d399' : '#94a3b8' }}>
                      {revealedTiles}/{FLAG_TILE_COUNT}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Tiles</p>
                  </div>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 flex gap-3"
                >
                  <Link
                    href="/lobby"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]"
                  >
                    <IconArrowLeft size={15} />
                    Lobby
                  </Link>
                  {isHost && onPlayAgain && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => {
                        setShowResultPopup(false)
                        onPlayAgain()
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(245,158,11,0.3)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)] cursor-pointer"
                      style={{
                        background: 'linear-gradient(to bottom, #f59e0b, #d97706)',
                      }}
                    >
                      <IconRefresh size={15} />
                      Play Again
                    </motion.button>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
