'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { AppLayout } from '@/components/layout/AppLayout'
import { GameCard } from '@/components/games/GameCard'
import { AnimatedGamepad } from '@/components/ui/Animated'
import { GAME_LIST } from '@/lib/games'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { GameIcon } from '@/components/ui/GameIcons'

/* ── Inline SVG Icons ── */

function IconArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function IconSparkle({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
  )
}

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

function IconZap({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function IconShield({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

interface LandingPageProps {
  isSignedIn: boolean
  userName?: string
  userImage?: string
  userRole?: string
}

export function LandingPage({ isSignedIn }: LandingPageProps) {
  return (
    <AppLayout>
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[var(--primary-500)]/8 blur-[140px]"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
            className="absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-[var(--game-skribble)]/6 blur-[120px]"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-24 md:pb-32 md:pt-36 lg:px-8">
          <div className="text-center">
            {/* Animated logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 300, damping: 25 }}
              className="mb-8 inline-block"
            >
              <AnimatedGamepad size={56} />
            </motion.div>

            {/* Pre-headline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-5 text-xs font-medium uppercase tracking-[0.25em] text-[var(--primary-400)]/80"
            >
              Real-time multiplayer games
            </motion.p>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Play Together,{' '}
              <span className="bg-gradient-to-r from-[var(--primary-400)] via-[var(--game-skribble)] to-[var(--game-wordel)] bg-clip-text text-transparent">
                Anywhere
              </span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-[var(--text-secondary)] md:text-lg"
            >
              Classic party games reimagined for the browser. Create a private room,
              share the code, and start playing with friends in seconds.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link href={isSignedIn ? '/lobby' : '/auth/signin'}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn btn-primary btn-lg group shadow-primary"
                >
                  <IconSparkle size={18} />
                  {isSignedIn ? 'Go to Lobby' : 'Start Playing'}
                  <IconArrowRight size={16} />
                </motion.button>
              </Link>
              <Link href="#games">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn btn-secondary btn-lg"
                >
                  Explore Games
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats row — no emojis, clean separators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-16 flex flex-wrap items-center justify-center gap-10 text-sm text-[var(--text-tertiary)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1.5">
                  {GAME_LIST.map((game) => (
                    <div
                      key={game.id}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--background)] bg-[var(--surface)]"
                    >
                      <GameIcon gameId={game.id} size={16} />
                    </div>
                  ))}
                </div>
                <span>4 games to play</span>
              </div>
              <div className="h-4 w-px bg-[var(--border)]/40" />
              <div className="flex items-center gap-2">
                <IconUsers size={15} />
                <span>Up to 10 players per room</span>
              </div>
              <div className="h-4 w-px bg-[var(--border)]/40" />
              <div className="flex items-center gap-2">
                <IconZap size={15} />
                <span>Real-time sync</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Game Grid ── */}
      <section id="games" className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14 text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Choose Your Game
            </h2>
            <p className="mt-4 text-[var(--text-secondary)]">
              Every game supports private rooms with shareable invite codes
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {GAME_LIST.map((game, i) => (
              <GameCard key={game.id} game={game} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative py-20 md:py-28">
        {/* Subtle top divider */}
        <div className="absolute inset-x-0 top-0 mx-auto max-w-xs h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-[var(--text-secondary)]">
              Playing with friends is just three simple steps
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-16"
          >
            {[
              {
                step: '01',
                title: 'Pick a Game',
                desc: 'Choose from Skribble, Trivia, Wordel, or Flagel — each with its own twist.',
                icon: <IconSparkle size={22} />,
                color: 'var(--game-skribble)',
              },
              {
                step: '02',
                title: 'Create a Room',
                desc: 'Get a unique 6-character code. Share it with friends via link or text.',
                icon: <IconShield size={22} />,
                color: 'var(--primary-500)',
              },
              {
                step: '03',
                title: 'Play Together',
                desc: 'Compete in real-time. Scores update live. Winner takes the bragging rights.',
                icon: <IconZap size={22} />,
                color: 'var(--game-wordel)',
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={staggerItem}
                className="group relative text-center"
              >
                {/* Icon container */}
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${item.color} 10%, transparent)`,
                    color: item.color,
                  }}
                >
                  {item.icon}
                </motion.div>

                <p
                  className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: item.color }}
                >
                  Step {item.step}
                </p>
                <h3 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative text-center"
          >
            {/* Subtle glow */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-1/2 h-[200px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary-500)]/6 blur-[80px]" />
            </div>

            <div className="relative py-8">
              <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                Ready to Play?
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-[var(--text-secondary)]">
                Create a room, share the code with friends, and jump into the fun.
                No downloads, no installs — just go.
              </p>
              <div className="mt-10">
                <Link href={isSignedIn ? '/lobby' : '/auth/signin'}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn btn-primary btn-lg group shadow-primary"
                  >
                    <IconSparkle size={18} />
                    {isSignedIn ? 'Create a Room' : 'Get Started Free'}
                    <IconArrowRight size={16} />
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </AppLayout>
  )
}
