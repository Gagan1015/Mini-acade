import { prisma, type Prisma } from '@mini-arcade/db'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

import { authOptions } from './auth'

export async function requireSession() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  return session
}

export async function requireAdminSession() {
  const session = await requireSession()

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  return session
}

export async function requireAdminApiSession() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return session
}

export async function createAdminLog(input: {
  actorId: string
  action: string
  targetType?: string
  targetId?: string
  details?: Prisma.InputJsonValue
  ipAddress?: string
  userAgent?: string
}) {
  await prisma.adminLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      details: input.details,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  })
}
