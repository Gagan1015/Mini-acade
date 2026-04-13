import {
  type ClientToServerEvents,
  type GameEventResult,
  type IGameRuntime,
  type InterServerEvents,
  type Room,
  type ServerToClientEvents,
  type SocketData,
  type UserId,
} from '@mini-arcade/shared'
import type { Server, Socket } from 'socket.io'

import { RoomService } from '../services/roomService'
import { FlagelRuntime } from './flagel/FlagelRuntime'
import { SkribbleRuntime } from './skribble/SkribbleRuntime'
import { TriviaRuntime } from './trivia/TriviaRuntime'
import { WordelRuntime } from './wordel/WordelRuntime'

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
type TypedIo = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

export class GameManager {
  private readonly games = new Map<string, IGameRuntime>()

  constructor(
    private readonly io: TypedIo,
    private readonly roomService: RoomService
  ) {}

  hasGame(roomCode: string) {
    return this.games.has(roomCode)
  }

  async createGame(room: Room) {
    this.logDebug('createGame:requested', {
      roomCode: room.code,
      gameId: room.gameId,
      status: room.status,
      players: room.players.length,
      existingGame: this.games.has(room.code),
    })

    if (
      room.gameId !== 'wordel' &&
      room.gameId !== 'trivia' &&
      room.gameId !== 'flagel' &&
      room.gameId !== 'skribble'
    ) {
      this.logDebug('createGame:unsupported', {
        roomCode: room.code,
        gameId: room.gameId,
      })
      return { success: false, error: `${room.gameId} runtime lands in a later phase.` }
    }

    const existingGame = this.games.get(room.code)
    if (existingGame) {
      if (existingGame.getSnapshot().phase === 'gameEnd') {
        this.games.delete(room.code)
      } else {
        this.logDebug('createGame:existing', {
          roomCode: room.code,
          gameId: room.gameId,
        })
        return { success: true }
      }
    }

    const runtime =
      room.gameId === 'wordel'
        ? new WordelRuntime(
            this.io,
            {
              gameId: room.gameId,
              roomCode: room.code,
              players: room.players,
              settings: {
                rounds: 1,
                maxPlayers: room.maxPlayers,
              },
            },
            this.roomService
          )
        : room.gameId === 'skribble'
          ? new SkribbleRuntime(
              this.io,
              {
                gameId: room.gameId,
                roomCode: room.code,
                players: room.players,
                settings: {
                  rounds: room.players.length,
                  maxPlayers: room.maxPlayers,
                },
              },
              this.roomService
            )
        : room.gameId === 'flagel'
          ? new FlagelRuntime(
              this.io,
              {
                gameId: room.gameId,
                roomCode: room.code,
                players: room.players,
                settings: {
                  rounds: 1,
                  maxPlayers: room.maxPlayers,
                },
              },
              this.roomService
            )
        : new TriviaRuntime(
            this.io,
            {
              gameId: room.gameId,
              roomCode: room.code,
              players: room.players,
              settings: {
                rounds: 5,
                maxPlayers: room.maxPlayers,
              },
            },
            this.roomService
          )

    await runtime.initialize()
    this.games.set(room.code, runtime)
    this.logDebug('createGame:initialized', {
      roomCode: room.code,
      gameId: room.gameId,
    })

    const result = await runtime.start()
    this.logDebug('createGame:started', {
      roomCode: room.code,
      gameId: room.gameId,
      success: result.success,
      error: result.success ? null : result.error,
    })
    await this.dispatchRuntimeResult(result, room.code)
    return result
  }

  async handleGameEvent(
    socket: TypedSocket,
    roomCode: string,
    eventName: string,
    payload: unknown
  ) {
    const runtime = this.games.get(roomCode)

    if (!runtime) {
      this.logDebug('handleGameEvent:missingRuntime', {
        roomCode,
        eventName,
        userId: socket.data.userId,
      })
      socket.emit('room:error', { code: 'GAME_NOT_FOUND', message: 'Game is not active in this room.' })
      return
    }

    if (!socket.data.userId) {
      socket.emit('room:error', { code: 'NOT_AUTHENTICATED', message: 'Please sign in first.' })
      return
    }

    const result = await runtime.onClientEvent(socket.data.userId, eventName, payload)
    await this.dispatchRuntimeResult(result, roomCode, socket)

    if (runtime.getSnapshot().phase === 'gameEnd') {
      this.games.delete(roomCode)
    }
  }

  async syncPlayer(socket: TypedSocket, roomCode: string, userId: UserId) {
    const runtime = this.games.get(roomCode)
    if (!runtime) {
      this.logDebug('syncPlayer:missingRuntime', {
        roomCode,
        userId,
      })
      return
    }

    this.logDebug('syncPlayer:success', {
      roomCode,
      userId,
      phase: runtime.getSnapshot().phase,
    })
    const result = runtime.onPlayerReconnect(userId)
    await this.dispatchRuntimeResult(result, roomCode, socket)
  }

  handlePlayerLeave(roomCode: string | undefined, userId: UserId | undefined) {
    if (!roomCode || !userId) {
      return
    }

    const runtime = this.games.get(roomCode)
    if (!runtime) {
      return
    }

    runtime.onPlayerLeave(userId)
  }

  async dispatchRuntimeResult(
    result: GameEventResult,
    roomCode: string,
    socket?: TypedSocket
  ) {
    this.logDebug('dispatchRuntimeResult', {
      roomCode,
      success: result.success,
      hasBroadcast: Boolean(result.broadcast?.length),
      error: result.success ? null : result.error,
      socketUserId: socket?.data.userId,
    })

    if (!result.success && result.error && socket) {
      socket.emit('room:error', { code: 'GAME_ERROR', message: result.error })
    }

    if (!result.broadcast) {
      return
    }

    for (const broadcast of result.broadcast) {
      if (broadcast.to === 'room') {
        this.io.to(roomCode).emit(
          broadcast.event as keyof ServerToClientEvents,
          broadcast.data as never
        )
        continue
      }

      if (broadcast.to === 'player' && broadcast.playerId) {
        // First try the provided socket if it matches the target player
        if (socket && socket.data.userId === broadcast.playerId) {
          socket.emit(broadcast.event as keyof ServerToClientEvents, broadcast.data as never)
          continue
        }

        // Otherwise find the target player's socket in the room
        try {
          const roomSockets = await this.io.in(roomCode).fetchSockets()
          const targetSocket = roomSockets.find(
            (s) => s.data.userId === broadcast.playerId
          )
          if (targetSocket) {
            targetSocket.emit(
              broadcast.event as keyof ServerToClientEvents,
              broadcast.data as never
            )
          }
        } catch (err) {
          this.logDebug('dispatchRuntimeResult:fetchSockets:error', {
            roomCode,
            playerId: broadcast.playerId,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
        }
      }
    }
  }

  private logDebug(stage: string, details: Record<string, unknown>) {
    console.info(`[GameManager] ${stage}`, details)
  }
}
