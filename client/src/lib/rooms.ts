import { prisma, type Prisma } from '@mini-arcade/db'
import {
  GAMES,
  ROOM_CONFIG,
  roomCodeSchema,
  type GameId,
  type GameSettings,
  type Room,
  type RoomCode,
} from '@mini-arcade/shared'

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export async function createRoomForUser(input: {
  creatorId: string
  gameId: GameId
  maxPlayers?: number
  settings?: GameSettings
}) {
  const code = await generateUniqueRoomCode()
  const maxPlayers = clampMaxPlayers(input.gameId, input.maxPlayers)

  await prisma.room.create({
    data: {
      code,
      gameId: input.gameId,
      creatorId: input.creatorId,
      maxPlayers,
      settings: input.settings as Prisma.InputJsonValue | undefined,
      status: 'WAITING',
      isPrivate: true,
    },
  })

  return {
    roomCode: code,
    joinUrl: new URL(
      `/rooms/${code}`,
      process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    ).toString(),
  }
}

export async function getOrCreateSoloRoomForUser(input: {
  creatorId: string
  gameId: GameId
  settings?: GameSettings
  forceNew?: boolean
}) {
  const existingRoom = input.forceNew
    ? null
    : await prisma.room.findFirst({
      where: {
        creatorId: input.creatorId,
        gameId: input.gameId,
        maxPlayers: 1,
        isPrivate: true,
        status: {
          in: ['WAITING', 'PLAYING'],
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        code: true,
      },
    })

  if (existingRoom) {
    return {
      roomCode: existingRoom.code as RoomCode,
      playUrl: new URL(
        `/play/${input.gameId}`,
        process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
      ).toString(),
      reused: true,
    }
  }

  const createdRoom = await createRoomForUser({
    creatorId: input.creatorId,
    gameId: input.gameId,
    maxPlayers: 1,
    settings: input.settings,
  })

  return {
    roomCode: createdRoom.roomCode,
    playUrl: new URL(
      `/play/${input.gameId}`,
      process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    ).toString(),
    reused: false,
  }
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  const normalizedCode = normalizeRoomCode(code)

  const room = await prisma.room.findUnique({
    where: { code: normalizedCode },
    include: {
      players: {
        where: { leftAt: null },
        include: { user: true },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })

  if (!room) {
    return null
  }

  const players = room.players.map((membership) => ({
    id: membership.userId,
    name: membership.user.name ?? `Player ${membership.userId.slice(0, 4)}`,
    image: membership.user.image ?? undefined,
    isHost: membership.isHost,
    isConnected: true,
    score: membership.score,
  }))

  let hostId = players.find((player) => player.isHost)?.id ?? players[0]?.id ?? room.creatorId

  if (!players.some((player) => player.id === hostId) && players.length > 0) {
    hostId = players[0].id
  }

  return {
    code: room.code as RoomCode,
    gameId: room.gameId as GameId,
    hostId,
    status: mapRoomStatus(room.status),
    players: players.map((player) => ({
      ...player,
      isHost: player.id === hostId,
    })),
    maxPlayers: room.maxPlayers,
    settings: (room.settings as GameSettings | null) ?? undefined,
    createdAt: room.createdAt.toISOString(),
  }
}

export async function validateRoomCode(code: string) {
  let normalizedCode: RoomCode

  try {
    normalizedCode = normalizeRoomCode(code)
  } catch {
    return {
      valid: false,
      reason: 'Room code must be 6 uppercase letters or digits.',
    }
  }

  const room = await prisma.room.findUnique({
    where: { code: normalizedCode },
    select: {
      code: true,
      gameId: true,
      status: true,
      maxPlayers: true,
      _count: {
        select: {
          players: {
            where: { leftAt: null },
          },
        },
      },
    },
  })

  if (!room) {
    return {
      valid: false,
      reason: 'Room not found.',
    }
  }

  if (room.status === 'FINISHED' || room.status === 'ABANDONED') {
    return {
      valid: false,
      reason: 'Room is no longer active.',
    }
  }

  if (room._count.players >= room.maxPlayers) {
    return {
      valid: false,
      reason: 'Room is full.',
    }
  }

  return {
    valid: true,
    roomCode: room.code as RoomCode,
    gameId: room.gameId as GameId,
    playerCount: room._count.players,
    maxPlayers: room.maxPlayers,
  }
}

export function normalizeRoomCode(code: string) {
  return roomCodeSchema.parse(code.trim().toUpperCase())
}

async function generateUniqueRoomCode() {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const code = Array.from({ length: ROOM_CONFIG.codeLength }, () => {
      const index = Math.floor(Math.random() * ROOM_CODE_CHARS.length)
      return ROOM_CODE_CHARS[index]
    }).join('') as RoomCode

    const existing = await prisma.room.findUnique({
      where: { code },
      select: { id: true },
    })

    if (!existing) {
      return code
    }
  }

  throw new Error('Unable to generate a unique room code.')
}

function clampMaxPlayers(gameId: GameId, maxPlayers?: number) {
  const game = GAMES[gameId]

  if (!maxPlayers) {
    return game.maxPlayers
  }

  return Math.max(game.minPlayers, Math.min(game.maxPlayers, maxPlayers))
}

function mapRoomStatus(status: string): Room['status'] {
  if (status === 'PLAYING') {
    return 'playing'
  }

  if (status === 'FINISHED' || status === 'ABANDONED') {
    return 'finished'
  }

  return 'waiting'
}
