import { prisma } from '@mini-arcade/db'
import { NextRequest, NextResponse } from 'next/server'

import { createAdminLog, requireAdminApiSession } from '@/lib/admin'

const allowedRoles = new Set(['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'])
const allowedStatuses = new Set(['ACTIVE', 'SUSPENDED', 'BANNED'])

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const body = (await request.json()) as {
    role?: string
    status?: string
  }

  const nextRole = body.role?.trim()
  const nextStatus = body.status?.trim()

  if (nextRole && !allowedRoles.has(nextRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  if (nextStatus && !allowedStatuses.has(nextStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updatedUser = await prisma.user.update({
    where: { id: params.userId },
    data: {
      ...(nextRole ? { role: nextRole as 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN' } : {}),
      ...(nextStatus
        ? { status: nextStatus as 'ACTIVE' | 'SUSPENDED' | 'BANNED' }
        : {}),
    },
  })

  await createAdminLog({
    actorId: session.user.id,
    action: 'user.update',
    targetType: 'USER',
    targetId: updatedUser.id,
    details: {
      role: nextRole,
      status: nextStatus,
    },
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  })

  return NextResponse.json(updatedUser)
}
