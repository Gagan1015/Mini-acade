import { prisma } from '@arcado/db'
import { NextRequest, NextResponse } from 'next/server'

import { createAdminLog, requireAdminApiSession } from '@/lib/admin'
import {
  MODERATION_ACTIONS,
  MODERATION_REASON_CODES,
  getModerationStatusForAction,
  type ModerationAction,
  type ModerationReasonCode,
} from '@/lib/adminModeration'

const allowedActions = new Set<string>(MODERATION_ACTIONS)
const allowedReasonCodes = new Set<string>(MODERATION_REASON_CODES)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { itemId: string } },
) {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const body = (await request.json()) as {
    action?: string
    reasonCode?: string
    note?: string
  }

  const action = body.action?.trim() ?? ''
  const reasonCode = body.reasonCode?.trim() ?? ''
  const note = body.note?.trim() ?? ''

  if (!allowedActions.has(action)) {
    return NextResponse.json({ error: 'Invalid moderation action.' }, { status: 400 })
  }

  if (!allowedReasonCodes.has(reasonCode)) {
    return NextResponse.json({ error: 'A valid reason code is required.' }, { status: 400 })
  }

  const existingQuestion = await prisma.triviaQuestion.findUnique({
    where: { id: params.itemId },
    select: {
      id: true,
      question: true,
      status: true,
      reportCount: true,
      updatedAt: true,
    },
  })

  if (!existingQuestion) {
    return NextResponse.json({ error: 'Moderation item not found.' }, { status: 404 })
  }

  const nextStatus = getModerationStatusForAction(action as ModerationAction)

  const updatedQuestion = await prisma.triviaQuestion.update({
    where: { id: params.itemId },
    data: {
      status: nextStatus,
    },
  })

  await createAdminLog({
    actorId: session.user.id,
    action: `moderation.trivia.${action}`,
    targetType: 'TRIVIA_QUESTION',
    targetId: updatedQuestion.id,
    details: {
      question: existingQuestion.question,
      reasonCode: reasonCode as ModerationReasonCode,
      note: note || null,
      previousStatus: existingQuestion.status,
      nextStatus,
      reportCount: existingQuestion.reportCount,
    },
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  })

  return NextResponse.json({
    success: true,
    item: {
      id: updatedQuestion.id,
      status: updatedQuestion.status,
      updatedAt: updatedQuestion.updatedAt.toISOString(),
    },
  })
}
