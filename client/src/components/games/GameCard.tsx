'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import type { GameInfo } from '@/lib/games'
import { GameIcon } from '@/components/ui/GameIcons'

function IconUsers({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
            <path
              d="M18 0H0V18"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.055"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect width="560" height="300" fill="var(--marketing-card-bg)" />
        <rect
          x="18"
          y="18"
          width="524"
          height="34"
          rx="8"
          fill="var(--background)"
          stroke="var(--border)"
        />
        <text
          x="34"
          y="40"
          fill="var(--text-tertiary)"
          fontFamily="var(--font-mono)"
          fontSize="11"
          fontWeight="600"
        >
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
        <rect
          x="476"
          y="25"
          width="48"
          height="20"
          rx="10"
          fill={color}
          fillOpacity="0.1"
          stroke={color}
          strokeOpacity="0.24"
        />
        <text
          x="500"
          y="39"
          fill={color}
          fontFamily="var(--font-mono)"
          fontSize="10"
          fontWeight="700"
          textAnchor="middle"
        >
          38s
        </text>

        <rect
          x="18"
          y="66"
          width="346"
          height="182"
          rx="12"
          fill="var(--background)"
          stroke="var(--border)"
        />
        <rect x="26" y="74" width="330" height="166" rx="8" fill="url(#skribble-preview-grid)" />

        <motion.path
          d="M132 168C132 130 156 100 190 100C224 100 248 130 248 168C248 199 226 212 190 212C154 212 132 199 132 168Z"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1] }}
          transition={{
            duration: 3.8,
            repeat: Infinity,
            times: [0, 0.72, 1],
            ease: [0.25, 1, 0.5, 1],
          }}
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
          transition={{
            duration: 3.8,
            repeat: Infinity,
            delay: 0.35,
            times: [0, 0.72, 1],
            ease: [0.25, 1, 0.5, 1],
          }}
        />
        <motion.path
          d="M170 158H171M212 158H213M178 178C186 186 198 186 206 178M150 174H112M154 186H116M230 174H268M226 186H264"
          fill="none"
          stroke="var(--text-primary)"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.76 }}
          animate={{ pathLength: [0, 1, 1], opacity: [0.55, 0.82, 0.55] }}
          transition={{
            duration: 3.8,
            repeat: Infinity,
            delay: 0.75,
            times: [0, 0.72, 1],
            ease: [0.25, 1, 0.5, 1],
          }}
        />

        <motion.g
          animate={{
            x: [0, 34, 82, 108, 96],
            y: [0, -54, -78, -34, 8],
            rotate: [-12, -4, 8, 14, -8],
          }}
          transition={{ duration: 3.8, repeat: Infinity, ease: [0.25, 1, 0.5, 1] }}
        >
          <path
            d="M286 202L303 167L314 175L292 206Z"
            fill="var(--background)"
            stroke="var(--text-primary)"
            strokeWidth="2"
          />
          <path d="M303 167L310 154L323 164L314 175Z" fill={color} />
          <circle cx="289" cy="205" r="4" fill={color} />
        </motion.g>

        <rect
          x="18"
          y="259"
          width="346"
          height="22"
          rx="11"
          fill="var(--background)"
          stroke="var(--border)"
        />
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

        <rect
          x="382"
          y="66"
          width="160"
          height="215"
          rx="12"
          fill="var(--background)"
          stroke="var(--border)"
        />
        <text
          x="400"
          y="91"
          fill="var(--text-primary)"
          fontFamily="var(--font-sans)"
          fontSize="13"
          fontWeight="700"
        >
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
            <text
              x="411"
              y={guess.y - 3}
              fill={guess.active ? color : 'var(--text-secondary)'}
              fontFamily="var(--font-sans)"
              fontSize="11"
              fontWeight="600"
            >
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
        <rect
          x="16"
          y="14"
          width="398"
          height="34"
          rx="10"
          fill="var(--background)"
          stroke="var(--border)"
        />
        <text
          x="32"
          y="36"
          fill="var(--text-primary)"
          fontFamily="var(--font-display)"
          fontSize="13"
          fontWeight="700"
        >
          Wordel
        </text>
        <text
          x="99"
          y="35"
          fill="var(--text-tertiary)"
          fontFamily="var(--font-mono)"
          fontSize="9"
          fontWeight="700"
        >
          attempt 3 / 6
        </text>
        <motion.g
          animate={{ opacity: [0, 0, 1, 1, 0] }}
          transition={{ duration: cycleDuration, repeat: Infinity, times: [0, 0.36, 0.42, 0.9, 1] }}
        >
          <rect
            x="304"
            y="22"
            width="84"
            height="18"
            rx="9"
            fill={color}
            fillOpacity="0.1"
            stroke={color}
            strokeOpacity="0.2"
          />
          <text
            x="346"
            y="35"
            fill={color}
            fontFamily="var(--font-mono)"
            fontSize="9"
            fontWeight="700"
            textAnchor="middle"
          >
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
                  times: [
                    0,
                    typeStart,
                    typeStart + 0.035,
                    0.46,
                    flipStart,
                    Math.min(flipStart + 0.11, 1),
                  ],
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
                    fill: [
                      'var(--background)',
                      'var(--background)',
                      fill,
                      fill,
                      'var(--background)',
                    ],
                    stroke: ['var(--border)', 'var(--border)', fill, fill, 'var(--border)'],
                  }}
                  transition={{
                    duration: cycleDuration,
                    repeat: Infinity,
                    times: [
                      0,
                      Math.min(revealStart - 0.05, 0.9),
                      Math.min(revealStart, 0.92),
                      0.92,
                      1,
                    ],
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
                    fill: [
                      'var(--text-primary)',
                      'var(--text-primary)',
                      'var(--text-primary)',
                      'var(--text-inverse)',
                      'var(--text-inverse)',
                      'var(--text-primary)',
                    ],
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
          transition={{
            duration: cycleDuration,
            repeat: Infinity,
            times: [0, 0.34, 0.4, 0.48, 0.56],
          }}
        >
          <rect
            x="157"
            y="124"
            width="116"
            height="20"
            rx="10"
            fill="var(--background)"
            stroke="var(--border)"
          />
          <text
            x="215"
            y="138"
            fill="var(--text-tertiary)"
            fontFamily="var(--font-mono)"
            fontSize="9"
            fontWeight="700"
            textAnchor="middle"
          >
            checking word
          </text>
        </motion.g>

        <rect
          x="16"
          y="168"
          width="398"
          height="28"
          rx="10"
          fill="var(--background)"
          stroke="var(--border)"
        />
        <text
          x="32"
          y="186"
          fill="var(--text-tertiary)"
          fontFamily="var(--font-mono)"
          fontSize="8"
          fontWeight="700"
        >
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
  const dur = 6.4

  const flagW = 164
  const flagH = 82
  const tileC = 3
  const tileR = 2
  const tileW = flagW / tileC
  const tileH = flagH / tileR

  const guesses = [
    { name: 'France', km: '9,713 km', dir: '↗', pct: 42 },
    { name: 'Japan', km: '0 km', dir: '◎', pct: 100 },
  ]

  const pctFill = (p: number) => {
    if (p >= 85) return '#34d399'
    if (p >= 35) return '#a5b4fc'
    return '#94a3b8'
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
      <svg viewBox="0 0 560 130" className="h-full min-h-[120px] w-full" aria-hidden="true">
        <defs>
          <clipPath id="fp-flag"><rect width={flagW} height={flagH} rx="8" /></clipPath>
        </defs>

        <rect width="560" height="130" fill="var(--marketing-card-bg)" />

        {/* ───── Flag area (left) ───── */}
        <g transform="translate(24 14)">
          {/* Container */}
          <rect x="-8" y="-8" width={flagW + 16} height={flagH + 16}
            rx="12" fill="var(--background)" stroke="var(--border)" strokeWidth="0.5" />

          {/* Flag with tile reveal */}
          <g clipPath="url(#fp-flag)">
            <rect width={flagW} height={flagH} fill="#ffffff" />
            <circle cx={flagW / 2} cy={flagH / 2} r={flagH * 0.29} fill="#BC002D" />

            {/* Tile covers */}
            {Array.from({ length: tileC * tileR }, (_, i) => {
              const cx = (i % tileC) * tileW
              const cy = Math.floor(i / tileC) * tileH
              const reveal = 0.06 + i * 0.052

              return (
                <motion.rect
                  key={`cover-${i}`}
                  x={cx} y={cy} width={tileW} height={tileH}
                  fill="var(--surface-hover)"
                  animate={{ opacity: [1, 1, 0, 0, 0, 1] }}
                  transition={{
                    duration: dur, repeat: Infinity,
                    times: [0, reveal, reveal + 0.045, 0.88, 0.94, 1],
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              )
            })}

            {/* Grid lines — fade out on merge */}
            <motion.g
              animate={{ opacity: [0.5, 0.5, 0, 0, 0.5] }}
              transition={{
                duration: dur, repeat: Infinity,
                times: [0, 0.36, 0.42, 0.88, 1],
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <line x1={tileW} y1="0" x2={tileW} y2={flagH}
                stroke="var(--border)" strokeWidth="0.5" />
              <line x1={tileW * 2} y1="0" x2={tileW * 2} y2={flagH}
                stroke="var(--border)" strokeWidth="0.5" />
              <line x1="0" y1={tileH} x2={flagW} y2={tileH}
                stroke="var(--border)" strokeWidth="0.5" />
            </motion.g>
          </g>
        </g>

        {/* ───── Right panel ───── */}
        <g transform="translate(220 14)">
          {/* Search input */}
          <rect x="0" y="0" width="316" height="30" rx="10"
            fill="var(--background)" stroke="var(--border)" strokeWidth="0.5" />
          {/* Search icon */}
          <g transform="translate(11 9)" stroke="var(--text-tertiary)" strokeWidth="1.5" fill="none">
            <circle cx="4.5" cy="4.5" r="4" />
            <line x1="7.3" y1="7.3" x2="10" y2="10" />
          </g>
          <text x="27" y="19" fill="var(--text-tertiary)"
            fontFamily="var(--font-mono)" fontSize="9" fontWeight="600">
            country
          </text>

          {/* Typing animation */}
          {'JAPAN'.split('').map((ch, ci) => {
            const t = 0.16 + ci * 0.035
            return (
              <motion.text
                key={`ch-${ci}`}
                x={82 + ci * 13} y="19"
                fill="var(--text-primary)" fontFamily="var(--font-display)"
                fontSize="12" fontWeight="700" textAnchor="middle"
                animate={{ opacity: [0, 0, 1, 1, 0] }}
                transition={{
                  duration: dur, repeat: Infinity,
                  times: [0, t, t + 0.018, 0.86, 0.94],
                  ease: [0.25, 1, 0.5, 1],
                }}
              >
                {ch}
              </motion.text>
            )
          })}

          {/* Cursor blink */}
          <motion.rect
            x="148" y="10" width="1" height="11" rx="0.5" fill={color}
            animate={{ opacity: [0, 0, 1, 0, 1, 0, 0] }}
            transition={{ duration: dur, repeat: Infinity,
              times: [0, 0.15, 0.16, 0.28, 0.29, 0.42, 1] }}
          />

          {/* Guess rows */}
          {guesses.map((g, gi) => {
            const ry = 38 + gi * 30
            const isWin = g.pct === 100
            const t0 = 0.22 + gi * 0.08

            return (
              <motion.g
                key={g.name}
                animate={{ opacity: [0, 0, 1, 1, 0], y: [4, 4, 0, 0, 4] }}
                transition={{
                  duration: dur, repeat: Infinity,
                  times: [0, t0, t0 + 0.035, 0.86, 0.94],
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <rect x="0" y={ry} width="316" height="24" rx="7"
                  fill={isWin ? `${color}06` : 'var(--background)'}
                  stroke={isWin ? `${color}22` : 'var(--border)'}
                  strokeWidth="0.5" />

                <text x="10" y={ry + 16}
                  fill={isWin ? color : 'var(--text-primary)'}
                  fontFamily="var(--font-sans)" fontSize="11" fontWeight="700">
                  {g.name}
                </text>

                <text x="80" y={ry + 16}
                  fill="var(--text-secondary)"
                  fontFamily="var(--font-mono)" fontSize="9" fontWeight="600">
                  {g.km}
                </text>

                <rect x="200" y={ry + 3} width="24" height="18" rx="9"
                  fill={isWin ? `${color}14` : 'var(--surface-hover)'} />
                <text x="212" y={ry + 16}
                  fill={isWin ? color : 'var(--text-primary)'}
                  fontFamily="var(--font-mono)" fontSize="10" fontWeight="800"
                  textAnchor="middle">
                  {g.dir}
                </text>

                <rect x="232" y={ry + 3} width="38" height="18" rx="9"
                  fill={`${pctFill(g.pct)}14`} />
                <text x="251" y={ry + 16}
                  fill={pctFill(g.pct)}
                  fontFamily="var(--font-mono)" fontSize="9" fontWeight="800"
                  textAnchor="middle">
                  {g.pct}%
                </text>

                {isWin && (
                  <rect x="278" y={ry + 6} width="24" height="12" rx="6"
                    fill={color} fillOpacity="0.12" />
                )}
                {isWin && (
                  <text x="290" y={ry + 16} fill={color}
                    fontFamily="var(--font-mono)" fontSize="7" fontWeight="700"
                    textAnchor="middle">
                    ✓
                  </text>
                )}
              </motion.g>
            )
          })}
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
            <h3
              className={`font-display font-bold tracking-tight text-[var(--text-primary)] ${featured ? 'text-4xl' : 'text-2xl'}`}
            >
              {game.name}
            </h3>
            <p
              className={`${featured ? 'mt-4 text-base leading-8' : 'mt-3 text-sm leading-7'} text-[var(--text-secondary)]`}
            >
              {game.description}
            </p>
          </div>

          <div
            className={`relative z-10 flex flex-wrap gap-2 ${featured ? 'mt-7 max-w-lg' : 'mt-5'}`}
          >
            {game.features.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)]"
              >
                {feature}
              </span>
            ))}
          </div>

          {(featured || game.id === 'wordel' || game.id === 'flagel') && (
            <GamePreview game={game} />
          )}

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
