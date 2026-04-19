'use client'

import { motion } from 'motion/react'

export function ArcadeMascot({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative flex h-48 w-48 items-center justify-center md:h-56 md:w-56 ${className}`}
    >
      <motion.div
        className="absolute inset-8 rounded-full blur-3xl"
        style={{ backgroundColor: 'var(--mascot-glow)' }}
        animate={{ scale: [0.96, 1.08, 0.96], opacity: [0.35, 0.52, 0.35] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute left-1 top-8 rounded-full border border-[var(--border)] bg-[var(--mascot-chip-bg)] px-3 py-1 font-mono text-[10px] text-[var(--marketing-accent)] shadow-[var(--marketing-shadow)] backdrop-blur-md"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        sync 14ms
      </motion.div>

      <motion.div
        className="absolute bottom-9 right-0 rounded-full border border-[var(--border)] bg-[var(--mascot-chip-bg)] px-3 py-1 font-mono text-[10px] text-[var(--text-secondary)] shadow-[var(--marketing-shadow)] backdrop-blur-md"
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      >
        room live
      </motion.div>

      <motion.svg
        width="160"
        height="160"
        viewBox="0 0 120 120"
        fill="none"
        className="relative z-10"
        style={{ filter: 'drop-shadow(var(--mascot-shadow))' }}
        animate={{ y: [0, -8, 0], rotate: [0, 1.5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.line
          x1="60"
          y1="20"
          x2="60"
          y2="4"
          stroke="currentColor"
          strokeWidth="3"
          className="text-[var(--text-primary)]"
          animate={{ x2: [60, 65, 60], y2: [4, 7, 4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="60"
          cy="4"
          r="4"
          fill="var(--marketing-accent)"
          animate={{ cx: [60, 65, 60], cy: [4, 7, 4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <rect
          x="20"
          y="25"
          width="80"
          height="70"
          rx="16"
          fill="var(--mascot-shell)"
          stroke="var(--mascot-shell-stroke)"
          strokeWidth="4"
        />
        <rect x="25" y="30" width="70" height="60" rx="12" fill="var(--mascot-shell-panel)" />
        <rect x="35" y="40" width="50" height="28" rx="6" fill="var(--mascot-screen)" />

        <motion.circle
          cx="48"
          cy="54"
          r="3"
          fill="var(--mascot-eye)"
          animate={{ scaleY: [1, 0.15, 1], y: [0, 3, 0] }}
          transition={{ duration: 3.8, times: [0, 0.08, 0.16], repeat: Infinity }}
        />
        <motion.circle
          cx="72"
          cy="54"
          r="3"
          fill="var(--mascot-eye)"
          animate={{ scaleY: [1, 0.15, 1], y: [0, 3, 0] }}
          transition={{ duration: 3.8, times: [0, 0.08, 0.16], repeat: Infinity }}
        />

        <circle cx="42" cy="62" r="2" fill="var(--marketing-accent)" opacity="0.8" />
        <circle cx="78" cy="62" r="2" fill="var(--marketing-accent)" opacity="0.8" />
        <path d="M40 85 h4 v-4 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 z" fill="var(--mascot-screen)" />
        <circle cx="72" cy="85" r="4" fill="var(--marketing-accent)" />
        <circle cx="82" cy="81" r="4" fill="var(--mascot-muted-button)" />
      </motion.svg>
    </div>
  )
}
