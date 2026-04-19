'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { AppLayout } from '@/components/layout/AppLayout'
import { GameCard } from '@/components/games/GameCard'
import { ArcadeMascot } from '@/components/ui/ArcadeMascot'
import { GAME_LIST } from '@/lib/games'

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

function IconSparkle({ size = 18 }: { size?: number }) {
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
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
  )
}

function IconGrid({ size = 18 }: { size?: number }) {
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
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconZap({ size = 18 }: { size?: number }) {
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
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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
  const gameCardLayouts = [
    'lg:col-span-7 lg:row-span-2',
    'lg:col-span-5',
    'lg:col-span-5',
    'lg:col-span-12',
  ]

  const steps = [
    {
      step: '01',
      title: 'Create a room',
      description:
        'Pick a game, generate a private code, and get everyone into the same session without setup friction.',
      icon: <IconSparkle />,
    },
    {
      step: '02',
      title: 'Set the flow',
      description:
        'Choose the mode, cap the room, and keep the lobby calm before the first round starts.',
      icon: <IconGrid />,
    },
    {
      step: '03',
      title: 'Play live',
      description:
        'State, scores, and turn updates stay in sync so the match feels fast instead of messy.',
      icon: <IconZap />,
    },
  ]

  return (
    <AppLayout variant="marketing">
      <div className="marketing-rail-layout overflow-hidden bg-[var(--background)]">
        <section className="marketing-rail-section border-b border-[var(--marketing-hairline)]">
          <div className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:px-8 lg:pb-28 lg:pt-14">
            <div className="relative min-h-[560px] overflow-hidden py-2">
              <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[var(--marketing-hairline)]" />
              <div className="pointer-events-none absolute right-[-4%] top-0 font-display text-[clamp(8rem,24vw,18rem)] font-bold leading-none tracking-[-0.08em] text-[var(--marketing-accent-soft)]">
                PLAY
              </div>

              <div className="relative z-10 max-w-4xl">
                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="font-display mt-6 text-4xl font-bold leading-[0.92] tracking-[-0.065em] text-[var(--text-primary)] sm:text-5xl lg:text-6xl xl:text-[5.5rem]"
                >
                  Start the room.
                  <span className="block text-[var(--marketing-accent)]">Own the moment.</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.45 }}
                  className="mt-6 max-w-xl text-base leading-7 text-[var(--text-secondary)]"
                >
                  Launch a room fast, pull everyone in, and make the first screen memorable.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16, duration: 0.45 }}
                  className="mt-10 flex flex-col gap-4 sm:flex-row"
                >
                  <Link
                    href={isSignedIn ? '/lobby' : '/auth/signin'}
                    className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[var(--text-primary)] px-6 py-3.5 text-sm font-semibold text-[var(--text-inverse)] transition-transform hover:-translate-y-0.5"
                  >
                    {isSignedIn ? 'Create a room' : 'Get started'}
                    <IconArrowRight />
                  </Link>
                  <Link
                    href="#games"
                    className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-sm font-semibold text-[var(--text-primary)] transition-transform hover:-translate-y-0.5"
                  >
                    Explore games
                  </Link>
                </motion.div>
              </div>

              <div className="absolute bottom-0 right-0 h-[420px] w-[420px] opacity-95">
                <div className="absolute inset-0 rounded-full bg-[var(--marketing-accent-soft)] blur-3xl" />
                <ArcadeMascot className="absolute inset-0 m-auto scale-[1.75] opacity-90" />
              </div>
            </div>
          </div>
        </section>

        <section
          id="games"
          className="marketing-rail-section border-b border-[var(--marketing-hairline)]"
        >
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
            <div className="space-y-12">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,390px)] lg:items-end">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--marketing-accent)]">
                    Game library
                  </p>
                  <h2 className="font-display mt-5 text-4xl font-bold tracking-[-0.04em] text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
                    Pick the room energy.
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
                    Fast rounds, shared codes, and just enough choice to match the mood before everyone joins.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--marketing-shadow)]">
                    <p className="font-display text-3xl font-bold text-[var(--text-primary)]">4</p>
                    <p className="mt-1 text-xs font-medium text-[var(--text-tertiary)]">game modes</p>
                  </div>
                  <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--marketing-shadow)]">
                    <p className="font-display text-3xl font-bold text-[var(--text-primary)]">10</p>
                    <p className="mt-1 text-xs font-medium text-[var(--text-tertiary)]">max players</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:auto-rows-[minmax(224px,auto)] lg:grid-cols-12">
                {GAME_LIST.map((game, index) => (
                  <div key={game.id} className={gameCardLayouts[index]}>
                    <GameCard
                      game={game}
                      index={index}
                      featured={index === 0}
                      compact={index > 0}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="marketing-rail-section border-b border-[var(--marketing-hairline)]"
        >
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--marketing-accent)]">
                How it works
              </p>
              <h2 className="font-display mt-5 text-4xl font-bold tracking-[-0.04em] text-[var(--text-primary)] sm:text-5xl">
                From invite to first round.
              </h2>
              <p className="mt-5 text-base leading-8 text-[var(--text-secondary)]">
                Pick a mode, share the room, and keep every update in sync while the round moves.
              </p>
            </div>

            <div className="mt-14 overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)]">
              <div className="grid grid-cols-1 lg:grid-cols-3">
                {steps.map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ delay: index * 0.08, duration: 0.45 }}
                    className={`p-8 lg:p-10 ${index < steps.length - 1 ? 'border-b border-[var(--marketing-hairline)] lg:border-b-0 lg:border-r' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--marketing-accent-soft)] text-[var(--marketing-accent)]">
                        {item.icon}
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="font-display mt-10 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                      {item.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-rail-section py-20 lg:py-24">
          <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--marketing-accent)]">
              Ready to play
            </p>
            <h2 className="font-display mt-5 text-4xl font-bold tracking-[-0.04em] text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
              Create your next room in seconds.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
              Bring friends in with a code and get straight to the first round.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={isSignedIn ? '/lobby' : '/auth/signin'}
                className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[var(--text-primary)] px-6 py-3.5 text-sm font-semibold text-[var(--text-inverse)] transition-transform hover:-translate-y-0.5"
              >
                {isSignedIn ? 'Open lobby' : 'Start playing'}
                <IconArrowRight />
              </Link>
              <Link
                href="#games"
                className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-sm font-semibold text-[var(--text-primary)] transition-transform hover:-translate-y-0.5"
              >
                Browse the games
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
