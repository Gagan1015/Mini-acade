import { prisma } from '@mini-arcade/db'
import { AdminRoomsClient } from '@/components/admin/AdminRoomsClient'

export default async function AdminRoomsPage() {
  const rooms = await prisma.room.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      creator: {
        select: { name: true, email: true },
      },
      _count: {
        select: { players: true, gameResults: true },
      },
    },
  })

  return (
    <AdminRoomsClient
      rooms={rooms.map((room) => ({
        id: room.id,
        code: room.code,
        gameId: room.gameId,
        status: room.status,
        creatorName: room.creator.name ?? 'Unknown',
        creatorEmail: room.creator.email ?? '',
        playerCount: room._count.players,
        gameResultCount: room._count.gameResults,
        createdAt: room.createdAt.toISOString(),
      }))}
    />
  )
}
