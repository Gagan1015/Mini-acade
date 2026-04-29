import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApiSession } from '@/lib/admin'
import { getAdminAnalytics, normalizeAnalyticsFilters } from '@/lib/adminAnalytics'

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const filters = normalizeAnalyticsFilters({
    range: request.nextUrl.searchParams.get('range') ?? undefined,
  })

  const result = await getAdminAnalytics(filters)

  return NextResponse.json(result)
}
