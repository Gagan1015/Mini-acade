import { prisma } from '@arcado/db'

export const ANALYTICS_RANGES = ['7d', '30d', '90d'] as const

export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number]

export type AnalyticsFilters = {
  range: AnalyticsRange
}

type AnalyticsPoint = {
  label: string
  value: number
}

type GameBreakdownEntry = {
  gameId: string
  rooms: number
  plays: number
}

type RecentAdminAction = {
  id: string
  action: string
  actorName: string
  actorEmail: string
  createdAt: string
}

export function normalizeAnalyticsFilters(input: {
  range?: string
}): AnalyticsFilters {
  const range = input.range?.trim() ?? '30d'

  return {
    range: ANALYTICS_RANGES.includes(range as AnalyticsRange)
      ? (range as AnalyticsRange)
      : '30d',
  }
}

export async function getAdminAnalytics(filters: AnalyticsFilters) {
  const config = getRangeConfig(filters.range)
  const now = new Date()
  const end = addDays(startOfDay(now), 1)
  const start = addDays(end, -config.days)

  const [
    users,
    rooms,
    gameResults,
    activeRoomsNow,
    activeAnnouncements,
    adminActionsInRange,
    moderationActionsInRange,
    questionStatusCountsRaw,
    reportedQuestions,
    restrictedQuestions,
    recentLogs,
  ] = await Promise.all([
    prisma.user.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      select: {
        createdAt: true,
      },
    }),
    prisma.room.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      select: {
        createdAt: true,
        gameId: true,
        status: true,
      },
    }),
    prisma.gameResult.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      select: {
        createdAt: true,
        gameId: true,
      },
    }),
    prisma.room.count({
      where: {
        status: {
          in: ['WAITING', 'PLAYING'],
        },
      },
    }),
    prisma.announcement.count({
      where: {
        isActive: true,
        startsAt: {
          lte: now,
        },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
    }),
    prisma.adminLog.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    }),
    prisma.adminLog.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
        action: {
          startsWith: 'moderation.',
        },
      },
    }),
    prisma.triviaQuestion.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    }),
    prisma.triviaQuestion.count({
      where: {
        reportCount: {
          gt: 0,
        },
      },
    }),
    prisma.triviaQuestion.count({
      where: {
        status: {
          in: ['hidden', 'rejected', 'escalated'],
        },
      },
    }),
    prisma.adminLog.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      take: 12,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        actor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ])

  const roomsByGame = rooms.reduce(
    (accumulator, room) => {
      accumulator.set(room.gameId, (accumulator.get(room.gameId) ?? 0) + 1)
      return accumulator
    },
    new Map<string, number>(),
  )

  const playsByGame = gameResults.reduce(
    (accumulator, result) => {
      accumulator.set(result.gameId, (accumulator.get(result.gameId) ?? 0) + 1)
      return accumulator
    },
    new Map<string, number>(),
  )

  const gameIds = Array.from(new Set([...roomsByGame.keys(), ...playsByGame.keys()])).sort()
  const gameBreakdown: GameBreakdownEntry[] = gameIds.map((gameId) => ({
    gameId,
    rooms: roomsByGame.get(gameId) ?? 0,
    plays: playsByGame.get(gameId) ?? 0,
  }))

  const trend = {
    users: countByBuckets(users, start, config),
    rooms: countByBuckets(rooms, start, config),
    games: countByBuckets(gameResults, start, config),
  }

  const questionStatusCounts = questionStatusCountsRaw.map((entry) => ({
    status: entry.status,
    count: entry._count._all,
  }))

  return {
    filters,
    summary: {
      usersAdded: users.length,
      roomsCreated: rooms.length,
      gamesPlayed: gameResults.length,
      adminActions: adminActionsInRange,
      activeRoomsNow,
      activeAnnouncements,
      moderationActions: moderationActionsInRange,
      reportedQuestions,
      restrictedQuestions,
    },
    trend,
    gameBreakdown,
    questionStatusCounts,
    recentActions: recentLogs.map((log): RecentAdminAction => ({
      id: log.id,
      action: log.action,
      actorName: log.actor.name ?? log.actor.email ?? 'Unknown',
      actorEmail: log.actor.email ?? '',
      createdAt: log.createdAt.toISOString(),
    })),
  }
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function getRangeConfig(range: AnalyticsRange) {
  if (range === '7d') {
    return {
      days: 7,
      bucketSize: 1,
      label: 'weekday' as const,
    }
  }

  if (range === '90d') {
    return {
      days: 91,
      bucketSize: 7,
      label: 'month-day' as const,
    }
  }

  return {
    days: 30,
    bucketSize: 1,
    label: 'month-day' as const,
  }
}

function countByBuckets(
  records: Array<{ createdAt: Date }>,
  start: Date,
  config: {
    days: number
    bucketSize: number
    label: 'weekday' | 'month-day'
  },
): AnalyticsPoint[] {
  const totalBuckets = Math.ceil(config.days / config.bucketSize)
  const counts = new Map<number, number>()

  records.forEach((record) => {
    const diff = Math.floor(
      (startOfDay(record.createdAt).getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
    )

    if (diff < 0 || diff >= config.days) {
      return
    }

    const bucketIndex = Math.floor(diff / config.bucketSize)
    counts.set(bucketIndex, (counts.get(bucketIndex) ?? 0) + 1)
  })

  return Array.from({ length: totalBuckets }, (_, index) => {
    const bucketStart = addDays(start, index * config.bucketSize)
    return {
      label:
        config.label === 'weekday'
          ? bucketStart.toLocaleDateString('en-US', { weekday: 'short' })
          : bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: counts.get(index) ?? 0,
    }
  })
}
