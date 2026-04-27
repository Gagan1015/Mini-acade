import { prisma } from '@arcado/db'
import { AdminSettingsClient } from '@/components/admin/AdminSettingsClient'

export default async function AdminSettingsPage() {
  const [gameConfigs, announcements] = await Promise.all([
    prisma.gameConfig.findMany({
      orderBy: { gameId: 'asc' },
    }),
    prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  return (
    <AdminSettingsClient
      gameConfigs={gameConfigs.map((g) => ({
        id: g.id,
        gameId: g.gameId,
        name: g.name,
        description: g.description,
        isEnabled: g.isEnabled,
        minPlayers: g.minPlayers,
        maxPlayers: g.maxPlayers,
        defaultRounds: g.defaultRounds,
        roundTime: g.roundTime,
      }))}
      announcements={announcements.map((a) => ({
        id: a.id,
        title: a.title,
        message: a.message,
        type: a.type,
        isActive: a.isActive,
        startsAt: a.startsAt.toISOString(),
        endsAt: a.endsAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
      }))}
    />
  )
}
