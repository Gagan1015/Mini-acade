'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import type { GameInfo } from '@/lib/games'
import { GameIcon } from '@/components/ui/GameIcons'

/* ── SVG Icons ── */

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
}

export function GameCard({ game, index }: GameCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: [0, 0, 0.2, 1],
      }}
      className="group"
    >
      <Link href={`/lobby?game=${game.id}`} className="block">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border)]/60 bg-[var(--surface)]/40 backdrop-blur-sm transition-all duration-300 hover:border-[var(--border-strong)] hover:bg-[var(--surface)]/70">
          {/* Animated accent line */}
          <motion.div
            className="absolute left-0 top-0 h-px w-full"
            style={{
              background: `linear-gradient(to right, transparent, ${game.colorHex}40, transparent)`,
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
          />

          <div className="relative px-6 py-7">
            {/* Icon + title row */}
            <div className="flex items-start gap-4">
              <motion.div
                whileHover={{ rotate: [-3, 3, 0], transition: { duration: 0.4 } }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${game.colorHex}10` }}
              >
                <GameIcon gameId={game.id} size={28} animated />
              </motion.div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
                  {game.name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {game.description}
                </p>
              </div>
            </div>

            {/* Feature tags */}
            <div className="mt-5 flex flex-wrap gap-1.5">
              {game.features.map((feature) => (
                <span
                  key={feature}
                  className="rounded-md px-2 py-0.5 text-[11px] font-medium text-[var(--text-tertiary)] bg-[var(--background)]/80"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Footer — players + play link */}
            <div className="mt-5 flex items-center justify-between pt-4 border-t border-[var(--border)]/30">
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                <IconUsers size={13} />
                {game.minPlayers}–{game.maxPlayers} players
              </span>
              <span className="flex items-center gap-1 text-sm font-medium text-[var(--primary-400)] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1">
                Play
                <IconArrowRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
