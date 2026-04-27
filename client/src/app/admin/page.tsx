import { prisma } from '@arcado/db'
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient'

type RoomCreationPoint = {
  label: string
  value: number
}

type RoomCreationAnalytics = {
  week: RoomCreationPoint[]
  month: RoomCreationPoint[]
  year: RoomCreationPoint[]
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function startOfWeek(date: Date) {
  const day = date.getDay()
  const daysSinceMonday = (day + 6) % 7
  return addDays(startOfDay(date), -daysSinceMonday)
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function countRoomsByDay(rooms: Array<{ createdAt: Date }>, start: Date, days: number): RoomCreationPoint[] {
  const counts = new Map<string, number>()
  rooms.forEach((room) => {
    counts.set(dateKey(room.createdAt), (counts.get(dateKey(room.createdAt)) ?? 0) + 1)
  })

  return Array.from({ length: days }, (_, index) => {
    const date = addDays(start, index)
    return {
      label: date.toLocaleDateString('en-US', days <= 7 ? { weekday: 'short' } : { day: 'numeric' }),
      value: counts.get(dateKey(date)) ?? 0,
    }
  })
}

function buildRoomCreationAnalytics(rooms: Array<{ createdAt: Date }>, now = new Date()): RoomCreationAnalytics {
  const weekStart = startOfWeek(now)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  return {
    week: countRoomsByDay(
      rooms.filter((room) => room.createdAt >= weekStart && room.createdAt < addDays(weekStart, 7)),
      weekStart,
      7
    ),
    month: countRoomsByDay(
      rooms.filter((room) => room.createdAt >= monthStart && room.createdAt < addDays(monthStart, daysInMonth)),
      monthStart,
      daysInMonth
    ),
    year: Array.from({ length: 12 }, (_, month) => {
      const start = new Date(now.getFullYear(), month, 1)
      const end = new Date(now.getFullYear(), month + 1, 1)
      return {
        label: start.toLocaleDateString('en-US', { month: 'short' }),
        value: rooms.filter((room) => room.createdAt >= start && room.createdAt < end).length,
      }
    }),
  }
}

export default async function AdminOverviewPage() {
  const now = new Date()
  const analyticsStart = new Date(now.getFullYear(), 0, 1)
  const analyticsEnd = new Date(now.getFullYear() + 1, 0, 1)
  const [
    totalUsers,
    activeRooms,
    totalRooms,
    totalGamesPlayed,
    gameConfigs,
    recentLogs,
    recentRooms,
    topUsers,
    roomCreationRooms,
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
    prisma.room.findMany({
      where: {
        createdAt: {
          gte: analyticsStart,
          lt: analyticsEnd,
        },
      },
      select: {
        createdAt: true,
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
  const roomCreationAnalytics = buildRoomCreationAnalytics(roomCreationRooms, now)

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
      roomCreationAnalytics={roomCreationAnalytics}
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
