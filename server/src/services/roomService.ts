import { prisma } from '@mini-arcade/db'
import {
  GAMES,
  ROOM_CONFIG,
  ROOM_EVENTS,
  type ClientToServerEvents,
  type GameId,
  type InterServerEvents,
  type Player,
  type Room,
  type RoomCode,
  type RoomStatus,
  type ServerToClientEvents,
  type SocketData,
  type UserId,
} from '@mini-arcade/shared'
import type { Server, Socket } from 'socket.io'

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
type TypedIo = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

type PlayerState = Player & {
  socketId?: string
  disconnectedAt?: Date
}

type RoomState = {
  id: string
  code: RoomCode
  creatorId: UserId
  gameId: GameId
  hostId: UserId
  status: RoomStatus
  maxPlayers: number
  createdAt: string
  players: Map<UserId, PlayerState>
}

const ACTIVE_DB_STATUSES = new Set(['WAITING', 'PLAYING'])

export class RoomService {
  private readonly rooms = new Map<RoomCode, RoomState>()
  private readonly socketRooms = new Map<string, RoomCode>()
  private readonly userRooms = new Map<UserId, RoomCode>()
  private readonly disconnectTimers = new Map<UserId, ReturnType<typeof setTimeout>>()

  constructor(private readonly io: TypedIo) {}

  async joinRoom(input: {
    socket: TypedSocket
    roomCode: RoomCode
    userId: UserId
    userName?: string
    userImage?: string
  }) {
    const room = await this.getOrHydrateRoom(input.roomCode)

    if (!room) {
      this.emitRoomError(input.socket, 'ROOM_NOT_FOUND', 'Room does not exist or is no longer active.')
      return null
    }

    const existingPlayer = room.players.get(input.userId)

    if (!existingPlayer && room.players.size >= room.maxPlayers) {
      this.emitRoomError(input.socket, 'ROOM_FULL', 'Room is full.')
      return null
    }

    if (room.status === 'playing' && !existingPlayer) {
      this.emitRoomError(input.socket, 'GAME_IN_PROGRESS', 'Game already in progress.')
      return null
    }

    this.clearDisconnectTimer(input.userId)

    if (existingPlayer) {
      room.players.set(input.userId, {
        ...existingPlayer,
        name: input.userName ?? existingPlayer.name,
        image: input.userImage ?? existingPlayer.image,
        isConnected: true,
        socketId: input.socket.id,
        disconnectedAt: undefined,
      })
    } else {
      const isFirstPlayer = room.players.size === 0
      if (isFirstPlayer) {
        room.hostId = input.userId
      }

      room.players.set(input.userId, {
        id: input.userId,
        name: input.userName ?? `Player ${input.userId.slice(0, 4)}`,
        image: input.userImage,
        isHost: room.hostId === input.userId,
        isConnected: true,
        score: 0,
        socketId: input.socket.id,
      })
    }

    this.syncHostFlags(room)

    await prisma.roomPlayer.upsert({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId: input.userId,
        },
      },
      create: {
        roomId: room.id,
        userId: input.userId,
        isHost: room.hostId === input.userId,
      },
      update: {
        leftAt: null,
        isHost: room.hostId === input.userId,
      },
    })

    if (room.players.size === 1 || room.hostId === input.userId) {
      await this.persistHost(room)
    }

    this.socketRooms.set(input.socket.id, room.code)
    this.userRooms.set(input.userId, room.code)
    input.socket.data.roomCode = room.code

    await input.socket.join(room.code)

    const serializedRoom = this.serializeRoom(room)
    input.socket.emit(ROOM_EVENTS.JOINED, {
      room: serializedRoom,
      playerId: input.userId,
    })

    this.broadcastPresence(room)
    return serializedRoom
  }

  async leaveRoom(input: {
    socket: TypedSocket
    userId: UserId
    roomCode?: RoomCode
    immediate?: boolean
  }) {
    const roomCode =
      input.roomCode ??
      input.socket.data.roomCode ??
      this.userRooms.get(input.userId) ??
      this.socketRooms.get(input.socket.id)

    if (!roomCode) {
      return
    }

    const room = this.rooms.get(roomCode)
    if (!room) {
      this.cleanupSocketState(input.socket.id, input.userId, roomCode)
      return
    }

    const player = room.players.get(input.userId)
    if (!player) {
      this.cleanupSocketState(input.socket.id, input.userId, roomCode)
      return
    }

    await input.socket.leave(roomCode)

    if (input.immediate) {
      await this.finalizePlayerRemoval(room, input.userId)
      input.socket.data.roomCode = undefined
      input.socket.emit(ROOM_EVENTS.LEFT, { roomCode })
      return
    }

    room.players.set(input.userId, {
      ...player,
      isConnected: false,
      disconnectedAt: new Date(),
    })

    this.socketRooms.delete(input.socket.id)
    input.socket.data.roomCode = undefined

    const timer = setTimeout(() => {
      void this.finalizeDisconnectGrace(room.code, input.userId)
    }, ROOM_CONFIG.disconnectGracePeriod)

    this.disconnectTimers.set(input.userId, timer)
    this.broadcastPresence(room)
  }

  async startGame(input: { socket: TypedSocket; roomCode: RoomCode; userId: UserId }) {
    const room = await this.getOrHydrateRoom(input.roomCode)

    if (!room) {
      this.emitRoomError(input.socket, 'ROOM_NOT_FOUND', 'Room does not exist.')
      return false
    }

    if (room.hostId !== input.userId) {
      this.emitRoomError(input.socket, 'NOT_HOST', 'Only the host can start the game.')
      return false
    }

    const connectedPlayers = Array.from(room.players.values()).filter((player) => player.isConnected)
    const minPlayers = GAMES[room.gameId].minPlayers

    if (connectedPlayers.length < minPlayers) {
      this.emitRoomError(
        input.socket,
        'NOT_ENOUGH_PLAYERS',
        `This game needs at least ${minPlayers} player${minPlayers === 1 ? '' : 's'}.`
      )
      return false
    }

    for (const [playerId, player] of room.players.entries()) {
      room.players.set(playerId, {
        ...player,
        score: 0,
      })
    }

    room.status = 'playing'

    await prisma.$transaction([
      prisma.room.update({
        where: { id: room.id },
        data: {
          status: 'PLAYING',
          startedAt: new Date(),
          endedAt: null,
        },
      }),
      prisma.roomPlayer.updateMany({
        where: {
          roomId: room.id,
          leftAt: null,
        },
        data: {
          score: 0,
        },
      }),
    ])

    this.io.to(room.code).emit(ROOM_EVENTS.GAME_STARTED, { gameId: room.gameId })
    this.broadcastPresence(room)
    return true
  }

  async kickPlayer(input: {
    socket: TypedSocket
    roomCode: RoomCode
    actorUserId: UserId
    targetUserId: UserId
  }) {
    const room = await this.getOrHydrateRoom(input.roomCode)

    if (!room) {
      this.emitRoomError(input.socket, 'ROOM_NOT_FOUND', 'Room does not exist.')
      return false
    }

    if (room.hostId !== input.actorUserId) {
      this.emitRoomError(input.socket, 'NOT_HOST', 'Only the host can kick players.')
      return false
    }

    if (input.actorUserId === input.targetUserId) {
      this.emitRoomError(input.socket, 'CANNOT_KICK_SELF', 'You cannot kick yourself.')
      return false
    }

    const target = room.players.get(input.targetUserId)
    if (!target) {
      this.emitRoomError(input.socket, 'PLAYER_NOT_FOUND', 'Player is not in the room.')
      return false
    }

    this.clearDisconnectTimer(input.targetUserId)

    if (target.socketId) {
      const targetSocket = this.io.sockets.sockets.get(target.socketId)
      if (targetSocket) {
        targetSocket.data.roomCode = undefined
        await targetSocket.leave(room.code)
        targetSocket.emit(ROOM_EVENTS.PLAYER_KICKED, { playerId: input.targetUserId })
      }
      this.socketRooms.delete(target.socketId)
    }

    await this.finalizePlayerRemoval(room, input.targetUserId, false)
    this.io.to(room.code).emit(ROOM_EVENTS.PLAYER_KICKED, { playerId: input.targetUserId })
    return true
  }

  async handleDisconnect(socket: TypedSocket) {
    const userId = socket.data.userId
    if (!userId) {
      return
    }

    await this.leaveRoom({
      socket,
      userId,
      immediate: false,
    })
  }

  async getRoomSnapshot(roomCode: RoomCode) {
    const room = await this.getOrHydrateRoom(roomCode)
    return room ? this.serializeRoom(room) : null
  }

  async applyGameResults(input: {
    roomCode: RoomCode
    status?: RoomStatus
    scores?: Record<UserId, number>
  }) {
    const room = this.rooms.get(input.roomCode) ?? (await this.getOrHydrateRoom(input.roomCode))
    if (!room) {
      return
    }

    if (input.status) {
      room.status = input.status
    }

    if (input.scores) {
      for (const [playerId, score] of Object.entries(input.scores)) {
        const existingPlayer = room.players.get(playerId)
        if (!existingPlayer) {
          continue
        }

        room.players.set(playerId, {
          ...existingPlayer,
          score,
        })
      }
    }

    this.broadcastPresence(room)
  }

  private async getOrHydrateRoom(roomCode: RoomCode) {
    const existingRoom = this.rooms.get(roomCode)
    if (existingRoom) {
      return existingRoom
    }

    const dbRoom = await prisma.room.findUnique({
      where: { code: roomCode },
      include: {
        players: {
          where: { leftAt: null },
          include: { user: true },
          orderBy: { joinedAt: 'asc' },
        },
      },
    })

    if (!dbRoom || !ACTIVE_DB_STATUSES.has(dbRoom.status)) {
      return null
    }

    const players = new Map<UserId, PlayerState>()
    let hostId = dbRoom.creatorId as UserId

    for (const membership of dbRoom.players) {
      const userId = membership.userId as UserId
      players.set(userId, {
        id: userId,
        name: membership.user.name ?? `Player ${userId.slice(0, 4)}`,
        image: membership.user.image ?? undefined,
        isHost: membership.isHost,
        isConnected: true,
        score: membership.score,
      })

      if (membership.isHost) {
        hostId = userId
      }
    }

    if (players.size > 0 && !players.has(hostId)) {
      hostId = players.keys().next().value as UserId
    }

    const room: RoomState = {
      id: dbRoom.id,
      code: dbRoom.code as RoomCode,
      creatorId: dbRoom.creatorId as UserId,
      gameId: dbRoom.gameId as GameId,
      hostId,
      status: this.mapDbStatus(dbRoom.status),
      maxPlayers: dbRoom.maxPlayers,
      createdAt: dbRoom.createdAt.toISOString(),
      players,
    }

    this.syncHostFlags(room)
    this.rooms.set(room.code, room)

    for (const userId of room.players.keys()) {
      this.userRooms.set(userId, room.code)
    }

    return room
  }

  private async finalizeDisconnectGrace(roomCode: RoomCode, userId: UserId) {
    const room = this.rooms.get(roomCode)
    if (!room) {
      this.clearDisconnectTimer(userId)
      return
    }

    const player = room.players.get(userId)
    if (!player || player.isConnected) {
      this.clearDisconnectTimer(userId)
      return
    }

    await this.finalizePlayerRemoval(room, userId)
  }

  private async finalizePlayerRemoval(room: RoomState, userId: UserId, emitPresence = true) {
    const removedPlayer = room.players.get(userId)
    if (!removedPlayer) {
      return
    }

    room.players.delete(userId)
    this.clearDisconnectTimer(userId)
    this.cleanupSocketState(removedPlayer.socketId, userId, room.code)

    await prisma.roomPlayer.updateMany({
      where: {
        roomId: room.id,
        userId,
        leftAt: null,
      },
      data: {
        leftAt: new Date(),
        isHost: false,
      },
    })

    if (room.players.size === 0) {
      await this.closeRoom(room)
      return
    }

    if (room.hostId === userId || !room.players.has(room.hostId)) {
      room.hostId = this.pickNextHost(room)
      this.syncHostFlags(room)
      await this.persistHost(room)
      this.io.to(room.code).emit(ROOM_EVENTS.HOST_CHANGED, { newHostId: room.hostId })
    } else {
      this.syncHostFlags(room)
    }

    if (emitPresence) {
      this.broadcastPresence(room)
    }
  }

  private async closeRoom(room: RoomState) {
    await prisma.room.update({
      where: { id: room.id },
      data: {
        status: 'ABANDONED',
        endedAt: new Date(),
      },
    })

    for (const player of room.players.values()) {
      this.clearDisconnectTimer(player.id)
      this.cleanupSocketState(player.socketId, player.id, room.code)
    }

    this.rooms.delete(room.code)
  }

  private pickNextHost(room: RoomState) {
    const connectedHost = Array.from(room.players.values()).find((player) => player.isConnected)
    if (connectedHost) {
      return connectedHost.id
    }

    return room.players.keys().next().value as UserId
  }

  private syncHostFlags(room: RoomState) {
    for (const [playerId, player] of room.players.entries()) {
      room.players.set(playerId, {
        ...player,
        isHost: playerId === room.hostId,
      })
    }
  }

  private async persistHost(room: RoomState) {
    await prisma.roomPlayer.updateMany({
      where: {
        roomId: room.id,
      },
      data: {
        isHost: false,
      },
    })

    if (room.players.has(room.hostId)) {
      await prisma.roomPlayer.update({
        where: {
          roomId_userId: {
            roomId: room.id,
            userId: room.hostId,
          },
        },
        data: {
          isHost: true,
        },
      })
    }
  }

  private serializeRoom(room: RoomState): Room {
    return {
      code: room.code,
      gameId: room.gameId,
      hostId: room.hostId,
      status: room.status,
      players: Array.from(room.players.values()).map((player) => ({
        id: player.id,
        name: player.name,
        image: player.image,
        isHost: player.isHost,
        isConnected: player.isConnected,
        score: player.score,
      })),
      maxPlayers: room.maxPlayers,
      createdAt: room.createdAt,
    }
  }

  private broadcastPresence(room: RoomState) {
    this.io.to(room.code).emit(ROOM_EVENTS.PRESENCE, {
      roomCode: room.code,
      players: this.serializeRoom(room).players,
      hostId: room.hostId,
      status: room.status,
    })
  }

  private emitRoomError(socket: TypedSocket, code: string, message: string) {
    socket.emit(ROOM_EVENTS.ERROR, { code, message })
  }

  private clearDisconnectTimer(userId: UserId) {
    const timer = this.disconnectTimers.get(userId)
    if (timer) {
      clearTimeout(timer)
      this.disconnectTimers.delete(userId)
    }
  }

  private cleanupSocketState(socketId: string | undefined, userId: UserId, roomCode: RoomCode) {
    if (socketId) {
      this.socketRooms.delete(socketId)
    }

    if (this.userRooms.get(userId) === roomCode) {
      this.userRooms.delete(userId)
    }
  }

  private mapDbStatus(status: string): RoomStatus {
    if (status === 'PLAYING') {
      return 'playing'
    }

    if (status === 'FINISHED' || status === 'ABANDONED') {
      return 'finished'
    }

    return 'waiting'
  }
}
