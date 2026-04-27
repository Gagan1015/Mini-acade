import { prisma } from '@arcado/db'
import { NextResponse } from 'next/server'

import { requireAdminApiSession } from '@/lib/admin'

export async function GET() {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const games = await prisma.gameConfig.findMany({
    orderBy: { gameId: 'asc' },
  })

  return NextResponse.json(games)
}
