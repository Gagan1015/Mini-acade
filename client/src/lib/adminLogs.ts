import { prisma } from '@arcado/db'
import type { Prisma } from '@arcado/db'

export const ADMIN_LOGS_PAGE_SIZE = 25

export type AdminLogFilters = {
  page: number
  actor: string
  action: string
  targetType: string
  dateFrom: string
  dateTo: string
}

export function normalizeAdminLogFilters(input: {
  page?: string
  actor?: string
  action?: string
  targetType?: string
  dateFrom?: string
  dateTo?: string
}): AdminLogFilters {
  const parsedPage = Number(input.page ?? '1')

  return {
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1,
    actor: input.actor?.trim() ?? '',
    action: input.action?.trim() ?? '',
    targetType: input.targetType?.trim() ?? '',
    dateFrom: input.dateFrom?.trim() ?? '',
    dateTo: input.dateTo?.trim() ?? '',
  }
}

export async function getAdminLogs(filters: AdminLogFilters) {
  const where = buildAdminLogWhere(filters)
  const skip = (filters.page - 1) * ADMIN_LOGS_PAGE_SIZE

  const [totalCount, logs, distinctActions, distinctTargetTypes] = await Promise.all([
    prisma.adminLog.count({ where }),
    prisma.adminLog.findMany({
      where,
      take: ADMIN_LOGS_PAGE_SIZE,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.adminLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    }),
    prisma.adminLog.findMany({
      where: {
        targetType: {
          not: null,
        },
      },
      distinct: ['targetType'],
      select: { targetType: true },
      orderBy: { targetType: 'asc' },
    }),
  ])

  return {
    filters,
    totalCount,
    pageSize: ADMIN_LOGS_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_LOGS_PAGE_SIZE)),
    availableActions: distinctActions.map((entry) => entry.action),
    availableTargetTypes: distinctTargetTypes
      .map((entry) => entry.targetType)
      .filter((value): value is string => Boolean(value)),
    logs: logs.map((log) => ({
      id: log.id,
      action: log.action,
      actorId: log.actorId,
      actorName: log.actor.name ?? 'Unknown',
      actorEmail: log.actor.email ?? '',
      actorRole: log.actor.role,
      targetType: log.targetType,
      targetId: log.targetId,
      details: (log.details as Record<string, unknown> | null) ?? null,
      createdAt: log.createdAt.toISOString(),
    })),
  }
}

function buildAdminLogWhere(filters: AdminLogFilters): Prisma.AdminLogWhereInput {
  const createdAt: Prisma.DateTimeFilter = {}

  if (filters.dateFrom) {
    createdAt.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`)
  }

  if (filters.dateTo) {
    createdAt.lte = new Date(`${filters.dateTo}T23:59:59.999Z`)
  }

  return {
    ...(filters.actor
      ? {
          actor: {
            OR: [
              { name: { contains: filters.actor, mode: 'insensitive' } },
              { email: { contains: filters.actor, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.targetType ? { targetType: filters.targetType } : {}),
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
  }
}
