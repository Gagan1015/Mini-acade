import { AdminLogsClient } from '@/components/admin/AdminLogsClient'
import { getAdminLogs, normalizeAdminLogFilters } from '@/lib/adminLogs'

function getSingleValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const filters = normalizeAdminLogFilters({
    page: getSingleValue(searchParams.page),
    actor: getSingleValue(searchParams.actor),
    action: getSingleValue(searchParams.action),
    targetType: getSingleValue(searchParams.targetType),
    dateFrom: getSingleValue(searchParams.dateFrom),
    dateTo: getSingleValue(searchParams.dateTo),
  })

  const result = await getAdminLogs(filters)

  return (
    <AdminLogsClient
      logs={result.logs}
      filters={result.filters}
      totalCount={result.totalCount}
      totalPages={result.totalPages}
      pageSize={result.pageSize}
      availableActions={result.availableActions}
      availableTargetTypes={result.availableTargetTypes}
    />
  )
}
