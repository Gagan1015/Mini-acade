import { prisma } from '@mini-arcade/db'
import { AppLayout } from '@/components/layout/AppLayout'
import { requireSession } from '@/lib/admin'
import ProfileClient from '@/components/pages/ProfileClient'

export default async function ProfilePage() {
  const session = await requireSession()

  const [profile, recentResults, activeRooms, gameStats] = await Promise.all([
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
    prisma.gameStat.findMany({
      where: { userId: session.user.id },
      orderBy: [{ gamesPlayed: 'desc' }, { totalScore: 'desc' }],
    }),
  ])

  if (!profile) {
    return null
  }

  // Serialize dates for client component
  const serializedProfile = {
    ...profile,
    createdAt: profile.createdAt.toISOString(),
    lastLoginAt: profile.lastLoginAt?.toISOString() ?? null,
  }

  const serializedResults = recentResults.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    metadata: undefined,
  }))

  const serializedGameStats = gameStats.map((g) => ({
    ...g,
    updatedAt: undefined,
  }))

  return (
    <AppLayout variant="marketing">
      <div className="marketing-rail-layout overflow-hidden bg-[var(--background)]">
        <section className="marketing-rail-section border-b border-[var(--marketing-hairline)]">
          <ProfileClient
            profile={serializedProfile}
            recentResults={serializedResults}
            activeRooms={activeRooms}
            gameStats={serializedGameStats}
          />
        </section>
      </div>
    </AppLayout>
  )
}
