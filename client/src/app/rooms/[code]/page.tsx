import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'

import { RoomLobby } from '@/components/room/RoomLobby'
import { authOptions } from '@/lib/auth'
import { getRoomByCode } from '@/lib/rooms'

export default async function RoomPage({
  params,
}: {
  params: {
    code: string
  }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/rooms/${params.code}`)}`)
  }

  const room = await getRoomByCode(params.code)

  if (!room) {
    notFound()
  }

  if (room.maxPlayers === 1) {
    redirect(`/play/${room.gameId}`)
  }

  return <RoomLobby roomCode={room.code} currentUserId={session.user.id} initialRoom={room} />
}
