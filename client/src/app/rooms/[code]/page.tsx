import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'

import { GameUnavailable } from '@/components/games/GameUnavailable'
import { RoomLobby } from '@/components/room/RoomLobby'
import { authOptions } from '@/lib/auth'
import { getGameAvailability, getRoomByCode } from '@/lib/rooms'

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

  const gameAvailability = await getGameAvailability(room.gameId)
  if (!gameAvailability.isEnabled) {
    return (
      <GameUnavailable
        gameName={gameAvailability.name}
        message="This game has been turned off by an admin, so this room cannot be played right now."
      />
    )
  }

  if (room.maxPlayers === 1) {
    redirect(`/play/${room.gameId}`)
  }

  return <RoomLobby roomCode={room.code} currentUserId={session.user.id} initialRoom={room} />
}
