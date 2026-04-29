import { AdminAnalyticsClient } from '@/components/admin/AdminAnalyticsClient'
import { getAdminAnalytics, normalizeAnalyticsFilters } from '@/lib/adminAnalytics'

function getSingleValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const filters = normalizeAnalyticsFilters({
    range: getSingleValue(searchParams.range),
  })

  const result = await getAdminAnalytics(filters)

  return (
    <AdminAnalyticsClient
      filters={result.filters}
      summary={result.summary}
      trend={result.trend}
      gameBreakdown={result.gameBreakdown}
      questionStatusCounts={result.questionStatusCounts}
      recentActions={result.recentActions}
    />
  )
}
