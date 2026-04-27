'use client'

import { useId } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import dynamic from 'next/dynamic'
import type { GameInfo } from '@/lib/games'
import { GameIcon } from '@/components/ui/GameIcons'

const World = dynamic(() => import('../ui/globe').then((m) => m.World), {
  ssr: false,
})

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

const flagelGlobeConfig = {
  pointSize: 4,
  globeColor: '#062056',
  showAtmosphere: true,
  atmosphereColor: '#FFFFFF',
  atmosphereAltitude: 0.1,
  emissive: '#062056',
  emissiveIntensity: 0.1,
  shininess: 0.9,
  polygonColor: 'rgba(255,255,255,0.7)',
  ambientLight: '#38bdf8',
  directionalLeftLight: '#ffffff',
  directionalTopLight: '#ffffff',
  pointLight: '#ffffff',
  arcTime: 1000,
  arcLength: 0.9,
  rings: 1,
  maxRings: 3,
  initialPosition: { lat: 22.3193, lng: 114.1694 },
  autoRotate: true,
  autoRotateSpeed: 0.5,
}

const flagelGlobeColors = ['#06b6d4', '#3b82f6', '#6366f1']

const flagelGlobeRoutes = [
  {
    order: 1,
    startLat: -19.885592,
    startLng: -43.951191,
    endLat: -22.9068,
    endLng: -43.1729,
    arcAlt: 0.1,
  },
  { order: 1, startLat: 28.6139, startLng: 77.209, endLat: 3.139, endLng: 101.6869, arcAlt: 0.2 },
  {
    order: 1,
    startLat: -19.885592,
    startLng: -43.951191,
    endLat: -1.303396,
    endLng: 36.852443,
    arcAlt: 0.5,
  },
  {
    order: 2,
    startLat: 1.3521,
    startLng: 103.8198,
    endLat: 35.6762,
    endLng: 139.6503,
    arcAlt: 0.2,
  },
  { order: 2, startLat: 51.5072, startLng: -0.1276, endLat: 3.139, endLng: 101.6869, arcAlt: 0.3 },
  {
    order: 2,
    startLat: -15.785493,
    startLng: -47.909029,
    endLat: 36.162809,
    endLng: -115.119411,
    arcAlt: 0.3,
  },
  {
    order: 3,
    startLat: -33.8688,
    startLng: 151.2093,
    endLat: 22.3193,
    endLng: 114.1694,
    arcAlt: 0.3,
  },
  {
    order: 3,
    startLat: 21.3099,
    startLng: -157.8581,
    endLat: 40.7128,
    endLng: -74.006,
    arcAlt: 0.3,
  },
  {
    order: 3,
    startLat: -6.2088,
    startLng: 106.8456,
    endLat: 51.5072,
    endLng: -0.1276,
    arcAlt: 0.3,
  },
  {
    order: 4,
    startLat: 11.986597,
    startLng: 8.571831,
    endLat: -15.595412,
    endLng: -56.05918,
    arcAlt: 0.5,
  },
  {
    order: 4,
    startLat: -34.6037,
    startLng: -58.3816,
    endLat: 22.3193,
    endLng: 114.1694,
    arcAlt: 0.7,
  },
  { order: 4, startLat: 51.5072, startLng: -0.1276, endLat: 48.8566, endLng: -2.3522, arcAlt: 0.1 },
  {
    order: 5,
    startLat: 14.5995,
    startLng: 120.9842,
    endLat: 51.5072,
    endLng: -0.1276,
    arcAlt: 0.3,
  },
  {
    order: 5,
    startLat: 1.3521,
    startLng: 103.8198,
    endLat: -33.8688,
    endLng: 151.2093,
    arcAlt: 0.2,
  },
  {
    order: 5,
    startLat: 34.0522,
    startLng: -118.2437,
    endLat: 48.8566,
    endLng: -2.3522,
    arcAlt: 0.2,
  },
  {
    order: 6,
    startLat: -15.432563,
    startLng: 28.315853,
    endLat: 1.094136,
    endLng: -63.34546,
    arcAlt: 0.7,
  },
  {
    order: 6,
    startLat: 37.5665,
    startLng: 126.978,
    endLat: 35.6762,
    endLng: 139.6503,
    arcAlt: 0.1,
  },
  {
    order: 6,
    startLat: 22.3193,
    startLng: 114.1694,
    endLat: 51.5072,
    endLng: -0.1276,
    arcAlt: 0.3,
  },
  {
    order: 7,
    startLat: -19.885592,
    startLng: -43.951191,
    endLat: -15.595412,
    endLng: -56.05918,
    arcAlt: 0.1,
  },
  { order: 7, startLat: 48.8566, startLng: -2.3522, endLat: 52.52, endLng: 13.405, arcAlt: 0.1 },
  { order: 7, startLat: 52.52, startLng: 13.405, endLat: 34.0522, endLng: -118.2437, arcAlt: 0.2 },
  {
    order: 8,
    startLat: -8.833221,
    startLng: 13.264837,
    endLat: -33.936138,
    endLng: 18.436529,
    arcAlt: 0.2,
  },
  {
    order: 8,
    startLat: 49.2827,
    startLng: -123.1207,
    endLat: 52.3676,
    endLng: 4.9041,
    arcAlt: 0.2,
  },
  { order: 8, startLat: 1.3521, startLng: 103.8198, endLat: 40.7128, endLng: -74.006, arcAlt: 0.5 },
  {
    order: 9,
    startLat: 51.5072,
    startLng: -0.1276,
    endLat: 34.0522,
    endLng: -118.2437,
    arcAlt: 0.2,
  },
  {
    order: 9,
    startLat: 22.3193,
    startLng: 114.1694,
    endLat: -22.9068,
    endLng: -43.1729,
    arcAlt: 0.7,
  },
  {
    order: 9,
    startLat: 1.3521,
    startLng: 103.8198,
    endLat: -34.6037,
    endLng: -58.3816,
    arcAlt: 0.5,
  },
  {
    order: 10,
    startLat: -22.9068,
    startLng: -43.1729,
    endLat: 28.6139,
    endLng: 77.209,
    arcAlt: 0.7,
  },
  {
    order: 10,
    startLat: 34.0522,
    startLng: -118.2437,
    endLat: 31.2304,
    endLng: 121.4737,
    arcAlt: 0.3,
  },
  {
    order: 10,
    startLat: -6.2088,
    startLng: 106.8456,
    endLat: 52.3676,
    endLng: 4.9041,
    arcAlt: 0.3,
  },
  {
    order: 11,
    startLat: 41.9028,
    startLng: 12.4964,
    endLat: 34.0522,
    endLng: -118.2437,
    arcAlt: 0.2,
  },
  {
    order: 11,
    startLat: -6.2088,
    startLng: 106.8456,
    endLat: 31.2304,
    endLng: 121.4737,
    arcAlt: 0.2,
  },
  {
    order: 11,
    startLat: 22.3193,
    startLng: 114.1694,
    endLat: 1.3521,
    endLng: 103.8198,
    arcAlt: 0.2,
  },
  {
    order: 12,
    startLat: 34.0522,
    startLng: -118.2437,
    endLat: 37.7749,
    endLng: -122.4194,
    arcAlt: 0.1,
  },
  {
    order: 12,
    startLat: 35.6762,
    startLng: 139.6503,
    endLat: 22.3193,
    endLng: 114.1694,
    arcAlt: 0.2,
  },
  {
    order: 12,
    startLat: 22.3193,
    startLng: 114.1694,
    endLat: 34.0522,
    endLng: -118.2437,
    arcAlt: 0.3,
  },
  { order: 13, startLat: 52.52, startLng: 13.405, endLat: 22.3193, endLng: 114.1694, arcAlt: 0.3 },
  {
    order: 13,
    startLat: 11.986597,
    startLng: 8.571831,
    endLat: 35.6762,
    endLng: 139.6503,
    arcAlt: 0.3,
  },
  {
    order: 13,
    startLat: -22.9068,
    startLng: -43.1729,
    endLat: -34.6037,
    endLng: -58.3816,
    arcAlt: 0.1,
  },
  {
    order: 14,
    startLat: -33.936138,
    startLng: 18.436529,
    endLat: 21.395643,
    endLng: 39.883798,
    arcAlt: 0.3,
  },
].map((route, routeIndex) => ({
  ...route,
  color: flagelGlobeColors[routeIndex % flagelGlobeColors.length],
}))

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
    return '#d4d4d4'
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

function TriviaBulbPreview() {
  const glowId = useId().replace(/:/g, '')
  const bulbCycleDuration = 7.2
  const bulbCycleTimes = [0, 0.4, 0.55, 0.78, 1]
  const lightColor = '#facc15'
  const offStroke = 'var(--text-tertiary)'

  return (
    <motion.div
      className="pointer-events-none absolute right-5 top-5 z-10 h-24 w-24 sm:right-7 sm:top-7 sm:h-28 sm:w-28"
      variants={{
        rest: { scale: 1, rotate: 0 },
        hover: { scale: 1.04, rotate: 3 },
      }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 120" className="h-full w-full overflow-visible">
        <defs>
          <filter id={`${glowId}-glow`} x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0.98 0 1 0 0 0.72 0 0 1 0 0.08 0 0 0 0.55 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.circle
          cx="60"
          cy="50"
          r="26"
          fill={lightColor}
          filter={`url(#${glowId}-glow)`}
          animate={{ opacity: [0.04, 0.38, 0.08, 0.48, 0.06] }}
          transition={{ duration: bulbCycleDuration, repeat: Infinity, times: bulbCycleTimes }}
        />

        <motion.g
          stroke={lightColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={{ opacity: [0.18, 0.9, 0.22, 1, 0.2] }}
          transition={{ duration: bulbCycleDuration, repeat: Infinity, times: bulbCycleTimes }}
        >
          <path d="M60 12V24" />
          <path d="M31 22L39 31" />
          <path d="M89 22L81 31" />
          <path d="M18 50H30" />
          <path d="M90 50H102" />
          <path d="M27 80L36 72" />
          <path d="M93 80L84 72" />
        </motion.g>

        <motion.path
          d="M38 51C38 36.6 47.4 28 60 28C72.6 28 82 36.6 82 51C82 59.7 77.5 66.2 70 71.5C67.4 73.3 66 76.2 66 79.4V82H54V79.4C54 76.2 52.6 73.3 50 71.5C42.5 66.2 38 59.7 38 51Z"
          fill="var(--background)"
          stroke={offStroke}
          strokeWidth="3"
          strokeLinejoin="round"
          animate={{
            fill: [
              'var(--background)',
              '#fef3c7',
              'var(--background)',
              '#fde68a',
              'var(--background)',
            ],
            stroke: [offStroke, lightColor, offStroke, lightColor, offStroke],
          }}
          transition={{ duration: bulbCycleDuration, repeat: Infinity, times: bulbCycleTimes }}
        />

        <motion.path
          d="M55 69V55H65V69M55 55C55 51.8 57.1 50 60 50C62.9 50 65 51.8 65 55"
          fill="none"
          stroke={offStroke}
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ stroke: [offStroke, '#92400e', offStroke, '#92400e', offStroke] }}
          transition={{ duration: bulbCycleDuration, repeat: Infinity, times: bulbCycleTimes }}
        />

        <motion.g
          fill="var(--background)"
          stroke={offStroke}
          strokeWidth="3"
          strokeLinejoin="round"
          animate={{
            fill: [
              'var(--background)',
              '#fef9c3',
              'var(--background)',
              '#fef08a',
              'var(--background)',
            ],
            stroke: [offStroke, lightColor, offStroke, lightColor, offStroke],
          }}
          transition={{ duration: bulbCycleDuration, repeat: Infinity, times: bulbCycleTimes }}
        >
          <path d="M52 82H68V92C68 95.3 65.3 98 62 98H58C54.7 98 52 95.3 52 92V82Z" />
          <path d="M51 88H69" />
          <path d="M53 94H67" />
        </motion.g>
      </svg>
    </motion.div>
  )
}

function FlagelGlobePreview({ color }: { color: string }) {
  return (
    <motion.div
      className="pointer-events-none absolute -right-16 top-4 z-0 h-[240px] w-[240px] opacity-90 sm:-right-20 sm:top-0 sm:h-[320px] sm:w-[320px] lg:-right-16 lg:-top-2 lg:h-[340px] lg:w-[340px]"
      variants={{
        rest: { scale: 1, rotate: 0 },
        hover: { scale: 1.03, rotate: -2 },
      }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-10 rounded-full blur-3xl"
        style={{ backgroundColor: `${color}24` }}
      />
      <div className="relative h-full w-full">
        <World data={flagelGlobeRoutes} globeConfig={flagelGlobeConfig} />
      </div>
    </motion.div>
  )
}

function GamePreview({ game }: { game: GameInfo }) {
  if (game.id === 'skribble') {
    return <SkribbleGamePreview color={game.colorHex} />
  }

  if (game.id === 'trivia') {
    return <TriviaBulbPreview />
  }

  if (game.id === 'wordel') {
    return <WordelGamePreview color={game.colorHex} />
  }

  if (game.id === 'flagel') {
    return <FlagelGlobePreview color={game.colorHex} />
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
      <motion.div
        initial="rest"
        whileHover="hover"
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

        <div className="relative z-10 flex items-start gap-4">
          <div
            className={`flex shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] transition-transform duration-300 group-hover:scale-[1.04] ${
              featured ? 'h-16 w-16' : 'h-14 w-14'
            }`}
            style={{ backgroundColor: `${game.colorHex}10`, color: game.colorHex }}
          >
            <GameIcon gameId={game.id} size={featured ? 34 : 30} color={game.colorHex} animated />
          </div>
        </div>

        <div
          className={`relative z-10 ${
            featured
              ? 'mt-10 max-w-md'
              : game.id === 'flagel'
                ? 'mt-6 pr-28 sm:pr-36'
                : 'mt-6'
          }`}
        >
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
          className={`relative z-10 flex flex-wrap gap-2 ${
            featured
              ? 'mt-7 max-w-lg'
              : game.id === 'flagel'
                ? 'mt-5 pr-24 sm:pr-36'
                : 'mt-5'
          }`}
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

        {(featured || game.id === 'wordel' || game.id === 'flagel' || game.id === 'trivia') && (
          <GamePreview game={game} />
        )}

        <div
          className={`relative z-10 mt-auto flex border-t border-[var(--border)] pt-6 ${
            game.id === 'flagel'
              ? 'items-center justify-between gap-3 pr-20 sm:justify-start sm:gap-6 sm:pr-44'
              : 'items-center justify-between'
          }`}
        >
          <span className="flex items-center gap-2 whitespace-nowrap text-sm text-[var(--text-secondary)]">
            <IconUsers size={14} />
            {game.minPlayers}-{game.maxPlayers} players
          </span>
          <Link
            href={`/lobby?game=${game.id}`}
            className={`flex items-center gap-1 text-sm font-semibold text-[var(--text-primary)] transition-transform duration-300 hover:translate-x-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary-500)] ${
              game.id === 'flagel'
                ? 'rounded-full bg-[var(--surface)]/80 px-3 py-1.5 backdrop-blur'
                : ''
            }`}
          >
            Play now
            <IconArrowRight size={14} />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  )
}
