import type { Socket } from 'socket.io'
import {
  CHAT_EVENTS,
  FLAGEL_EVENTS,
  ROOM_EVENTS,
  SKRIBBLE_EVENTS,
  TRIVIA_EVENTS,
  WORDEL_EVENTS,
  safeParseSocketPayload,
  type GameId,
  type ClientToServerEvents,
  type ClientToServerPayload,
  type InterServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from '@arcado/shared'

import { GameManager } from '../games/GameManager'
import { RoomService } from '../services/roomService'

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
type TypedIo = TypedSocket['server']

let roomService: RoomService | undefined
let gameManager: GameManager | undefined

export function getRoomService(io: TypedIo) {
  roomService ??= new RoomService(io)
  return roomService
}

export function getGameManager(io: TypedIo) {
  const activeRoomService = getRoomService(io)
  gameManager ??= new GameManager(io, activeRoomService)
  return gameManager
}

export function registerSocketHandlers(io: TypedIo, socket: TypedSocket) {
  const activeRoomService = getRoomService(io)
  const activeGameManager = getGameManager(io)

  socket.on(
    ROOM_EVENTS.JOIN,
    withValidation(socket, ROOM_EVENTS.JOIN, async (payload) => {
      if (!socket.data.userId) {
        emitRoomError(socket, 'NOT_AUTHENTICATED', 'Please sign in before joining a room.')
        return
      }

      const joinedRoom = await activeRoomService.joinRoom({
        socket,
        roomCode: payload.roomCode,
        userId: socket.data.userId,
        userName: payload.playerName ?? socket.data.userName,
        userImage: socket.data.userImage,
      })

      if (!joinedRoom) {
        logSocketDebug('joinRoom:missingRoom', {
          roomCode: payload.roomCode,
          userId: socket.data.userId,
        })
        return
      }

      logSocketDebug('joinRoom:joined', {
        roomCode: payload.roomCode,
        userId: socket.data.userId,
        gameId: joinedRoom.gameId,
        status: joinedRoom.status,
        hasRuntime: activeGameManager.hasGame(payload.roomCode),
      })

      if (joinedRoom.status === 'playing' && !activeGameManager.hasGame(payload.roomCode)) {
        const result = await activeGameManager.createGame(joinedRoom)
        if (!result.success && result.error) {
          emitRoomError(
            socket,
            'GAME_ERROR',
            result.error,
            {
              source: 'joinRoom:createGame',
              roomCode: payload.roomCode,
              gameId: joinedRoom.gameId,
              status: joinedRoom.status,
            }
          )
          return
        }
      }

      await activeGameManager.syncPlayer(socket, payload.roomCode, socket.data.userId)
    })
  )

  socket.on(
    ROOM_EVENTS.LEAVE,
    withValidation(socket, ROOM_EVENTS.LEAVE, async (payload) => {
      if (!socket.data.userId) {
        emitRoomError(socket, 'NOT_AUTHENTICATED', 'Please sign in before leaving a room.')
        return
      }

      activeGameManager.handlePlayerLeave(payload.roomCode, socket.data.userId)

      await activeRoomService.leaveRoom({
        socket,
        userId: socket.data.userId,
        roomCode: payload.roomCode,
        immediate: true,
      })
    })
  )

  socket.on(
    ROOM_EVENTS.START_GAME,
    withValidation(socket, ROOM_EVENTS.START_GAME, async (payload) => {
      if (!socket.data.userId) {
        emitRoomError(socket, 'NOT_AUTHENTICATED', 'Please sign in before starting a game.')
        return
      }

      const room = await activeRoomService.getRoomSnapshot(payload.roomCode)
      if (!room) {
        emitRoomError(socket, 'ROOM_NOT_FOUND', 'Room does not exist.', {
          source: 'startGame:getRoomSnapshot',
          roomCode: payload.roomCode,
          userId: socket.data.userId,
        })
        return
      }

      logSocketDebug('startGame:requested', {
        roomCode: payload.roomCode,
        userId: socket.data.userId,
        gameId: room.gameId,
        status: room.status,
        hasRuntime: activeGameManager.hasGame(payload.roomCode),
      })

      if (!isSupportedRuntime(room.gameId)) {
        emitDeferredPhaseMessage(socket, `${room.gameId} runtime`, {
          source: 'startGame:isSupportedRuntime',
          roomCode: payload.roomCode,
          gameId: room.gameId,
        })
        return
      }

      const didStart = await activeRoomService.startGame({
        socket,
        roomCode: payload.roomCode,
        userId: socket.data.userId,
      })

      if (!didStart) {
        return
      }

      const startedRoom = await activeRoomService.getRoomSnapshot(payload.roomCode)
      if (!startedRoom) {
        emitRoomError(socket, 'ROOM_NOT_FOUND', 'Room does not exist.', {
          source: 'startGame:getStartedRoom',
          roomCode: payload.roomCode,
          userId: socket.data.userId,
        })
        return
      }

      const result = await activeGameManager.createGame(startedRoom)
      if (!result.success && result.error) {
        emitRoomError(socket, 'GAME_ERROR', result.error, {
          source: 'startGame:createGame',
          roomCode: payload.roomCode,
          gameId: startedRoom.gameId,
          status: startedRoom.status,
        })
      }
    })
  )

  socket.on(
    ROOM_EVENTS.KICK_PLAYER,
    withValidation(socket, ROOM_EVENTS.KICK_PLAYER, async (payload) => {
      if (!socket.data.userId) {
        emitRoomError(socket, 'NOT_AUTHENTICATED', 'Please sign in before kicking players.')
        return
      }

      activeGameManager.handlePlayerLeave(payload.roomCode, payload.playerId)

      await activeRoomService.kickPlayer({
        socket,
        roomCode: payload.roomCode,
        actorUserId: socket.data.userId,
        targetUserId: payload.playerId,
      })
    })
  )

  socket.on(
    SKRIBBLE_EVENTS.STROKE_BATCH,
    withValidation(socket, SKRIBBLE_EVENTS.STROKE_BATCH, async (payload) => {
      if (!socket.data.userId) {
        emitRoomError(socket, 'NOT_AUTHENTICATED', 'Please sign in before drawing.')
        return
      }

      await activeGameManager.handleGameEvent(
        socket,
        payload.roomCode,
        SKRIBBLE_EVENTS.STROKE_BATCH,
        payload
      )
    })
  )

  socket.on(
    SKRIBBLE_EVENTS.CLEAR_CANVAS,
    withValidation(socket, SKRIBBLE_EVENTS.CLEAR_CANVAS, async (payload) => {
      if (!socket.data.userId) {
        emitRoomError(socket, 'NOT_AUTHENTICATED', 'Please sign in before clearing the canvas.')
        return
      }

      await activeGameManager.handleGameEvent(
        socket,
        payload.roomCode,
        SKRIBBLE_EVENTS.CLEAR_CANVAS,
        payload
      )
    })
  )

  socket.on(
    SKRIBBLE_EVENTS.GUESS,
    withValidation(socket, SKRIBBLE_EVENTS.GUESS, async (payload) => {
      if (!socket.data.userId) {
        emitRoomError(socket, 'NOT_AUTHENTICATED', 'Please sign in before guessing.')
        return
      }

      await activeGameManager.handleGameEvent(socket, payload.roomCode, SKRIBBLE_EVENTS.GUESS, payload)
    })
  )

  socket.on(
    SKRIBBLE_EVENTS.CHOOSE_WORD,
    withValidation(socket, SKRIBBLE_EVENTS.CHOOSE_WORD, async (payload) => {
      if (!socket.data.userId) {
        emitRoomError(socket, 'NOT_AUTHENTICATED', 'Please sign in before choosing a word.')
        return
      }

      await activeGameManager.handleGameEvent(
        socket,
        payload.roomCode,
        SKRIBBLE_EVENTS.CHOOSE_WORD,
        payload
      )
    })
  )

  socket.on(
    SKRIBBLE_EVENTS.REQUEST_SYNC,
    withValidation(socket, SKRIBBLE_EVENTS.REQUEST_SYNC, async (payload) => {
      if (!socket.data.userId) {
        emitRoomError(socket, 'NOT_AUTHENTICATED', 'Please sign in before syncing the canvas.')
        return
      }

      await activeGameManager.handleGameEvent(
        socket,
        payload.roomCode,
        SKRIBBLE_EVENTS.REQUEST_SYNC,
        payload
      )
    })
  )

  socket.on(
    TRIVIA_EVENTS.SUBMIT_ANSWER,
    withValidation(socket, TRIVIA_EVENTS.SUBMIT_ANSWER, async (payload) => {
      if (!socket.data.userId) {
        emitRoomError(socket, 'NOT_AUTHENTICATED', 'Please sign in before submitting an answer.')
        return
      }

      await activeGameManager.handleGameEvent(
        socket,
        payload.roomCode,
        TRIVIA_EVENTS.SUBMIT_ANSWER,
        payload
      )
    })
  )

  socket.on(
    WORDEL_EVENTS.SUBMIT_GUESS,
    withValidation(socket, WORDEL_EVENTS.SUBMIT_GUESS, async (payload) => {
      if (!socket.data.userId) {
        emitRoomError(socket, 'NOT_AUTHENTICATED', 'Please sign in before submitting a guess.')
        return
      }

      await activeGameManager.handleGameEvent(
        socket,
        payload.roomCode,
        WORDEL_EVENTS.SUBMIT_GUESS,
        payload
      )
    })
  )

  socket.on(
    FLAGEL_EVENTS.SUBMIT_GUESS,
    withValidation(socket, FLAGEL_EVENTS.SUBMIT_GUESS, async (payload) => {
      if (!socket.data.userId) {
        emitRoomError(socket, 'NOT_AUTHENTICATED', 'Please sign in before submitting a guess.')
        return
      }

      await activeGameManager.handleGameEvent(
        socket,
        payload.roomCode,
        FLAGEL_EVENTS.SUBMIT_GUESS,
        payload
      )
    })
  )

  socket.on(
    FLAGEL_EVENTS.SKIP,
    withValidation(socket, FLAGEL_EVENTS.SKIP, async (payload) => {
      if (!socket.data.userId) {
        emitRoomError(socket, 'NOT_AUTHENTICATED', 'Please sign in before skipping a round.')
        return
      }

      await activeGameManager.handleGameEvent(socket, payload.roomCode, FLAGEL_EVENTS.SKIP, payload)
    })
  )

  socket.on(
    CHAT_EVENTS.SEND_MESSAGE,
    withValidation(socket, CHAT_EVENTS.SEND_MESSAGE, async (payload) => {
      const playerName = socket.data.userName ?? 'Player'

      io.to(payload.roomCode).emit(CHAT_EVENTS.MESSAGE, {
        id: `${socket.id}:${Date.now()}`,
        playerId: socket.data.userId ?? socket.id,
        playerName,
        message: payload.message,
        timestamp: new Date().toISOString(),
        type: 'user',
      })
    })
  )

  socket.on('disconnect', () => {
    activeGameManager.handlePlayerLeave(socket.data.roomCode, socket.data.userId)
    void activeRoomService.handleDisconnect(socket)
  })
}

function withValidation<TEventName extends keyof ClientToServerEvents>(
  socket: TypedSocket,
  eventName: TEventName,
  handler: (payload: ClientToServerPayload<TEventName>) => void | Promise<void>
) {
  return async (payload: unknown) => {
    const result = safeParseSocketPayload(eventName, payload)

    if (!result.success) {
      emitRoomError(socket, 'VALIDATION_ERROR', result.error, {
        source: 'withValidation',
        eventName,
        socketId: socket.id,
      })
      return
    }

    try {
      await handler(result.data)
    } catch (error) {
      emitRoomError(
        socket,
        'HANDLER_ERROR',
        error instanceof Error ? error.message : 'Unknown socket handler error',
        {
          source: 'withValidation:catch',
          eventName,
          socketId: socket.id,
        }
      )
    }
  }
}

function emitRoomError(
  socket: TypedSocket,
  code: string,
  message: string,
  debug?: Record<string, unknown>
) {
  logSocketDebug('emitRoomError', {
    code,
    message,
    socketId: socket.id,
    roomCode: socket.data.roomCode,
    userId: socket.data.userId,
    ...debug,
  })
  socket.emit(ROOM_EVENTS.ERROR, { code, message })
}

function emitDeferredPhaseMessage(
  socket: TypedSocket,
  featureName: string,
  debug?: Record<string, unknown>
) {
  emitRoomError(socket, 'NOT_IMPLEMENTED', `${featureName} lands in a later phase.`, debug)
}

function isSupportedRuntime(gameId: GameId) {
  return gameId === 'wordel' || gameId === 'trivia' || gameId === 'flagel' || gameId === 'skribble'
}

function logSocketDebug(stage: string, details: Record<string, unknown>) {
  console.info(`[socketHandler] ${stage}`, details)
}
