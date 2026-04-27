import { prisma } from '@arcado/db'
import { NextRequest, NextResponse } from 'next/server'

import { createAdminLog, requireAdminApiSession } from '@/lib/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { gameId: string } },
) {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const body = (await request.json()) as {
    isEnabled?: boolean
    minPlayers?: number
    maxPlayers?: number
    defaultRounds?: number
    roundTime?: number
  }

  const game = await prisma.gameConfig.findUnique({
    where: { gameId: params.gameId },
  })

  if (!game) {
    return NextResponse.json({ error: 'Game config not found' }, { status: 404 })
  }

  const updated = await prisma.gameConfig.update({
    where: { gameId: params.gameId },
    data: {
      ...(body.isEnabled !== undefined ? { isEnabled: body.isEnabled } : {}),
      ...(body.minPlayers !== undefined ? { minPlayers: body.minPlayers } : {}),
      ...(body.maxPlayers !== undefined ? { maxPlayers: body.maxPlayers } : {}),
      ...(body.defaultRounds !== undefined ? { defaultRounds: body.defaultRounds } : {}),
      ...(body.roundTime !== undefined ? { roundTime: body.roundTime } : {}),
    },
  })

  await createAdminLog({
    actorId: session.user.id,
    action: 'game.config',
    targetType: 'GAME_CONFIG',
    targetId: game.id,
    details: JSON.parse(JSON.stringify(body)),
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  })

  return NextResponse.json(updated)
}
