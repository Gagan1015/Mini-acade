import Link from 'next/link'
import { prisma } from '@mini-arcade/db'
import { AppLayout } from '@/components/layout/AppLayout'
import { requireSession } from '@/lib/admin'

const GAME_LABELS: Record<string, string> = {
  skribble: 'Skribble',
  trivia: 'Trivia',
  wordel: 'Wordel',
  flagel: 'Flagel',
}

function formatDate(value?: Date | null) {
  if (!value) return 'Not available yet'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value)
}

function roleTone(role: string) {
  if (role === 'SUPER_ADMIN') return 'bg-[var(--warning-500)]/12 text-[var(--warning-500)]'
  if (role === 'ADMIN') return 'bg-[var(--primary-500)]/12 text-[var(--primary-500)]'
  return 'bg-[var(--surface-hover)] text-[var(--text-secondary)]'
}

function statusTone(status: string) {
  if (status === 'ACTIVE') return 'bg-[var(--success-500)]/12 text-[var(--success-500)]'
  if (status === 'SUSPENDED') return 'bg-[var(--warning-500)]/12 text-[var(--warning-500)]'
  return 'bg-[var(--error-500)]/12 text-[var(--error-500)]'
}

export default async function ProfilePage() {
  const session = await requireSession()

  const [profile, recentResults, activeRooms] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            roomsCreated: true,
            roomPlayers: true,
            gameResults: true,
          },
        },
      },
    }),
    prisma.gameResult.findMany({
      where: { userId: session.user.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        room: {
          select: {
            code: true,
          },
        },
      },
    }),
    prisma.room.count({
      where: {
        players: {
          some: {
            userId: session.user.id,
            leftAt: null,
          },
        },
        status: {
          in: ['WAITING', 'PLAYING'],
        },
      },
    }),
  ])

  if (!profile) {
    return null
  }

  const quickLinks = [
    { href: '/lobby', label: 'Lobby', description: 'Create or join your next room.' },
    { href: '/stats', label: 'My Stats', description: 'See game history and performance.' },
    ...(session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
      ? [{ href: '/admin', label: 'Admin Dashboard', description: 'Manage rooms, users, and game settings.' }]
      : []),
  ]

  return (
    <AppLayout variant="marketing">
      <div className="marketing-rail-layout overflow-hidden bg-[var(--background)]">
        <section className="marketing-rail-section border-b border-[var(--marketing-hairline)]">
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-18">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
              <div className="space-y-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--marketing-accent)]">
                    Account
                  </p>
                  <h1 className="font-display mt-4 text-4xl font-bold tracking-[-0.05em] text-[var(--text-primary)] sm:text-5xl">
                    {profile.name ?? 'Player profile'}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
                    Keep your player identity, room activity, and recent results in one place.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--marketing-shadow)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      Rooms created
                    </p>
                    <p className="font-display mt-3 text-3xl font-bold text-[var(--text-primary)]">
                      {profile._count.roomsCreated}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--marketing-shadow)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      Rooms joined
                    </p>
                    <p className="font-display mt-3 text-3xl font-bold text-[var(--text-primary)]">
                      {profile._count.roomPlayers}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--marketing-shadow)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      Recent activity
                    </p>
                    <p className="font-display mt-3 text-3xl font-bold text-[var(--text-primary)]">
                      {activeRooms}
                    </p>
                  </div>
                </div>

                <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                        Recent results
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                        Latest matches
                      </h2>
                    </div>
                    <Link
                      href="/stats"
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    >
                      View all stats
                    </Link>
                  </div>

                  <div className="mt-6 space-y-3">
                    {recentResults.length > 0 ? (
                      recentResults.map((result) => (
                        <div
                          key={result.id}
                          className="flex flex-col gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--background)]/55 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              {GAME_LABELS[result.gameId] ?? result.gameId}
                            </p>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                              Room {result.room.code} on {formatDate(result.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="rounded-full bg-[var(--surface)] px-3 py-1 font-medium text-[var(--text-secondary)]">
                              {result.rank ? `Rank #${result.rank}` : 'Completed'}
                            </span>
                            <span className="font-semibold text-[var(--text-primary)]">
                              {result.score} pts
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[20px] border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-secondary)]">
                        No finished games yet. Jump into the lobby and start a round.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]">
                  <div className="flex items-center gap-4">
                    {profile.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.image}
                        alt={profile.name ?? 'Player'}
                        className="h-20 w-20 rounded-full border border-[var(--border)] object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-hover)] text-2xl font-semibold text-[var(--text-primary)]">
                        {(profile.name ?? 'P').slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xl font-semibold text-[var(--text-primary)]">
                        {profile.name ?? 'Player'}
                      </p>
                      <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
                        {profile.email ?? 'No email on file'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleTone(profile.role)}`}>
                      {profile.role.replace('_', ' ')}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(profile.status)}`}>
                      {profile.status}
                    </span>
                  </div>

                  <dl className="mt-6 space-y-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[var(--text-tertiary)]">Member since</dt>
                      <dd className="font-medium text-[var(--text-primary)]">{formatDate(profile.createdAt)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[var(--text-tertiary)]">Last sign in</dt>
                      <dd className="font-medium text-[var(--text-primary)]">{formatDate(profile.lastLoginAt)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[var(--text-tertiary)]">Games recorded</dt>
                      <dd className="font-medium text-[var(--text-primary)]">{profile._count.gameResults}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--marketing-shadow)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Pages
                  </p>
                  <div className="mt-4 space-y-3">
                    {quickLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-[18px] border border-[var(--border)] bg-[var(--background)]/55 px-4 py-4 transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {item.description}
                        </p>
                      </Link>
                    ))}
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
