import { prisma } from '@mini-arcade/db'
import { NextResponse } from 'next/server'

import { requireAdminApiSession } from '@/lib/admin'

export async function GET() {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const [totalUsers, activeRooms, totalRooms, gamesPlayed24h, recentLogs] = await Promise.all([
    prisma.user.count(),
    prisma.room.count({ where: { status: { in: ['WAITING', 'PLAYING'] } } }),
    prisma.room.count(),
    prisma.gameResult.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.adminLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
  ])

  return NextResponse.json({
    totalUsers,
    activeRooms,
    totalRooms,
    gamesPlayed24h,
    recentLogs,
  })
}
