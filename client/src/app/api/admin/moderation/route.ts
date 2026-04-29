import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApiSession } from '@/lib/admin'
import { getModerationQueue, normalizeModerationFilters } from '@/lib/adminModeration'

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const filters = normalizeModerationFilters({
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    status: request.nextUrl.searchParams.get('status') ?? undefined,
    contentType: request.nextUrl.searchParams.get('contentType') ?? undefined,
    reportMin: request.nextUrl.searchParams.get('reportMin') ?? undefined,
    search: request.nextUrl.searchParams.get('search') ?? undefined,
  })

  const result = await getModerationQueue(filters)

  return NextResponse.json(result)
}
