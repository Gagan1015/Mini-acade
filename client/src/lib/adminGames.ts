import { prisma } from '@arcado/db'
import type { Prisma } from '@arcado/db'

export const TRIVIA_BROWSER_PAGE_SIZE = 20

export const TRIVIA_LIFECYCLE_STATUSES = [
  'approved',
  'reviewed',
  'escalated',
  'hidden',
  'rejected',
] as const

export type TriviaLifecycleStatus = (typeof TRIVIA_LIFECYCLE_STATUSES)[number]

export type TriviaQuestionFilters = {
  page: number
  status: string
  category: string
  difficulty: string
  search: string
}

export function normalizeTriviaQuestionFilters(input: {
  page?: string
  status?: string
  category?: string
  difficulty?: string
  search?: string
}): TriviaQuestionFilters {
  const parsedPage = Number(input.page ?? '1')

  return {
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1,
    status: input.status?.trim() ?? '',
    category: input.category?.trim() ?? '',
    difficulty: input.difficulty?.trim() ?? '',
    search: input.search?.trim() ?? '',
  }
}

export async function getAdminGamesPageData(filters: TriviaQuestionFilters) {
  const where = buildTriviaQuestionWhere(filters)
  const skip = (filters.page - 1) * TRIVIA_BROWSER_PAGE_SIZE

  const [
    gameConfigs,
    totalTriviaCount,
    triviaQuestions,
    distinctCategories,
    distinctDifficulties,
    totalQuestions,
    reportedQuestions,
    restrictedQuestions,
  ] = await Promise.all([
    prisma.gameConfig.findMany({
      orderBy: { gameId: 'asc' },
    }),
    prisma.triviaQuestion.count({ where }),
    prisma.triviaQuestion.findMany({
      where,
      orderBy: [
        { updatedAt: 'desc' },
        { reportCount: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: TRIVIA_BROWSER_PAGE_SIZE,
    }),
    prisma.triviaQuestion.findMany({
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
    }),
    prisma.triviaQuestion.findMany({
      distinct: ['difficulty'],
      select: { difficulty: true },
      orderBy: { difficulty: 'asc' },
    }),
    prisma.triviaQuestion.count(),
    prisma.triviaQuestion.count({
      where: {
        reportCount: {
          gt: 0,
        },
      },
    }),
    prisma.triviaQuestion.count({
      where: {
        status: {
          in: ['hidden', 'rejected', 'escalated'],
        },
      },
    }),
  ])

  const questionIds = triviaQuestions.map((question) => question.id)
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

      if (accumulator[log.targetId].length >= 5) {
        return accumulator
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
    gameConfigs: gameConfigs.map((game) => ({
      id: game.id,
      gameId: game.gameId,
      name: game.name,
      description: game.description,
      isEnabled: game.isEnabled,
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers,
      defaultRounds: game.defaultRounds,
      roundTime: game.roundTime,
      settings: (game.settings as Record<string, unknown> | null) ?? null,
      updatedAt: game.updatedAt.toISOString(),
    })),
    triviaQuestions: triviaQuestions.map((question) => ({
      id: question.id,
      question: question.question,
      status: question.status,
      category: question.category,
      difficulty: question.difficulty,
      reportCount: question.reportCount,
      usageCount: question.usageCount,
      correctCount: question.correctCount,
      lastUsedAt: question.lastUsedAt?.toISOString() ?? null,
      source: question.source,
      tags: question.tags,
      explanation: question.explanation,
      answers: question.answers,
      correctId: question.correctId,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
      recentActions: historyByQuestionId[question.id] ?? [],
    })),
    filters,
    totalTriviaCount,
    triviaPageSize: TRIVIA_BROWSER_PAGE_SIZE,
    totalTriviaPages: Math.max(1, Math.ceil(totalTriviaCount / TRIVIA_BROWSER_PAGE_SIZE)),
    availableStatuses: Array.from(TRIVIA_LIFECYCLE_STATUSES),
    availableCategories: distinctCategories.map((entry) => entry.category),
    availableDifficulties: distinctDifficulties.map((entry) => entry.difficulty),
    summary: {
      totalGames: gameConfigs.length,
      enabledGames: gameConfigs.filter((game) => game.isEnabled).length,
      totalQuestions,
      reportedQuestions,
      restrictedQuestions,
    },
  }
}

function buildTriviaQuestionWhere(filters: TriviaQuestionFilters) {
  const andClauses: Prisma.TriviaQuestionWhereInput[] = []

  if (filters.status) {
    andClauses.push({ status: filters.status })
  }

  if (filters.category) {
    andClauses.push({ category: filters.category })
  }

  if (filters.difficulty) {
    andClauses.push({ difficulty: filters.difficulty })
  }

  if (filters.search) {
    andClauses.push({
      OR: [
        { question: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
        { difficulty: { contains: filters.search, mode: 'insensitive' } },
        { source: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } },
      ],
    })
  }

  return andClauses.length > 0 ? { AND: andClauses } : {}
}
