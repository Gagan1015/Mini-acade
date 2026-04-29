import 'dotenv/config'

import { prisma } from '@arcado/db'
import cors from 'cors'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

import {
  CONNECTION_EVENTS,
  ROOM_CONFIG,
  type ClientToServerEvents,
  type InterServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from '@arcado/shared'

import { getGameManager, getRoomService, registerSocketHandlers } from './socket/socketHandler'

const app = express()
const httpServer = createServer(app)

const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
const port = Number(process.env.PORT || 3001)

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  {
    cors: {
      origin: clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  }
)

io.use(async (socket, next) => {
  try {
    const sessionToken = getSessionToken(socket.handshake.headers.cookie)

    if (!sessionToken) {
      next()
      return
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
    })

    if (!session || session.expires <= new Date()) {
      next()
      return
    }

    socket.data.userId = session.user.id
    socket.data.userName = session.user.name ?? undefined
    socket.data.userImage = session.user.image ?? undefined
    socket.data.isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'

    next()
  } catch (error) {
    next(error as Error)
  }
})

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
)
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    roomCodeLength: ROOM_CONFIG.codeLength,
    timestamp: new Date().toISOString(),
  })
})

app.post('/admin/rooms/:roomCode/force-end', async (req, res) => {
  try {
    const session = await getAdminSession(req.headers.cookie)

    if (!session) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const roomCode = String(req.params.roomCode ?? '').trim().toUpperCase()
    const reason =
      typeof req.body?.reason === 'string' ? req.body.reason.trim() : ''

    if (!roomCode) {
      res.status(400).json({ error: 'Room code is required.' })
      return
    }

    if (!reason) {
      res.status(400).json({ error: 'A reason is required to force-end a room.' })
      return
    }

    const activeGameManager = getGameManager(io)
    const activeRoomService = getRoomService(io)
    const hadRuntime = await activeGameManager.adminAbortGame(roomCode)
    const result = await activeRoomService.adminForceCloseRoom({
      roomCode,
      message: `This room was closed by an admin. Reason: ${reason}`,
    })

    if (!result.success) {
      res.status(400).json({ error: result.error })
      return
    }

    await prisma.adminLog.create({
      data: {
        actorId: session.user.id,
        action: 'room.force_end',
        targetType: 'ROOM',
        targetId: result.roomId,
        details: {
          roomCode,
          reason,
          hadRuntime,
          statusBefore: result.statusBefore,
          activePlayerCount: result.activePlayerCount,
          hadLiveRoomState: result.hadLiveRoomState,
          notifiedSocketCount: result.notifiedSocketCount,
        },
        ipAddress: req.headers['x-forwarded-for']?.toString(),
        userAgent: req.headers['user-agent'],
      },
    })

    res.json({
      success: true,
      roomCode,
      hadRuntime,
      activePlayerCount: result.activePlayerCount,
    })
  } catch (error) {
    console.error('[admin][force-end-room] failed', error)
    res.status(500).json({ error: 'Unable to force-end room right now.' })
  }
})

app.post('/admin/rooms/:roomCode/remove-player', async (req, res) => {
  try {
    const session = await getAdminSession(req.headers.cookie)

    if (!session) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const roomCode = String(req.params.roomCode ?? '').trim().toUpperCase()
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : ''
    const targetUserId =
      typeof req.body?.targetUserId === 'string' ? req.body.targetUserId.trim() : ''

    if (!roomCode) {
      res.status(400).json({ error: 'Room code is required.' })
      return
    }

    if (!targetUserId) {
      res.status(400).json({ error: 'Target player is required.' })
      return
    }

    if (!reason) {
      res.status(400).json({ error: 'A reason is required to remove a player.' })
      return
    }

    const activeGameManager = getGameManager(io)
    const activeRoomService = getRoomService(io)

    activeGameManager.handlePlayerLeave(roomCode, targetUserId)

    const result = await activeRoomService.adminRemovePlayer({
      roomCode,
      targetUserId,
      message: `You were removed from this room by an admin. Reason: ${reason}`,
    })

    if (!result.success) {
      res.status(400).json({ error: result.error })
      return
    }

    await prisma.adminLog.create({
      data: {
        actorId: session.user.id,
        action: 'room.remove_player',
        targetType: 'ROOM',
        targetId: result.roomId,
        details: {
          roomCode,
          reason,
          targetUserId: result.targetUserId,
          targetName: result.targetName,
          targetEmail: result.targetEmail,
          wasHost: result.wasHost,
          roomClosed: result.roomClosed,
          nextHostId: result.nextHostId,
          remainingPlayerCount: result.remainingPlayerCount,
          notifiedSocketCount: result.notifiedSocketCount,
        },
        ipAddress: req.headers['x-forwarded-for']?.toString(),
        userAgent: req.headers['user-agent'],
      },
    })

    res.json({
      success: true,
      roomCode,
      targetUserId: result.targetUserId,
      targetName: result.targetName,
      wasHost: result.wasHost,
      roomClosed: result.roomClosed,
      nextHostId: result.nextHostId,
      remainingPlayerCount: result.remainingPlayerCount,
      notifiedSocketCount: result.notifiedSocketCount,
    })
  } catch (error) {
    console.error('[admin][remove-player] failed', error)
    res.status(500).json({ error: 'Unable to remove player right now.' })
  }
})

io.on(CONNECTION_EVENTS.CONNECT, (socket) => {
  console.log(`Client connected: ${socket.id}`)
  registerSocketHandlers(io, socket)

  socket.on(CONNECTION_EVENTS.DISCONNECT, () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

function getSessionToken(cookieHeader: string | undefined) {
  if (!cookieHeader) {
    return undefined
  }

  const cookies = cookieHeader.split(';')
  const candidate = cookies.find((cookie) => {
    const trimmed = cookie.trim()
    return (
      trimmed.startsWith('next-auth.session-token=') ||
      trimmed.startsWith('__Secure-next-auth.session-token=')
    )
  })

  if (!candidate) {
    return undefined
  }

  const [, value = ''] = candidate.split('=')
  return decodeURIComponent(value)
}

async function getAdminSession(cookieHeader: string | undefined) {
  const sessionToken = getSessionToken(cookieHeader)

  if (!sessionToken) {
    return null
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        select: {
          id: true,
          role: true,
        },
      },
    },
  })

  if (!session || session.expires <= new Date()) {
    return null
  }

  return session
}
