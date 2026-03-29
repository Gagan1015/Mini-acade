'use client'

import { type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'

interface GameIconProps {
  size?: number
  className?: string
  color?: string
  animated?: boolean
}

/* ── Animated wrapper ── */
function IconWrapper({
  animated,
  className,
  style,
  children,
}: {
  animated: boolean
  className?: string
  style?: React.CSSProperties
  children: ReactNode
}) {
  if (!animated) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    )
  }

  const motionProps: HTMLMotionProps<'div'> = {
    whileHover: { scale: 1.08, transition: { duration: 0.25 } },
  }

  return (
    <motion.div {...motionProps} className={className} style={style}>
      {children}
    </motion.div>
  )
}

// Skribble — paint brush / palette icon
export function SkribbleIcon({ size = 32, className = '', color = 'var(--game-skribble)', animated = false }: GameIconProps) {
  return (
    <IconWrapper animated={animated} className={className} style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <defs>
          <linearGradient id="skribble-grad" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#skribble-grad)" fillOpacity="0.15" />
        <path
          d="M32.5 10.5L37.5 15.5L18 35H13V30L32.5 10.5Z"
          stroke="url(#skribble-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M28.5 14.5L33.5 19.5"
          stroke="url(#skribble-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="18" cy="18" r="2" fill={color} fillOpacity="0.5" />
        <circle cx="22" cy="14" r="1.5" fill="#f43f5e" fillOpacity="0.6" />
      </svg>
    </IconWrapper>
  )
}

// Trivia — brain / lightbulb icon
export function TriviaIcon({ size = 32, className = '', color = 'var(--game-trivia)', animated = false }: GameIconProps) {
  return (
    <IconWrapper animated={animated} className={className} style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <defs>
          <linearGradient id="trivia-grad" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#trivia-grad)" fillOpacity="0.15" />
        <path
          d="M24 10C18.477 10 14 14.477 14 20C14 23.5 15.8 26.5 18.5 28.2V32C18.5 32.55 18.95 33 19.5 33H28.5C29.05 33 29.5 32.55 29.5 32V28.2C32.2 26.5 34 23.5 34 20C34 14.477 29.523 10 24 10Z"
          stroke="url(#trivia-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M20 36H28" stroke="url(#trivia-grad)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M22 39H26" stroke="url(#trivia-grad)" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 15V21L27 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      </svg>
    </IconWrapper>
  )
}

// Wordel — letter tiles icon
export function WordelIcon({ size = 32, className = '', color = 'var(--game-wordel)', animated = false }: GameIconProps) {
  return (
    <IconWrapper animated={animated} className={className} style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <defs>
          <linearGradient id="wordel-grad" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#wordel-grad)" fillOpacity="0.15" />
        {/* Letter tiles */}
        <rect x="10" y="16" width="10" height="10" rx="2.5" stroke="url(#wordel-grad)" strokeWidth="2" fill={color} fillOpacity="0.15" />
        <rect x="22" y="16" width="10" height="10" rx="2.5" stroke="url(#wordel-grad)" strokeWidth="2" fill={color} fillOpacity="0.3" />
        <rect x="34" y="16" width="4" height="10" rx="2" stroke="url(#wordel-grad)" strokeWidth="1.5" fill={color} fillOpacity="0.1" />
        <rect x="10" y="28" width="10" height="10" rx="2.5" stroke="url(#wordel-grad)" strokeWidth="2" fill={color} fillOpacity="0.08" />
        <rect x="22" y="28" width="10" height="10" rx="2.5" stroke="url(#wordel-grad)" strokeWidth="2" fill={color} fillOpacity="0.1" />
        <text x="15" y="24" textAnchor="middle" fill={color} fontSize="7" fontWeight="bold" fontFamily="var(--font-mono)">W</text>
        <text x="27" y="24" textAnchor="middle" fill={color} fontSize="7" fontWeight="bold" fontFamily="var(--font-mono)">O</text>
      </svg>
    </IconWrapper>
  )
}

// Flagel — flag / globe icon
export function FlagelIcon({ size = 32, className = '', color = 'var(--game-flagel)', animated = false }: GameIconProps) {
  return (
    <IconWrapper animated={animated} className={className} style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <defs>
          <linearGradient id="flagel-grad" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#flagel-grad)" fillOpacity="0.15" />
        {/* Flag pole */}
        <path d="M15 10V38" stroke="url(#flagel-grad)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Flag */}
        <path
          d="M15 12C15 12 19 10 24 13C29 16 33 14 33 14V26C33 26 29 28 24 25C19 22 15 24 15 24V12Z"
          fill={color}
          fillOpacity="0.25"
          stroke="url(#flagel-grad)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Globe hint */}
        <circle cx="24" cy="19" r="3" stroke={color} strokeWidth="1.5" opacity="0.5" fill="none" />
        <path d="M21 19H27" stroke={color} strokeWidth="1" opacity="0.4" />
      </svg>
    </IconWrapper>
  )
}

// Map game IDs to icon components
export const GAME_ICONS: Record<string, React.ComponentType<GameIconProps>> = {
  skribble: SkribbleIcon,
  trivia: TriviaIcon,
  wordel: WordelIcon,
  flagel: FlagelIcon,
}

export function GameIcon({ gameId, ...props }: GameIconProps & { gameId: string }) {
  const Icon = GAME_ICONS[gameId]
  if (!Icon) return null
  return <Icon {...props} />
}
