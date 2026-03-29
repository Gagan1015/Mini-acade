'use client'

import { motion } from 'motion/react'

/* ── Animated Gamepad Logo ── */
export function AnimatedGamepad({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Controller body */}
      <motion.path
        d="M8 20C8 16 12 12 18 12H30C36 12 40 16 40 20V28C40 34 36 38 30 38H18C12 38 8 34 8 28V20Z"
        stroke="var(--primary-500)"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
      />
      {/* D-pad */}
      <motion.path
        d="M16 22V26M14 24H18"
        stroke="var(--primary-500)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      />
      {/* Buttons */}
      <motion.circle
        cx="32"
        cy="22"
        r="2"
        fill="var(--primary-500)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 400 }}
      />
      <motion.circle
        cx="36"
        cy="26"
        r="2"
        fill="var(--primary-500)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7, type: 'spring', stiffness: 400 }}
      />
    </svg>
  )
}

/* ── Loading Spinner ── */
export function Spinner({
  size = 24,
  color = 'currentColor',
}: {
  size?: number
  color?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0.2, rotate: 0 }}
        animate={{
          pathLength: [0.2, 0.8, 0.2],
          rotate: 360,
        }}
        transition={{
          pathLength: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
        }}
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  )
}

/* ── Live Indicator Dot ── */
export function LiveIndicator() {
  return (
    <span className="relative flex h-3 w-3">
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full"
        style={{ backgroundColor: 'var(--success-500)' }}
        animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span
        className="relative inline-flex h-3 w-3 rounded-full"
        style={{ backgroundColor: 'var(--success-500)' }}
      />
    </span>
  )
}

/* ── Animated Check ── */
export function AnimatedCheck({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="var(--success-500)"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
      />
      <motion.path
        d="M7 12.5L10 15.5L17 8.5"
        stroke="var(--success-500)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.3, ease: [0, 0, 0.2, 1] }}
      />
    </svg>
  )
}

/* ── Skeleton ── */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-shimmer rounded-lg ${className}`} />
}
