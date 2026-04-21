'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { GameIcon } from '@/components/ui/GameIcons'
import {
  DonutChart,
  ProgressRing,
  HorizontalBarChart,
  VerticalBarChart,
  SparkLine,
} from '@/components/ui/Charts'

/* ── Types ── */
interface GameStatData {
  id: string
  gameId: string
  gamesPlayed: number
  gamesWon: number
  totalScore: number
  highScore: number
  totalTime: number
}

interface RecentResult {
  id: string
  gameId: string
  score: number
  rank: number | null
  isWinner: boolean
  duration: number | null
  createdAt: string
  room: { code: string }
}

interface StatsClientProps {
  gameStats: GameStatData[]
  recentResults: RecentResult[]
}

/* ── Helpers ── */
const GAME_META: Record<string, { label: string; color: string }> = {
  skribble: { label: 'Skribble', color: 'var(--game-skribble)' },
  trivia: { label: 'Trivia', color: 'var(--game-trivia)' },
  wordel: { label: 'Wordel', color: 'var(--game-wordel)' },
  flagel: { label: 'Flagel', color: 'var(--game-flagel)' },
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds <= 0) return '0m'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.round((totalSeconds % 3600) / 60)
  if (hours <= 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(value)
}

/* ── Stagger animation ── */
const stagger = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
}

/* ══════════════════════════════════════════════
   Stats Client Component
   ══════════════════════════════════════════════ */

export default function StatsClient({ gameStats, recentResults }: StatsClientProps) {
  // Aggregate totals
  const totals = gameStats.reduce(
    (acc, stat) => {
      acc.gamesPlayed += stat.gamesPlayed
      acc.gamesWon += stat.gamesWon
      acc.totalScore += stat.totalScore
      acc.highScore = Math.max(acc.highScore, stat.highScore)
      acc.totalTime += stat.totalTime
      return acc
    },
    { gamesPlayed: 0, gamesWon: 0, totalScore: 0, highScore: 0, totalTime: 0 },
  )

  const winRate = totals.gamesPlayed > 0 ? Math.round((totals.gamesWon / totals.gamesPlayed) * 100) : 0
  const favoriteGame = gameStats[0]
  const avgScore = totals.gamesPlayed > 0 ? Math.round(totals.totalScore / totals.gamesPlayed) : 0

  // Chart data
  const donutSegments = gameStats.map((s) => ({
    value: s.gamesPlayed,
    color: GAME_META[s.gameId]?.color ?? 'var(--marketing-accent)',
    label: GAME_META[s.gameId]?.label ?? s.gameId,
  }))

  const scoreBarData = gameStats.map((s) => ({
    label: GAME_META[s.gameId]?.label ?? s.gameId,
    value: s.totalScore,
    color: GAME_META[s.gameId]?.color ?? 'var(--marketing-accent)',
  }))

  const highScoreBarData = gameStats.map((s) => ({
    label: GAME_META[s.gameId]?.label ?? s.gameId,
    value: s.highScore,
    color: GAME_META[s.gameId]?.color ?? 'var(--marketing-accent)',
  }))

  const recentScores = recentResults.map((r) => r.score).reverse()

  const winsByGame = gameStats.map((s) => ({
    label: GAME_META[s.gameId]?.label ?? s.gameId,
    value: s.gamesWon,
    color: GAME_META[s.gameId]?.color ?? 'var(--marketing-accent)',
  }))

  return (
    <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-18">
      {/* ── Hero Header ── */}
      <motion.div
        className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--marketing-accent)]">
            My stats
          </p>
          <h1 className="font-display mt-4 text-4xl font-bold tracking-[-0.05em] text-[var(--text-primary)] sm:text-5xl">
            Your scoreboard, across every game.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
            Track wins, total score, favorite modes, and the rounds that defined your streak.
          </p>
        </div>

        {/* Favorite game card */}
        <motion.div
          className="shrink-0 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)] lg:min-w-[320px]"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Favorite game
          </p>
          <div className="mt-3 flex items-center gap-3">
            {favoriteGame && <GameIcon gameId={favoriteGame.gameId} size={36} animated />}
            <p className="text-2xl font-semibold text-[var(--text-primary)]">
              {favoriteGame ? (GAME_META[favoriteGame.gameId]?.label ?? favoriteGame.gameId) : 'No games yet'}
            </p>
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {favoriteGame
              ? `${favoriteGame.gamesPlayed} matches played in your most active mode.`
              : 'Play your first room to start building a history.'}
          </p>
        </motion.div>
      </motion.div>

      {/* ── Top Stat Cards ── */}
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Games played', value: totals.gamesPlayed },
          { label: 'Wins', value: totals.gamesWon },
          { label: 'Win rate', value: `${winRate}%` },
          { label: 'Best score', value: totals.highScore },
          { label: 'Avg score', value: avgScore },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            className="group relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)] transition-shadow hover:shadow-[var(--marketing-shadow-strong)]"
            custom={i}
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              {card.label}
            </p>
            <p className="font-display mt-3 text-4xl font-bold text-[var(--text-primary)]">
              {card.value}
            </p>
            <div
              className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
              style={{ background: 'var(--marketing-accent)' }}
            />
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Games distribution donut */}
        <motion.div
          className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Distribution
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
            Games played by mode
          </h2>

          {donutSegments.length > 0 ? (
            <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
              <DonutChart
                segments={donutSegments}
                size={180}
                strokeWidth={22}
                centerValue={totals.gamesPlayed}
                centerLabel="Total"
              />
              <div className="space-y-3">
                {donutSegments.map((seg, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="text-sm text-[var(--text-primary)]">{seg.label}</span>
                    <span className="text-sm font-mono font-semibold text-[var(--text-secondary)]">
                      {seg.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[20px] border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
              No game data yet.
            </div>
          )}
        </motion.div>

        {/* Win rate ring + wins by game */}
        <motion.div
          className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Performance
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
            Win rate &amp; victories
          </h2>
          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <ProgressRing value={winRate} size={160} strokeWidth={16} label="Win rate" />
            {winsByGame.length > 0 && (
              <VerticalBarChart data={winsByGame} height={160} className="flex-1 min-w-[160px] max-w-[280px]" />
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Score analysis row ── */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Total score bar chart */}
        {scoreBarData.length > 0 && (
          <motion.div
            className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Scores
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
              Total by game
            </h2>
            <HorizontalBarChart data={scoreBarData} className="mt-5" />
          </motion.div>
        )}

        {/* High scores bar chart */}
        {highScoreBarData.length > 0 && (
          <motion.div
            className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Records
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
              High score by game
            </h2>
            <HorizontalBarChart data={highScoreBarData} className="mt-5" />
          </motion.div>
        )}

        {/* Score trend sparkline */}
        <motion.div
          className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Trend
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
            Recent score curve
          </h2>
          {recentScores.length >= 2 ? (
            <SparkLine data={recentScores} width={300} height={80} className="mt-5 w-full" />
          ) : (
            <div className="mt-5 rounded-[16px] border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
              Play at least 2 games to see your trend line.
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Mode breakdown + Recent matches ── */}
      <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)]">
        {/* Mode breakdown */}
        <motion.div
          className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                By game
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                Mode breakdown
              </h2>
            </div>
            <Link
              href="/lobby"
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            >
              Play again
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {gameStats.length > 0 ? (
              gameStats.map((stat, idx) => {
                const game = GAME_META[stat.gameId] ?? { label: stat.gameId, color: 'var(--marketing-accent)' }
                const gameWinRate = stat.gamesPlayed > 0 ? Math.round((stat.gamesWon / stat.gamesPlayed) * 100) : 0

                return (
                  <motion.div
                    key={stat.id}
                    className="rounded-[22px] border border-[var(--border)] bg-[var(--background)]/55 p-5 transition-colors hover:bg-[var(--surface-hover)]"
                    custom={idx}
                    initial="hidden"
                    animate="show"
                    variants={stagger}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <GameIcon gameId={stat.gameId} size={32} animated />
                        <p className="text-lg font-semibold text-[var(--text-primary)]">
                          {game.label}
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                        {stat.gamesPlayed} played
                      </span>
                    </div>

                    {/* Win-rate mini bar */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: game.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${gameWinRate}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold text-[var(--text-secondary)]">
                        {gameWinRate}% wr
                      </span>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-[var(--text-tertiary)]">Wins</dt>
                        <dd className="mt-1 font-semibold text-[var(--text-primary)]">{stat.gamesWon}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--text-tertiary)]">High score</dt>
                        <dd className="mt-1 font-semibold text-[var(--text-primary)]">{stat.highScore}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--text-tertiary)]">Total score</dt>
                        <dd className="mt-1 font-semibold text-[var(--text-primary)]">{stat.totalScore}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--text-tertiary)]">Time played</dt>
                        <dd className="mt-1 font-semibold text-[var(--text-primary)]">{formatDuration(stat.totalTime)}</dd>
                      </div>
                    </dl>
                  </motion.div>
                )
              })
            ) : (
              <div className="rounded-[22px] border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-secondary)] md:col-span-2">
                No game stats yet. Finish a round and this view will start filling in automatically.
              </div>
            )}
          </div>
        </motion.div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <motion.div
            className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Totals
            </p>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--text-tertiary)]">Combined score</dt>
                <dd className="font-semibold font-mono text-[var(--text-primary)]">{totals.totalScore.toLocaleString()}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--text-tertiary)]">Time played</dt>
                <dd className="font-semibold text-[var(--text-primary)]">{formatDuration(totals.totalTime)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--text-tertiary)]">Avg score/game</dt>
                <dd className="font-semibold font-mono text-[var(--text-primary)]">{avgScore}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--text-tertiary)]">Best single score</dt>
                <dd className="font-semibold font-mono text-[var(--text-primary)]">{totals.highScore}</dd>
              </div>
            </dl>
          </motion.div>

          {/* Recent matches */}
          <motion.div
            className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Recent matches
            </p>
            <div className="mt-4 space-y-3">
              {recentResults.length > 0 ? (
                recentResults.map((result, i) => (
                  <motion.div
                    key={result.id}
                    className="rounded-[18px] border border-[var(--border)] bg-[var(--background)]/55 px-4 py-4 transition-colors hover:bg-[var(--surface-hover)]"
                    custom={i}
                    initial="hidden"
                    animate="show"
                    variants={stagger}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <GameIcon gameId={result.gameId} size={22} />
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {GAME_META[result.gameId]?.label ?? result.gameId}
                        </p>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {formatRelative(result.createdAt)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <p className="text-[var(--text-secondary)]">
                          Room {result.room.code}
                        </p>
                        {result.isWinner && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-500)' }}>
                            🏆
                          </span>
                        )}
                      </div>
                      <p className="font-semibold font-mono text-[var(--text-primary)]">
                        {result.score} pts
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-[18px] border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-secondary)]">
                  Nothing here yet. Create a room and start the first match.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
