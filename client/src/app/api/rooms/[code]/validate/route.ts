import { NextResponse } from 'next/server'

import { validateRoomCode } from '@/lib/rooms'

export async function GET(
  _request: Request,
  context: {
    params: {
      code: string
    }
  }
) {
  const result = await validateRoomCode(context.params.code)
  return NextResponse.json(result)
}
