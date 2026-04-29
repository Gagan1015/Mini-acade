import { AdminGamesClient } from '@/components/admin/AdminGamesClient'
import { getAdminGamesPageData, normalizeTriviaQuestionFilters } from '@/lib/adminGames'

function getSingleValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminGamesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const filters = normalizeTriviaQuestionFilters({
    page: getSingleValue(searchParams.page),
    status: getSingleValue(searchParams.status),
    category: getSingleValue(searchParams.category),
    difficulty: getSingleValue(searchParams.difficulty),
    search: getSingleValue(searchParams.search),
  })

  const result = await getAdminGamesPageData(filters)

  return (
    <AdminGamesClient
      gameConfigs={result.gameConfigs}
      triviaQuestions={result.triviaQuestions}
      filters={result.filters}
      totalTriviaCount={result.totalTriviaCount}
      totalTriviaPages={result.totalTriviaPages}
      triviaPageSize={result.triviaPageSize}
      availableStatuses={result.availableStatuses}
      availableCategories={result.availableCategories}
      availableDifficulties={result.availableDifficulties}
      summary={result.summary}
    />
  )
}
