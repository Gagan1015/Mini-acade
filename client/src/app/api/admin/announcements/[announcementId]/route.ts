import { prisma } from '@arcado/db'
import { NextRequest, NextResponse } from 'next/server'

import { createAdminLog, requireAdminApiSession } from '@/lib/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ announcementId: string }> },
) {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const { announcementId } = await params

  const body = (await request.json()) as {
    title?: string
    message?: string
    type?: string
    isActive?: boolean
    endsAt?: string | null
  }

  const announcement = await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      ...(body.message !== undefined ? { message: body.message.trim() } : {}),
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      ...(body.endsAt !== undefined
        ? { endsAt: body.endsAt ? new Date(body.endsAt) : null }
        : {}),
    },
  })

  await createAdminLog({
    actorId: session.user.id,
    action: 'announcement.update',
    targetType: 'ANNOUNCEMENT',
    targetId: announcement.id,
    details: JSON.parse(JSON.stringify(body)),
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  })

  return NextResponse.json(announcement)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ announcementId: string }> },
) {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const { announcementId } = await params

  await prisma.announcement.delete({
    where: { id: announcementId },
  })

  await createAdminLog({
    actorId: session.user.id,
    action: 'announcement.delete',
    targetType: 'ANNOUNCEMENT',
    targetId: announcementId,
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  })

  return NextResponse.json({ success: true })
}
