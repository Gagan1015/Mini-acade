'use client'

import type { CSSProperties } from 'react'
import { motion } from 'motion/react'

/* ──────────────────────────────────────────────────────────────────
   Arcado brand mark — single source of truth.
   Used in Header, Footer, Auth, Admin sidebar, and anywhere the
   brand identity needs to appear. Always inherits `currentColor`,
   so it adapts to its container's text color.
   ────────────────────────────────────────────────────────────── */

type LogoMarkProps = {
  size?: number
  animated?: boolean
  className?: string
  style?: CSSProperties
}

export function LogoMark({ size = 28, animated = false, className, style }: LogoMarkProps) {
  if (!animated) {
    return (
      <svg
        viewBox="0 0 28 28"
        fill="none"
        width={size}
        height={size}
        className={className}
        style={style}
        aria-hidden="true"
      >
        <rect
          x="2"
          y="8"
          width="24"
          height="16"
          rx="5"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="9" cy="16" r="1.5" fill="currentColor" opacity="0.7" />
        <circle cx="19" cy="16" r="1.5" fill="currentColor" opacity="0.7" />
        <path
          d="M11 4V8M17 4V8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
    >
      <motion.rect
        x="2"
        y="8"
        width="24"
        height="16"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
      />
      <circle cx="9" cy="16" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="19" cy="16" r="1.5" fill="currentColor" opacity="0.7" />
      <motion.path
        d="M11 4V8M17 4V8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      />
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────────────
   Mark inside a rounded tile container — the standard "app icon"
   lockup used in headers/sidebars.
   ────────────────────────────────────────────────────────────── */

const tileSizes = {
  sm: { tile: 'h-8 w-8', mark: 18 },
  md: { tile: 'h-9 w-9', mark: 22 },
  lg: { tile: 'h-10 w-10', mark: 26 },
} as const

type LogoTileProps = {
  size?: keyof typeof tileSizes
  animated?: boolean
  variant?: 'surface' | 'primary' | 'plain'
  className?: string
}

export function LogoTile({
  size = 'lg',
  animated,
  variant = 'surface',
  className = '',
}: LogoTileProps) {
  const { tile, mark } = tileSizes[size]
  const variantClasses =
    variant === 'primary'
      ? 'bg-[var(--primary-500)]/15 text-[var(--primary-400)]'
      : variant === 'plain'
        ? 'text-[var(--text-primary)]'
        : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
  return (
    <div
      className={`relative flex ${tile} flex-shrink-0 items-center justify-center rounded-[12px] ${variantClasses} ${className}`}
    >
      <LogoMark size={mark} animated={animated} />
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────
   Arcado wordmark. Always Space Grotesk (font-display) so the brand
   reads consistently wherever the name appears.
   ────────────────────────────────────────────────────────────── */

const wordmarkSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
} as const

type WordmarkProps = {
  size?: keyof typeof wordmarkSizes
  className?: string
}

export function Wordmark({ size = 'lg', className = '' }: WordmarkProps) {
  return (
    <span
      className={`font-display ${wordmarkSizes[size]} font-bold tracking-tight ${className}`}
    >
      Arcado
    </span>
  )
}
