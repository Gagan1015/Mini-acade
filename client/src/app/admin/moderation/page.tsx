import { AdminModerationClient } from '@/components/admin/AdminModerationClient'
import { getModerationQueue, normalizeModerationFilters } from '@/lib/adminModeration'

function getSingleValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const filters = normalizeModerationFilters({
    page: getSingleValue(searchParams.page),
    status: getSingleValue(searchParams.status),
    contentType: getSingleValue(searchParams.contentType),
    reportMin: getSingleValue(searchParams.reportMin),
    search: getSingleValue(searchParams.search),
  })

  const result = await getModerationQueue(filters)

  return (
    <AdminModerationClient
      items={result.items}
      filters={result.filters}
      totalCount={result.totalCount}
      totalPages={result.totalPages}
      pageSize={result.pageSize}
      availableStatuses={result.availableStatuses}
      availableContentTypes={result.availableContentTypes}
      statusCounts={result.statusCounts}
    />
  )
}
