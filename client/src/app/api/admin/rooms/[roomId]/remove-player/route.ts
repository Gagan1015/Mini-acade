import { prisma } from '@arcado/db'
import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApiSession } from '@/lib/admin'

const REALTIME_SERVER_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const body = (await request.json()) as {
    targetUserId?: string
    reason?: string
  }

  const targetUserId = body.targetUserId?.trim() ?? ''
  const reason = body.reason?.trim() ?? ''

  if (!targetUserId) {
    return NextResponse.json({ error: 'Target player is required.' }, { status: 400 })
  }

  if (!reason) {
    return NextResponse.json(
      { error: 'A reason is required to remove a player.' },
      { status: 400 },
    )
  }

  const room = await prisma.room.findUnique({
    where: { id: params.roomId },
    select: {
      code: true,
    },
  })

  if (!room) {
    return NextResponse.json({ error: 'Room not found.' }, { status: 404 })
  }

  const response = await fetch(`${REALTIME_SERVER_URL}/admin/rooms/${room.code}/remove-player`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: request.headers.get('cookie') ?? '',
      'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
      'user-agent': request.headers.get('user-agent') ?? '',
    },
    body: JSON.stringify({ targetUserId, reason }),
    cache: 'no-store',
  })

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: string
        success?: boolean
        targetName?: string
        wasHost?: boolean
        roomClosed?: boolean
        remainingPlayerCount?: number
      }
    | null

  if (!response.ok) {
    return NextResponse.json(
      { error: payload?.error ?? 'Unable to remove player right now.' },
      { status: response.status },
    )
  }

  return NextResponse.json(payload ?? { success: true })
}
