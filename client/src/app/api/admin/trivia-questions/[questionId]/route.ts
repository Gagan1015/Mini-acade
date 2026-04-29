import { prisma } from '@arcado/db'
import { NextRequest, NextResponse } from 'next/server'

import { createAdminLog, requireAdminApiSession } from '@/lib/admin'
import {
  TRIVIA_LIFECYCLE_STATUSES,
  type TriviaLifecycleStatus,
} from '@/lib/adminGames'

const allowedStatuses = new Set<string>(TRIVIA_LIFECYCLE_STATUSES)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { questionId: string } },
) {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const body = (await request.json()) as {
    status?: string
    note?: string
  }

  const nextStatus = body.status?.trim() ?? ''
  const note = body.note?.trim() ?? ''

  if (!allowedStatuses.has(nextStatus)) {
    return NextResponse.json({ error: 'Invalid trivia lifecycle status.' }, { status: 400 })
  }

  const existingQuestion = await prisma.triviaQuestion.findUnique({
    where: { id: params.questionId },
    select: {
      id: true,
      question: true,
      status: true,
      reportCount: true,
      usageCount: true,
    },
  })

  if (!existingQuestion) {
    return NextResponse.json({ error: 'Trivia question not found.' }, { status: 404 })
  }

  if (existingQuestion.status === nextStatus) {
    return NextResponse.json({ error: 'Question is already in that status.' }, { status: 400 })
  }

  const updatedQuestion = await prisma.triviaQuestion.update({
    where: { id: params.questionId },
    data: {
      status: nextStatus as TriviaLifecycleStatus,
    },
  })

  await createAdminLog({
    actorId: session.user.id,
    action: 'trivia.question.update_status',
    targetType: 'TRIVIA_QUESTION',
    targetId: updatedQuestion.id,
    details: {
      question: existingQuestion.question,
      previousStatus: existingQuestion.status,
      nextStatus,
      reportCount: existingQuestion.reportCount,
      usageCount: existingQuestion.usageCount,
      note: note || null,
    },
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  })

  return NextResponse.json({
    success: true,
    question: {
      id: updatedQuestion.id,
      status: updatedQuestion.status,
      updatedAt: updatedQuestion.updatedAt.toISOString(),
    },
  })
}
