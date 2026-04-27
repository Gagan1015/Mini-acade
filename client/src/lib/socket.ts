'use client'

import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@arcado/shared'

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export function createSocket() {
  const socketUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001'

  return io(socketUrl, {
    autoConnect: false,
    transports: ['websocket'],
    withCredentials: true,
  }) as AppSocket
}
