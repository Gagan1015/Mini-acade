import { prisma } from '@mini-arcade/db'
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient'

export default async function AdminOverviewPage() {
  const [
    totalUsers,
    activeRooms,
    totalRooms,
    totalGamesPlayed,
    gameConfigs,
    recentLogs,
    recentRooms,
    topUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.room.count({ where: { status: { in: ['WAITING', 'PLAYING'] } } }),
    prisma.room.count(),
    prisma.gameResult.count(),
    prisma.gameConfig.findMany({ orderBy: { gameId: 'asc' } }),
    prisma.adminLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { name: true, email: true } },
      },
    }),
    prisma.room.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true, email: true } },
        _count: { select: { players: true, gameResults: true } },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        image: true,
      },
    }),
  ])

  // Per-game room counts
  const roomsByGame = await prisma.room.groupBy({
    by: ['gameId'],
    _count: { id: true },
  })

  const gameBreakdown = roomsByGame.map((r) => ({
    gameId: r.gameId,
    count: r._count.id,
  }))

  return (
    <AdminDashboardClient
      stats={{
        totalUsers,
        activeRooms,
        totalRooms,
        totalGamesPlayed,
      }}
      gameConfigs={gameConfigs.map((g) => ({
        id: g.id,
        gameId: g.gameId,
        name: g.name,
        isEnabled: g.isEnabled,
      }))}
      gameBreakdown={gameBreakdown}
      recentLogs={recentLogs.map((log) => ({
        id: log.id,
        action: log.action,
        actorName: log.actor.email ?? log.actor.name ?? 'Unknown',
        createdAt: log.createdAt.toISOString(),
      }))}
      recentRooms={recentRooms.map((room) => ({
        id: room.id,
        code: room.code,
        gameId: room.gameId,
        status: room.status,
        creatorName: room.creator.email ?? room.creator.name ?? 'Unknown',
        playerCount: room._count.players,
        createdAt: room.createdAt.toISOString(),
      }))}
      topUsers={topUsers.map((u) => ({
        id: u.id,
        name: u.name ?? 'Unnamed',
        email: u.email ?? '',
        role: u.role,
        status: u.status,
        image: u.image,
        createdAt: u.createdAt.toISOString(),
      }))}
    />
  )
}
