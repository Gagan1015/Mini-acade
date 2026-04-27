import { prisma } from '@arcado/db'
import { NextResponse } from 'next/server'

import { requireAdminApiSession } from '@/lib/admin'

export async function GET() {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const logs = await prisma.adminLog.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      actor: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  })

  return NextResponse.json(logs)
}
