import { unstable_noStore as noStore } from 'next/cache'
import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'

import { GAMES, type GameId } from '@mini-arcade/shared'

import { RoomLobby } from '@/components/room/RoomLobby'
import { authOptions } from '@/lib/auth'
import { getOrCreateSoloRoomForUser, getRoomByCode } from '@/lib/rooms'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function isSoloCapableGame(gameId: string): gameId is GameId {
  return gameId in GAMES && GAMES[gameId as GameId].minPlayers <= 1
}

export default async function SoloPlayPage({
  params,
}: {
  params: {
    gameId: string
  }
}) {
  noStore()

  if (!isSoloCapableGame(params.gameId)) {
    notFound()
  }

  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/play/${params.gameId}`)}`)
  }

  const soloSession = await getOrCreateSoloRoomForUser({
    creatorId: session.user.id,
    gameId: params.gameId,
  })

  const room = await getRoomByCode(soloSession.roomCode)

  if (!room) {
    notFound()
  }

  return (
    <RoomLobby
      key={room.code}
      roomCode={room.code}
      currentUserId={session.user.id}
      initialRoom={room}
      autoStartOnJoin
    />
  )
}
