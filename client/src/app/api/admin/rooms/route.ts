import { prisma } from '@mini-arcade/db'
import { NextResponse } from 'next/server'

import { requireAdminApiSession } from '@/lib/admin'

export async function GET() {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const rooms = await prisma.room.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { players: true, gameResults: true },
      },
    },
  })

  return NextResponse.json(rooms)
}
