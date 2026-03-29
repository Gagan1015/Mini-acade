import 'dotenv/config'

import { prisma } from '@mini-arcade/db'
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
} from '@mini-arcade/shared'

import { registerSocketHandlers } from './socket/socketHandler'

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
