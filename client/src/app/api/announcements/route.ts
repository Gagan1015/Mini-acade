import { prisma } from '@arcado/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const now = new Date()

  const announcements = await prisma.announcement.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      createdAt: true,
    },
  })

  return NextResponse.json(announcements)
}
