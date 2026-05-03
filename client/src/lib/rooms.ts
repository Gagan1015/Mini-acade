import { prisma, type Prisma } from '@arcado/db'
import {
  GAMES,
  ROOM_CONFIG,
  roomCodeSchema,
  type GameId,
  type GameSettings,
  type Room,
  type RoomCode,
} from '@arcado/shared'

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const SOLO_ONE_ROUND_GAMES = new Set<GameId>(['wordel', 'flagel'])

export class GameUnavailableError extends Error {
  constructor(
    message: string,
    readonly gameId: GameId,
    readonly gameName: string
  ) {
    super(message)
    this.name = 'GameUnavailableError'
  }
}

export function isGameUnavailableError(error: unknown): error is GameUnavailableError {
  return error instanceof GameUnavailableError
}

export async function getGameAvailability(gameId: GameId) {
  const gameConfig = await getGameConfig(gameId)

  return {
    gameId,
    name: gameConfig?.name ?? GAMES[gameId].name,
    isEnabled: gameConfig?.isEnabled ?? true,
  }
}

export async function createRoomForUser(input: {
  creatorId: string
  gameId: GameId
  maxPlayers?: number
  settings?: GameSettings
}) {
  const code = await generateUniqueRoomCode()
  const gameConfig = await getGameConfig(input.gameId)
  const maxPlayers = clampMaxPlayers(input.gameId, input.maxPlayers, gameConfig)
  const settings = normalizeRoomSettings(input.gameId, maxPlayers, input.settings)

  if (gameConfig && !gameConfig.isEnabled) {
    throw new GameUnavailableError(
      `${gameConfig.name} is currently disabled.`,
      input.gameId,
      gameConfig.name
    )
  }

  await prisma.room.create({
    data: {
      code,
      gameId: input.gameId,
      creatorId: input.creatorId,
      maxPlayers,
      settings: settings as Prisma.InputJsonValue | undefined,
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
  const gameConfig = await getGameConfig(input.gameId)
  if (gameConfig && !gameConfig.isEnabled) {
    throw new GameUnavailableError(
      `${gameConfig.name} is currently disabled.`,
      input.gameId,
      gameConfig.name
    )
  }

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

async function getGameConfig(gameId: GameId) {
  return prisma.gameConfig.findUnique({
    where: { gameId },
    select: {
      name: true,
      isEnabled: true,
      minPlayers: true,
      maxPlayers: true,
    },
  })
}

function clampMaxPlayers(
  gameId: GameId,
  maxPlayers?: number,
  gameConfig?: Awaited<ReturnType<typeof getGameConfig>>
) {
  const game = GAMES[gameId]
  const minPlayers = gameConfig?.minPlayers ?? game.minPlayers
  const configuredMaxPlayers = gameConfig?.maxPlayers ?? game.maxPlayers

  if (!maxPlayers) {
    return configuredMaxPlayers
  }

  return Math.max(minPlayers, Math.min(configuredMaxPlayers, maxPlayers))
}

function normalizeRoomSettings(
  gameId: GameId,
  maxPlayers: number,
  settings?: GameSettings
): GameSettings | undefined {
  if (maxPlayers === 1 && SOLO_ONE_ROUND_GAMES.has(gameId)) {
    return {
      ...settings,
      rounds: 1,
    }
  }

  return settings
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
