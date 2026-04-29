import { prisma } from '@arcado/db'
import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApiSession } from '@/lib/admin'

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const query = request.nextUrl.searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [], rooms: [], games: [] })
  }

  const [users, rooms, games] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { id: { equals: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.room.findMany({
      where: {
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          { gameId: { contains: query, mode: 'insensitive' } },
          { id: { equals: query } },
        ],
      },
      select: {
        id: true,
        code: true,
        gameId: true,
        status: true,
        createdAt: true,
        creator: { select: { name: true } },
        _count: { select: { players: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.gameConfig.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { gameId: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        gameId: true,
        name: true,
        isEnabled: true,
      },
      take: 5,
    }),
  ])

  return NextResponse.json({ users, rooms, games })
}
