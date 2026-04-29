import { prisma } from '@arcado/db'
import { NextRequest, NextResponse } from 'next/server'

import { createAdminLog, requireAdminApiSession } from '@/lib/admin'
import { canAssignRole, canManageRole } from '@/lib/adminRoles'

const allowedRoles = new Set(['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'])
const allowedStatuses = new Set(['ACTIVE', 'SUSPENDED', 'BANNED'])

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      _count: {
        select: {
          roomsCreated: true,
          roomPlayers: true,
          gameResults: true,
          sessions: true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const [gameStats, recentResults, recentRooms, adminLogs] = await Promise.all([
    prisma.gameStat.findMany({
      where: { userId: params.userId },
      orderBy: [{ gamesPlayed: 'desc' }, { totalScore: 'desc' }],
    }),
    prisma.gameResult.findMany({
      where: { userId: params.userId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        room: { select: { code: true, gameId: true } },
      },
    }),
    prisma.room.findMany({
      where: {
        players: { some: { userId: params.userId } },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        gameId: true,
        status: true,
        createdAt: true,
        _count: { select: { players: true } },
      },
    }),
    prisma.adminLog.findMany({
      where: {
        OR: [
          { targetId: params.userId, targetType: 'USER' },
          { actorId: params.userId },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { name: true, email: true } },
      },
    }),
  ])

  return NextResponse.json({
    user,
    gameStats,
    recentResults: recentResults.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    recentRooms: recentRooms.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    adminLogs: adminLogs.map((l) => ({
      id: l.id,
      action: l.action,
      actorName: l.actor.name ?? l.actor.email ?? 'Unknown',
      details: l.details,
      createdAt: l.createdAt.toISOString(),
    })),
  })
}

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

  if (!nextRole && !nextStatus) {
    return NextResponse.json({ error: 'No changes requested' }, { status: 400 })
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      role: true,
      status: true,
    },
  })

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const actorId = session.user.id
  const actorRole = session.user.role

  if (
    targetUser.id === actorId &&
    ((nextRole && nextRole !== targetUser.role) || (nextStatus && nextStatus !== targetUser.status))
  ) {
    return NextResponse.json(
      { error: 'You cannot change your own admin role or account status.' },
      { status: 403 },
    )
  }

  if (!canManageRole(actorRole, targetUser.role)) {
    return NextResponse.json(
      { error: 'You cannot manage users with an equal or higher role.' },
      { status: 403 },
    )
  }

  if (nextRole && !canAssignRole(actorRole, nextRole)) {
    return NextResponse.json(
      { error: 'You cannot assign a role equal to or higher than your own.' },
      { status: 403 },
    )
  }

  const roleChanged = Boolean(nextRole && nextRole !== targetUser.role)
  const statusChanged = Boolean(nextStatus && nextStatus !== targetUser.status)

  if (!roleChanged && !statusChanged) {
    return NextResponse.json({ error: 'No changes to apply.' }, { status: 400 })
  }

  const updatedUser = await prisma.user.update({
    where: { id: params.userId },
    data: {
      ...(roleChanged
        ? { role: nextRole as 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN' }
        : {}),
      ...(statusChanged
        ? { status: nextStatus as 'ACTIVE' | 'SUSPENDED' | 'BANNED' }
        : {}),
    },
  })

  await createAdminLog({
    actorId,
    action: 'user.update',
    targetType: 'USER',
    targetId: updatedUser.id,
    details: {
      previousRole: targetUser.role,
      nextRole: nextRole ?? targetUser.role,
      previousStatus: targetUser.status,
      nextStatus: nextStatus ?? targetUser.status,
    },
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  })

  return NextResponse.json(updatedUser)
}
