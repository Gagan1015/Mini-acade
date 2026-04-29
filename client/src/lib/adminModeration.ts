import { prisma } from '@arcado/db'
import type { Prisma } from '@arcado/db'

export const MODERATION_PAGE_SIZE = 20

export const MODERATION_ACTIONS = [
  'approve',
  'reject',
  'hide',
  'escalate',
  'mark_reviewed',
] as const

export type ModerationAction = (typeof MODERATION_ACTIONS)[number]

export const MODERATION_REASON_CODES = [
  'report_threshold',
  'incorrect_answer',
  'low_quality',
  'duplicate',
  'off_topic',
  'offensive',
  'manual_review',
  'approved_after_review',
  'other',
] as const

export type ModerationReasonCode = (typeof MODERATION_REASON_CODES)[number]

export const TRIVIA_MODERATION_STATUSES = [
  'approved',
  'reviewed',
  'escalated',
  'hidden',
  'rejected',
] as const

export type TriviaModerationStatus = (typeof TRIVIA_MODERATION_STATUSES)[number]

export type ModerationFilters = {
  page: number
  status: string
  contentType: string
  reportMin: number
  search: string
}

export function normalizeModerationFilters(input: {
  page?: string
  status?: string
  contentType?: string
  reportMin?: string
  search?: string
}): ModerationFilters {
  const parsedPage = Number(input.page ?? '1')
  const parsedReportMin = Number(input.reportMin ?? '1')

  return {
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1,
    status: input.status?.trim() ?? '',
    contentType: input.contentType?.trim() || 'TRIVIA_QUESTION',
    reportMin:
      Number.isFinite(parsedReportMin) && parsedReportMin >= 0 ? Math.floor(parsedReportMin) : 1,
    search: input.search?.trim() ?? '',
  }
}

export async function getModerationQueue(filters: ModerationFilters) {
  const where = buildModerationWhere(filters)
  const skip = (filters.page - 1) * MODERATION_PAGE_SIZE

  const [totalCount, questions, countsByStatus] = await Promise.all([
    prisma.triviaQuestion.count({ where }),
    prisma.triviaQuestion.findMany({
      where,
      orderBy: [
        { reportCount: 'desc' },
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: MODERATION_PAGE_SIZE,
    }),
    prisma.triviaQuestion.groupBy({
      by: ['status'],
      where: {
        OR: [{ reportCount: { gt: 0 } }, { status: { not: 'approved' } }],
      },
      _count: {
        _all: true,
      },
    }),
  ])

  const questionIds = questions.map((question) => question.id)
  const historyLogs = questionIds.length
    ? await prisma.adminLog.findMany({
        where: {
          targetType: 'TRIVIA_QUESTION',
          targetId: {
            in: questionIds,
          },
        },
        include: {
          actor: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    : []

  const historyByQuestionId = historyLogs.reduce(
    (accumulator, log) => {
      if (!log.targetId) {
        return accumulator
      }

      if (!accumulator[log.targetId]) {
        accumulator[log.targetId] = []
      }

      accumulator[log.targetId].push({
        id: log.id,
        action: log.action,
        actorName: log.actor.name ?? log.actor.email ?? 'Unknown',
        actorEmail: log.actor.email ?? '',
        actorRole: log.actor.role,
        details: (log.details as Record<string, unknown> | null) ?? null,
        createdAt: log.createdAt.toISOString(),
      })

      return accumulator
    },
    {} as Record<
      string,
      Array<{
        id: string
        action: string
        actorName: string
        actorEmail: string
        actorRole: string
        details: Record<string, unknown> | null
        createdAt: string
      }>
    >,
  )

  return {
    filters,
    totalCount,
    pageSize: MODERATION_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / MODERATION_PAGE_SIZE)),
    availableStatuses: Array.from(TRIVIA_MODERATION_STATUSES),
    availableContentTypes: ['TRIVIA_QUESTION'],
    statusCounts: countsByStatus.map((entry) => ({
      status: entry.status,
      count: entry._count._all,
    })),
    items: questions.map((question) => ({
      id: question.id,
      contentType: 'TRIVIA_QUESTION',
      title: question.question,
      status: question.status,
      reportCount: question.reportCount,
      usageCount: question.usageCount,
      correctCount: question.correctCount,
      category: question.category,
      difficulty: question.difficulty,
      source: question.source,
      explanation: question.explanation,
      tags: question.tags,
      answers: question.answers as Prisma.JsonValue,
      correctId: question.correctId,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
      lastUsedAt: question.lastUsedAt?.toISOString() ?? null,
      history: historyByQuestionId[question.id] ?? [],
    })),
  }
}

export function getModerationStatusForAction(action: ModerationAction): TriviaModerationStatus {
  switch (action) {
    case 'approve':
      return 'approved'
    case 'reject':
      return 'rejected'
    case 'hide':
      return 'hidden'
    case 'escalate':
      return 'escalated'
    case 'mark_reviewed':
      return 'reviewed'
  }
}

function buildModerationWhere(filters: ModerationFilters): Prisma.TriviaQuestionWhereInput {
  const andClauses: Prisma.TriviaQuestionWhereInput[] = [
    {
      OR: [{ reportCount: { gte: filters.reportMin } }, { status: { not: 'approved' } }],
    },
  ]

  if (filters.contentType && filters.contentType !== 'TRIVIA_QUESTION') {
    andClauses.push({
      id: '__no_results__',
    })
  }

  if (filters.status) {
    andClauses.push({
      status: filters.status,
    })
  }

  if (filters.search) {
    andClauses.push({
      OR: [
        { question: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
        { difficulty: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } },
      ],
    })
  }

  return {
    AND: andClauses,
  }
}
