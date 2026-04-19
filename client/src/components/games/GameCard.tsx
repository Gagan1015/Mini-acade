'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import type { GameInfo } from '@/lib/games'
import { GameIcon } from '@/components/ui/GameIcons'

function IconUsers({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

interface GameCardProps {
  game: GameInfo
  index: number
  featured?: boolean
  compact?: boolean
}

function SkribbleGamePreview({ color }: { color: string }) {
  return (
    <motion.div
      className="relative z-10 mt-8 overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--marketing-shadow)]"
      variants={{
        rest: { y: 0 },
        hover: { y: -4 },
      }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      <svg viewBox="0 0 560 300" className="h-full min-h-[270px] w-full" aria-hidden="true">
        <defs>
          <pattern id="skribble-preview-grid" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M18 0H0V18" fill="none" stroke="currentColor" strokeOpacity="0.055" strokeWidth="1" />
          </pattern>
        </defs>

        <rect width="560" height="300" fill="var(--marketing-card-bg)" />
        <rect x="18" y="18" width="524" height="34" rx="8" fill="var(--background)" stroke="var(--border)" />
        <text x="34" y="40" fill="var(--text-tertiary)" fontFamily="var(--font-mono)" fontSize="11" fontWeight="600">
          drawing
        </text>
        {['_', '_', 't', '_', '_'].map((letter, letterIndex) => (
          <motion.g
            key={`${letter}-${letterIndex}`}
            initial={{ opacity: letter === 't' ? 1 : 0.42 }}
            animate={{ opacity: letter === 't' ? [0.55, 1, 0.55] : 0.42 }}
            transition={{ duration: 2.8, repeat: Infinity, delay: letterIndex * 0.08 }}
          >
            <text
              x={228 + letterIndex * 22}
              y="40"
              fill={letter === 't' ? color : 'var(--text-tertiary)'}
              fontFamily="var(--font-mono)"
              fontSize="16"
              fontWeight="700"
              textAnchor="middle"
            >
              {letter}
            </text>
          </motion.g>
        ))}
        <rect x="476" y="25" width="48" height="20" rx="10" fill={color} fillOpacity="0.1" stroke={color} strokeOpacity="0.24" />
        <text x="500" y="39" fill={color} fontFamily="var(--font-mono)" fontSize="10" fontWeight="700" textAnchor="middle">
          38s
        </text>

        <rect x="18" y="66" width="346" height="182" rx="12" fill="var(--background)" stroke="var(--border)" />
        <rect x="26" y="74" width="330" height="166" rx="8" fill="url(#skribble-preview-grid)" />

        <motion.path
          d="M132 168C132 130 156 100 190 100C224 100 248 130 248 168C248 199 226 212 190 212C154 212 132 199 132 168Z"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1] }}
          transition={{ duration: 3.8, repeat: Infinity, times: [0, 0.72, 1], ease: [0.25, 1, 0.5, 1] }}
        />
        <motion.path
          d="M160 108L145 78L178 98M220 98L239 78L234 114"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1] }}
          transition={{ duration: 3.8, repeat: Infinity, delay: 0.35, times: [0, 0.72, 1], ease: [0.25, 1, 0.5, 1] }}
        />
        <motion.path
          d="M170 158H171M212 158H213M178 178C186 186 198 186 206 178M150 174H112M154 186H116M230 174H268M226 186H264"
          fill="none"
          stroke="var(--text-primary)"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.76 }}
          animate={{ pathLength: [0, 1, 1], opacity: [0.55, 0.82, 0.55] }}
          transition={{ duration: 3.8, repeat: Infinity, delay: 0.75, times: [0, 0.72, 1], ease: [0.25, 1, 0.5, 1] }}
        />

        <motion.g
          animate={{
            x: [0, 34, 82, 108, 96],
            y: [0, -54, -78, -34, 8],
            rotate: [-12, -4, 8, 14, -8],
          }}
          transition={{ duration: 3.8, repeat: Infinity, ease: [0.25, 1, 0.5, 1] }}
        >
          <path d="M286 202L303 167L314 175L292 206Z" fill="var(--background)" stroke="var(--text-primary)" strokeWidth="2" />
          <path d="M303 167L310 154L323 164L314 175Z" fill={color} />
          <circle cx="289" cy="205" r="4" fill={color} />
        </motion.g>

        <rect x="18" y="259" width="346" height="22" rx="11" fill="var(--background)" stroke="var(--border)" />
        {['#242424', color, '#3B82F6', '#10B981', '#F59E0B'].map((swatch, swatchIndex) => (
          <motion.circle
            key={swatch}
            cx={42 + swatchIndex * 28}
            cy="270"
            r="6"
            fill={swatch}
            variants={{
              rest: { y: 0, scale: swatchIndex === 1 ? 1.12 : 1 },
              hover: { y: swatchIndex === 1 ? -2 : 0, scale: swatchIndex === 1 ? 1.28 : 1.04 },
            }}
            transition={{ duration: 0.2 }}
          />
        ))}
        <path d="M302 266H340" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
        <path d="M302 274H326" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />

        <rect x="382" y="66" width="160" height="215" rx="12" fill="var(--background)" stroke="var(--border)" />
        <text x="400" y="91" fill="var(--text-primary)" fontFamily="var(--font-sans)" fontSize="13" fontWeight="700">
          live guesses
        </text>
        {[
          { name: 'Mina', text: 'cat?', y: 116, active: false },
          { name: 'Dev', text: 'kitten', y: 146, active: true },
          { name: 'You', text: 'almost', y: 176, active: false },
        ].map((guess, guessIndex) => (
          <motion.g
            key={guess.name}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: [0, 1, 1], x: [10, 0, 0] }}
            transition={{
              duration: 3.8,
              repeat: Infinity,
              delay: 0.55 + guessIndex * 0.42,
              times: [0, 0.18, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <rect
              x="398"
              y={guess.y - 18}
              width={guess.active ? 92 : 76}
              height="22"
              rx="11"
              fill={guess.active ? color : 'var(--surface)'}
              fillOpacity={guess.active ? 0.13 : 1}
              stroke="var(--border)"
            />
            <text x="411" y={guess.y - 3} fill={guess.active ? color : 'var(--text-secondary)'} fontFamily="var(--font-sans)" fontSize="11" fontWeight="600">
              {guess.text}
            </text>
          </motion.g>
        ))}
        <motion.rect
          x="398"
          y="250"
          width="118"
          height="14"
          rx="7"
          fill={color}
          fillOpacity="0.12"
          variants={{
            rest: { opacity: 0.5 },
            hover: { opacity: 1 },
          }}
        />
      </svg>
    </motion.div>
  )
}

function WordelGamePreview({ color }: { color: string }) {
  const guess = 'FLAME'
  const results = ['absent', 'correct', 'present', 'absent', 'correct']
  const keyboard = ['Q', 'W', 'F', 'L', 'A', 'M', 'E', 'ENTER']
  const cycleDuration = 6

  const resultFill = (result: string) => {
    if (result === 'correct') return color
    if (result === 'present') return '#b59f3b'
    return '#3a3a3c'
  }

  return (
    <motion.div
      className="relative z-10 mt-6 overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--marketing-shadow)]"
      variants={{
        rest: { y: 0 },
        hover: { y: -3 },
      }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <svg viewBox="0 0 430 210" className="h-full min-h-[170px] w-full" aria-hidden="true">
        <rect width="430" height="210" fill="var(--marketing-card-bg)" />
        <rect x="16" y="14" width="398" height="34" rx="10" fill="var(--background)" stroke="var(--border)" />
        <text x="32" y="36" fill="var(--text-primary)" fontFamily="var(--font-display)" fontSize="13" fontWeight="700">
          Wordel
        </text>
        <text x="99" y="35" fill="var(--text-tertiary)" fontFamily="var(--font-mono)" fontSize="9" fontWeight="700">
          attempt 3 / 6
        </text>
        <motion.g
          animate={{ opacity: [0, 0, 1, 1, 0] }}
          transition={{ duration: cycleDuration, repeat: Infinity, times: [0, 0.36, 0.42, 0.9, 1] }}
        >
          <rect x="304" y="22" width="84" height="18" rx="9" fill={color} fillOpacity="0.1" stroke={color} strokeOpacity="0.2" />
          <text x="346" y="35" fill={color} fontFamily="var(--font-mono)" fontSize="9" fontWeight="700" textAnchor="middle">
            checked
          </text>
        </motion.g>

        <g transform="translate(98 72)">
          {guess.split('').map((letter, tileIndex) => {
            const typeStart = 0.12 + tileIndex * 0.065
            const flipStart = 0.48 + tileIndex * 0.075
            const revealStart = 0.53 + tileIndex * 0.075
            const fill = resultFill(results[tileIndex])

            return (
              <motion.g
                key={`${letter}-${tileIndex}`}
                style={{ transformOrigin: `${tileIndex * 46 + 18}px 18px` }}
                animate={{
                  scale: [1, 1, 1.08, 1, 1, 1],
                  rotateX: [0, 0, 0, 0, 180, 360],
                }}
                transition={{
                  duration: cycleDuration,
                  repeat: Infinity,
                  times: [0, typeStart, typeStart + 0.035, 0.46, flipStart, Math.min(flipStart + 0.11, 1)],
                  ease: [0.45, 0, 0.55, 1],
                }}
              >
                <motion.rect
                  x={tileIndex * 46}
                  y="0"
                  width="36"
                  height="36"
                  rx="6"
                  strokeWidth="2"
                  animate={{
                    fill: ['var(--background)', 'var(--background)', fill, fill, 'var(--background)'],
                    stroke: ['var(--border)', 'var(--border)', fill, fill, 'var(--border)'],
                  }}
                  transition={{
                    duration: cycleDuration,
                    repeat: Infinity,
                    times: [0, Math.min(revealStart - 0.05, 0.9), Math.min(revealStart, 0.92), 0.92, 1],
                    ease: [0.45, 0, 0.55, 1],
                  }}
                />
                <motion.text
                  x={tileIndex * 46 + 18}
                  y="24"
                  fontFamily="var(--font-display)"
                  fontSize="17"
                  fontWeight="700"
                  textAnchor="middle"
                  animate={{
                    opacity: [0, 0, 1, 1, 1],
                    fill: ['var(--text-primary)', 'var(--text-primary)', 'var(--text-primary)', 'var(--text-inverse)', 'var(--text-inverse)', 'var(--text-primary)'],
                  }}
                  transition={{
                    duration: cycleDuration,
                    repeat: Infinity,
                    times: [0, typeStart, typeStart + 0.025, Math.min(revealStart, 0.92), 0.94],
                    ease: [0.25, 1, 0.5, 1],
                  }}
                >
                  {letter}
                </motion.text>
              </motion.g>
            )
          })}
        </g>

        <motion.g
          animate={{ opacity: [0, 0, 1, 1, 0], x: [-5, -5, 0, 0, -5] }}
          transition={{ duration: cycleDuration, repeat: Infinity, times: [0, 0.34, 0.4, 0.48, 0.56] }}
        >
          <rect x="157" y="124" width="116" height="20" rx="10" fill="var(--background)" stroke="var(--border)" />
          <text x="215" y="138" fill="var(--text-tertiary)" fontFamily="var(--font-mono)" fontSize="9" fontWeight="700" textAnchor="middle">
            checking word
          </text>
        </motion.g>

        <rect x="16" y="168" width="398" height="28" rx="10" fill="var(--background)" stroke="var(--border)" />
        <text x="32" y="186" fill="var(--text-tertiary)" fontFamily="var(--font-mono)" fontSize="8" fontWeight="700">
          keyboard
        </text>
        {keyboard.map((keyItem, keyIndex) => {
          const resultIndex = guess.indexOf(keyItem)
          const tone = resultIndex === -1 ? 'var(--text-primary)' : resultFill(results[resultIndex])
          const isLong = keyItem.length > 1
          const x = [99, 127, 155, 183, 211, 239, 267, 328][keyIndex]

          return (
          <motion.g
            key={keyItem}
            variants={{
              rest: { y: 0 },
              hover: { y: resultIndex !== -1 ? -2 : 0 },
            }}
            transition={{ duration: 0.18, delay: keyIndex * 0.015 }}
          >
            <rect
              x={x - (isLong ? 22 : 10)}
              y="177"
              width={isLong ? 44 : 20}
              height="12"
              rx="6"
              fill={tone}
              fillOpacity={resultIndex !== -1 ? 0.2 : 0.1}
            />
            <text
              x={x}
              y="186"
              fill={tone}
              fontFamily="var(--font-mono)"
              fontSize="7"
              fontWeight="700"
              textAnchor="middle"
            >
              {keyItem.toLowerCase()}
            </text>
          </motion.g>
          )
        })}
      </svg>
    </motion.div>
  )
}

function FlagelGamePreview({ color }: { color: string }) {
  const cycleDuration = 5.8
  const panels = Array.from({ length: 6 }, (_, index) => index)
  const revealedPanelCount = 6
  const guesses = [
    { label: 'France', value: '9,713 km', arrow: 'NE', percent: '42%', tone: 'var(--text-tertiary)' },
    { label: 'Japan', value: '0 km', arrow: '✓', percent: '100%', tone: color },
  ]

  return (
    <motion.div
      className="relative z-10 mt-6 overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--marketing-shadow)]"
      variants={{
        rest: { y: 0 },
        hover: { y: -3 },
      }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <svg viewBox="0 0 560 210" className="h-full min-h-[170px] w-full" aria-hidden="true">
        <defs>
          <clipPath id="flagel-preview-flag-clip">
            <rect x="0" y="0" width="198" height="96" rx="10" />
          </clipPath>
        </defs>
        <rect width="560" height="210" fill="var(--marketing-card-bg)" />
        <rect x="18" y="16" width="524" height="30" rx="10" fill="var(--background)" stroke="var(--border)" />
        <text x="34" y="36" fill="var(--text-primary)" fontFamily="var(--font-display)" fontSize="13" fontWeight="700">
          Flagel
        </text>
        <text x="94" y="35" fill="var(--text-tertiary)" fontFamily="var(--font-mono)" fontSize="9" fontWeight="700">
          reveal 6 / 6
        </text>
        <motion.g
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: [0.25, 1, 0.5, 1] }}
        >
          <rect x="428" y="22" width="84" height="16" rx="8" fill={color} fillOpacity="0.1" stroke={color} strokeOpacity="0.22" />
          <text x="470" y="34" fill={color} fontFamily="var(--font-mono)" fontSize="9" fontWeight="700" textAnchor="middle">
            solved
          </text>
        </motion.g>

        <g transform="translate(44 68)">
          <rect x="-12" y="-12" width="222" height="120" rx="16" fill="var(--background)" stroke="var(--border)" />
          <g clipPath="url(#flagel-preview-flag-clip)">
            <rect width="198" height="96" fill="#ffffff" />
            <circle cx="99" cy="48" r="27" fill="#EF4444" />
            <path d="M0 0H198V96H0Z" fill="none" stroke="var(--border)" />
            {panels.map((panelIndex) => {
              const col = panelIndex % 3
              const row = Math.floor(panelIndex / 3)
              const x = col * 66
              const y = row * 48
              const isHidden = panelIndex >= revealedPanelCount

              return (
                <motion.g
                  key={panelIndex}
                  style={{ transformOrigin: `${x + 33}px ${y + 24}px` }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                >
                  {isHidden && (
                    <>
                      <rect x={x} y={y} width="66" height="48" fill="var(--background)" />
                      <rect x={x + 2} y={y + 2} width="62" height="44" rx="8" fill="var(--text-primary)" fillOpacity="0.9" />
                      <path d={`M${x + 14} ${y + 15}H${x + 52}M${x + 14} ${y + 25}H${x + 45}M${x + 14} ${y + 35}H${x + 36}`} stroke="var(--background)" strokeOpacity="0.28" strokeWidth="2.2" strokeLinecap="round" />
                    </>
                  )}
                </motion.g>
              )
            })}
          </g>
        </g>

        <g transform="translate(298 68)">
          <rect x="0" y="0" width="218" height="40" rx="11" fill="var(--background)" stroke="var(--border)" />
          <text x="18" y="25" fill="var(--text-tertiary)" fontFamily="var(--font-mono)" fontSize="9" fontWeight="700">
            country
          </text>
          {'JAPAN'.split('').map((letter, letterIndex) => {
            const typeStart = 0.08 + letterIndex * 0.055
            return (
              <motion.text
                key={`${letter}-${letterIndex}`}
                x={88 + letterIndex * 16}
                y="26"
                fill="var(--text-primary)"
                fontFamily="var(--font-display)"
                fontSize="14"
                fontWeight="700"
                textAnchor="middle"
                animate={{ opacity: [0, 0, 1, 1, 0] }}
                transition={{
                  duration: cycleDuration,
                  repeat: Infinity,
                  times: [0, typeStart, typeStart + 0.025, 0.82, 1],
                  ease: [0.25, 1, 0.5, 1],
                }}
              >
                {letter}
              </motion.text>
            )
          })}

          <motion.g
            animate={{ opacity: [0.72, 1, 1, 0.72], y: [2, 0, 0, 2] }}
            transition={{ duration: cycleDuration, repeat: Infinity, times: [0, 0.28, 0.78, 1], ease: [0.22, 1, 0.36, 1] }}
          >
            <rect x="0" y="54" width="218" height="58" rx="12" fill="var(--background)" stroke="var(--border)" />
            {guesses.map((guess, guessIndex) => (
              <g key={guess.label} transform={`translate(14 ${74 + guessIndex * 24})`}>
                <text x="0" y="0" fill={guess.tone} fontFamily="var(--font-sans)" fontSize="11" fontWeight="700">
                  {guess.label}
                </text>
                <text x="78" y="0" fill="var(--text-secondary)" fontFamily="var(--font-mono)" fontSize="10" fontWeight="700">
                  {guess.value}
                </text>
                <rect x="135" y="-13" width="28" height="18" rx="9" fill={guess.tone} fillOpacity={guessIndex === 1 ? 0.15 : 0.08} />
                <text x="149" y="0" fill={guess.tone} fontFamily="var(--font-mono)" fontSize="9" fontWeight="800" textAnchor="middle">
                  {guess.arrow}
                </text>
                <rect x="170" y="-13" width="36" height="18" rx="9" fill={guess.tone} fillOpacity={guessIndex === 1 ? 0.15 : 0.08} />
                <text x="188" y="0" fill={guess.tone} fontFamily="var(--font-mono)" fontSize="9" fontWeight="800" textAnchor="middle">
                  {guess.percent}
                </text>
              </g>
            ))}
          </motion.g>

          <motion.path
            d="M172 29L181 37L200 17"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 0, 1, 1, 0] }}
            transition={{ duration: cycleDuration, repeat: Infinity, times: [0, 0.42, 0.52, 0.82, 1], ease: [0.25, 1, 0.5, 1] }}
          />
        </g>

      </svg>
    </motion.div>
  )
}

function GamePreview({ game }: { game: GameInfo }) {
  if (game.id === 'skribble') {
    return <SkribbleGamePreview color={game.colorHex} />
  }

  if (game.id === 'wordel') {
    return <WordelGamePreview color={game.colorHex} />
  }

  if (game.id === 'flagel') {
    return <FlagelGamePreview color={game.colorHex} />
  }

  return null
}

export function GameCard({ game, index, featured = false, compact = false }: GameCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        ease: [0, 0, 0.2, 1],
      }}
      className="group h-full"
    >
      <Link href={`/lobby?game=${game.id}`} className="block h-full">
        <motion.div
          initial="rest"
          whileHover="hover"
          whileFocus="hover"
          className={`marketing-card relative flex h-full min-h-[280px] flex-col overflow-hidden transition-transform duration-300 group-hover:-translate-y-1 ${
            featured ? 'p-8 lg:min-h-[472px]' : compact ? 'p-5' : 'p-6'
          }`}
          style={{
            boxShadow: featured
              ? `var(--marketing-shadow-strong), inset 0 0 0 1px ${game.colorHex}14`
              : undefined,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at 18% 12%, ${game.colorHex}18, transparent 34%)`,
            }}
          />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div
              className={`flex shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] transition-transform duration-300 group-hover:scale-[1.04] ${
                featured ? 'h-16 w-16' : 'h-14 w-14'
              }`}
              style={{ backgroundColor: `${game.colorHex}10`, color: game.colorHex }}
            >
              <GameIcon gameId={game.id} size={featured ? 34 : 30} color={game.colorHex} animated />
            </div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              0{index + 1}
            </span>
          </div>

          <div className={`relative z-10 ${featured ? 'mt-10 max-w-md' : 'mt-6'}`}>
            <h3 className={`font-display font-bold tracking-tight text-[var(--text-primary)] ${featured ? 'text-4xl' : 'text-2xl'}`}>
              {game.name}
            </h3>
            <p className={`${featured ? 'mt-4 text-base leading-8' : 'mt-3 text-sm leading-7'} text-[var(--text-secondary)]`}>
              {game.description}
            </p>
          </div>

          <div className={`relative z-10 flex flex-wrap gap-2 ${featured ? 'mt-7 max-w-lg' : 'mt-5'}`}>
            {game.features.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)]"
              >
                {feature}
              </span>
            ))}
          </div>

          {(featured || game.id === 'wordel' || game.id === 'flagel') && <GamePreview game={game} />}

          <div className="relative z-10 mt-auto flex items-center justify-between border-t border-[var(--border)] pt-6">
            <span className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <IconUsers size={14} />
              {game.minPlayers}-{game.maxPlayers} players
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold text-[var(--text-primary)] transition-transform duration-300 group-hover:translate-x-1">
              Play now
              <IconArrowRight size={14} />
            </span>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
