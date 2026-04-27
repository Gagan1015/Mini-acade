import { prisma } from '@arcado/db'
import { AppLayout } from '@/components/layout/AppLayout'
import { requireSession } from '@/lib/admin'
import StatsClient from '@/components/pages/StatsClient'

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

  // Serialize dates for client component
  const serializedGameStats = gameStats.map((g) => ({
    ...g,
    updatedAt: undefined,
  }))

  const serializedResults = recentResults.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    metadata: undefined,
  }))

  return (
    <AppLayout variant="marketing">
      <div className="marketing-rail-layout overflow-hidden bg-[var(--background)]">
        <section className="marketing-rail-section border-b border-[var(--marketing-hairline)]">
          <StatsClient
            gameStats={serializedGameStats}
            recentResults={serializedResults}
          />
        </section>
      </div>
    </AppLayout>
  )
}
