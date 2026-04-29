import { prisma } from '@arcado/db'
import { NextResponse } from 'next/server'

import { requireAdminApiSession } from '@/lib/admin'

export async function GET() {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const [recentLogs, activeRooms, newUsers, activeAnnouncements] =
    await Promise.all([
      // Recent admin actions (last 24h)
      prisma.adminLog.findMany({
        where: { createdAt: { gte: oneDayAgo } },
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
          actor: { select: { name: true, email: true, image: true } },
        },
      }),
      // Currently active rooms
      prisma.room.findMany({
        where: { status: { in: ['WAITING', 'PLAYING'] } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          creator: { select: { name: true } },
          _count: { select: { players: true } },
        },
      }),
      // Users who signed up in the last hour
      prisma.user.findMany({
        where: { createdAt: { gte: oneHourAgo } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      }),
      // Active announcements
      prisma.announcement.findMany({
        where: {
          isActive: true,
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

  const notifications = [
    // New user signups
    ...newUsers.map((user) => ({
      id: `user-${user.id}`,
      type: 'new_user' as const,
      title: 'New user signed up',
      description: user.name || user.email || 'Unknown user',
      image: user.image,
      href: `/admin/users/${user.id}`,
      createdAt: user.createdAt.toISOString(),
    })),
    // Active rooms
    ...activeRooms.map((room) => ({
      id: `room-${room.id}`,
      type: 'active_room' as const,
      title: `Room ${room.code} is ${room.status.toLowerCase()}`,
      description: `${room.gameId} — ${room._count.players} player${room._count.players !== 1 ? 's' : ''} — by ${room.creator.name || 'Unknown'}`,
      href: `/admin/rooms/${room.id}`,
      createdAt: room.createdAt.toISOString(),
    })),
    // Admin actions
    ...recentLogs.map((log) => ({
      id: `log-${log.id}`,
      type: 'admin_action' as const,
      title: formatAction(log.action),
      description: `by ${log.actor.name || log.actor.email || 'Unknown'}`,
      image: log.actor.image,
      href: log.targetId
        ? getTargetHref(log.targetType, log.targetId)
        : '/admin/logs',
      createdAt: log.createdAt.toISOString(),
    })),
  ]

  // Sort all notifications by date, most recent first
  notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return NextResponse.json({
    notifications: notifications.slice(0, 20),
    counts: {
      activeRooms: activeRooms.length,
      newUsers: newUsers.length,
      recentActions: recentLogs.length,
      announcements: activeAnnouncements.length,
    },
  })
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getTargetHref(
  targetType: string | null,
  targetId: string
): string {
  switch (targetType) {
    case 'user':
      return `/admin/users/${targetId}`
    case 'room':
      return `/admin/rooms/${targetId}`
    case 'game':
      return `/admin/games`
    case 'announcement':
      return `/admin/settings`
    default:
      return '/admin/logs'
  }
}
