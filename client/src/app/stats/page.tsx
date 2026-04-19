import Link from 'next/link'
import { prisma } from '@mini-arcade/db'
import { AppLayout } from '@/components/layout/AppLayout'
import { requireSession } from '@/lib/admin'

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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(value)
}

export default async function StatsPage() {
  const session = await requireSession()

  const [gameStats, recentResults] = await Promise.all([
    prisma.gameStat.findMany({
      where: { userId: session.user.id },
      orderBy: [{ gamesPlayed: 'desc' }, { totalScore: 'desc' }],
    }),
    prisma.gameResult.findMany({
      where: { userId: session.user.id },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        room: {
          select: {
            code: true,
          },
        },
      },
    }),
  ])

  const totals = gameStats.reduce(
    (accumulator, stat) => {
      accumulator.gamesPlayed += stat.gamesPlayed
      accumulator.gamesWon += stat.gamesWon
      accumulator.totalScore += stat.totalScore
      accumulator.highScore = Math.max(accumulator.highScore, stat.highScore)
      accumulator.totalTime += stat.totalTime
      return accumulator
    },
    {
      gamesPlayed: 0,
      gamesWon: 0,
      totalScore: 0,
      highScore: 0,
      totalTime: 0,
    }
  )

  const winRate = totals.gamesPlayed > 0 ? Math.round((totals.gamesWon / totals.gamesPlayed) * 100) : 0
  const favoriteGame = gameStats[0]

  return (
    <AppLayout variant="marketing">
      <div className="marketing-rail-layout overflow-hidden bg-[var(--background)]">
        <section className="marketing-rail-section border-b border-[var(--marketing-hairline)]">
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-18">
            <div className="flex flex-col gap-10">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:items-end">
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

                <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Favorite game
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
                    {favoriteGame ? (GAME_META[favoriteGame.gameId]?.label ?? favoriteGame.gameId) : 'No games yet'}
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {favoriteGame
                      ? `${favoriteGame.gamesPlayed} matches played in your most active mode.`
                      : 'Play your first room to start building a history.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Games played
                  </p>
                  <p className="font-display mt-3 text-4xl font-bold text-[var(--text-primary)]">
                    {totals.gamesPlayed}
                  </p>
                </div>
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Wins
                  </p>
                  <p className="font-display mt-3 text-4xl font-bold text-[var(--text-primary)]">
                    {totals.gamesWon}
                  </p>
                </div>
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Win rate
                  </p>
                  <p className="font-display mt-3 text-4xl font-bold text-[var(--text-primary)]">
                    {winRate}%
                  </p>
                </div>
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Best score
                  </p>
                  <p className="font-display mt-3 text-4xl font-bold text-[var(--text-primary)]">
                    {totals.highScore}
                  </p>
                </div>
              </div>

              <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)]">
                <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]">
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
                      gameStats.map((stat) => {
                        const game = GAME_META[stat.gameId] ?? { label: stat.gameId, color: 'var(--marketing-accent)' }

                        return (
                          <div
                            key={stat.id}
                            className="rounded-[22px] border border-[var(--border)] bg-[var(--background)]/55 p-5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: game.color }}
                                />
                                <p className="text-lg font-semibold text-[var(--text-primary)]">
                                  {game.label}
                                </p>
                              </div>
                              <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                                {stat.gamesPlayed} played
                              </span>
                            </div>

                            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
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
                          </div>
                        )
                      })
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-secondary)] md:col-span-2">
                        No game stats yet. Finish a round and this view will start filling in automatically.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      Totals
                    </p>
                    <dl className="mt-4 space-y-4 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[var(--text-tertiary)]">Combined score</dt>
                        <dd className="font-semibold text-[var(--text-primary)]">{totals.totalScore}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[var(--text-tertiary)]">Time played</dt>
                        <dd className="font-semibold text-[var(--text-primary)]">{formatDuration(totals.totalTime)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[var(--text-tertiary)]">Recent results</dt>
                        <dd className="font-semibold text-[var(--text-primary)]">{recentResults.length}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      Recent matches
                    </p>
                    <div className="mt-4 space-y-3">
                      {recentResults.length > 0 ? (
                        recentResults.map((result) => (
                          <div
                            key={result.id}
                            className="rounded-[18px] border border-[var(--border)] bg-[var(--background)]/55 px-4 py-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-[var(--text-primary)]">
                                {GAME_META[result.gameId]?.label ?? result.gameId}
                              </p>
                              <p className="text-xs text-[var(--text-tertiary)]">
                                {formatDate(result.createdAt)}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                              <p className="text-[var(--text-secondary)]">
                                Room {result.room.code}
                              </p>
                              <p className="font-semibold text-[var(--text-primary)]">
                                {result.score} pts
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[18px] border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-secondary)]">
                          Nothing here yet. Create a room and start the first match.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
