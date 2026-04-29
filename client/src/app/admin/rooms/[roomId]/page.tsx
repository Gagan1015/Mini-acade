import { notFound } from 'next/navigation'

import { AdminRoomDetailClient } from '@/components/admin/AdminRoomDetailClient'
import { getAdminRoomDetail } from '@/lib/adminRooms'

export default async function AdminRoomDetailPage({
  params,
}: {
  params: { roomId: string }
}) {
  const roomDetail = await getAdminRoomDetail(params.roomId)

  if (!roomDetail) {
    notFound()
  }

  return <AdminRoomDetailClient {...roomDetail} />
}
