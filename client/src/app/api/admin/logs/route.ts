import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApiSession } from '@/lib/admin'
import { getAdminLogs, normalizeAdminLogFilters } from '@/lib/adminLogs'

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const filters = normalizeAdminLogFilters({
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    actor: request.nextUrl.searchParams.get('actor') ?? undefined,
    action: request.nextUrl.searchParams.get('action') ?? undefined,
    targetType: request.nextUrl.searchParams.get('targetType') ?? undefined,
    dateFrom: request.nextUrl.searchParams.get('dateFrom') ?? undefined,
    dateTo: request.nextUrl.searchParams.get('dateTo') ?? undefined,
  })

  const logs = await getAdminLogs(filters)

  return NextResponse.json(logs)
}
