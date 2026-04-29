import { NextRequest, NextResponse } from 'next/server'

import { getAdminRoomDetail } from '@/lib/adminRooms'
import { requireAdminApiSession } from '@/lib/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const session = await requireAdminApiSession()

  if (session instanceof NextResponse) {
    return session
  }

  const roomDetail = await getAdminRoomDetail(params.roomId)

  if (!roomDetail) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  return NextResponse.json(roomDetail)
}
