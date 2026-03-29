# Phase 3: Private Rooms System

## Overview
Implement the private rooms system allowing users to create shareable rooms, join via room codes, and manage room presence with reconnection support.

**Status:** To Implement  
**Priority:** High  
**Estimated Time:** 4-6 hours  
**Dependencies:** Phase 0, Phase 1, Phase 2 completed

---

## Goals
- Create rooms with unique 6-character codes
- Allow joining rooms via code or shareable link
- Implement presence system (who's in the room)
- Handle host assignment and transfer
- Support reconnection with grace period
- Implement kick player functionality

---

## Acceptance Criteria
- [ ] Users can create rooms for any game
- [ ] Room codes are unique 6-character alphanumeric strings
- [ ] Users can join rooms via code
- [ ] Room shows all connected players in real-time
- [ ] Host can kick players
- [ ] Host transfers on disconnect
- [ ] Disconnected players can rejoin within grace period
- [ ] Room cleans up when empty

---

## Implementation Steps

### Step 1: Room Service (Server)

#### 1.1 Create `server/src/services/RoomService.ts`
```typescript
import { prisma } from '../lib/prisma'
import { Server, Socket } from 'socket.io'
import { GameId, RoomStatus, Player, Room, UserId } from '@mini-arcade/shared'
import { nanoid } from 'nanoid'

interface RoomState {
  code: string
  gameId: GameId
  hostId: UserId
  status: RoomStatus
  players: Map<UserId, PlayerState>
  maxPlayers: number
  createdAt: Date
  gameState?: any
}

interface PlayerState {
  id: UserId
  name: string
  image?: string
  socketId: string
  isHost: boolean
  isConnected: boolean
  score: number
  disconnectedAt?: Date
}

const DISCONNECT_GRACE_PERIOD = 10000 // 10 seconds
const ROOM_CODE_LENGTH = 6
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars

export class RoomService {
  private rooms: Map<string, RoomState> = new Map()
  private playerRooms: Map<string, string> = new Map() // socketId -> roomCode
  private userSockets: Map<UserId, string> = new Map() // userId -> socketId
  private disconnectTimers: Map<UserId, NodeJS.Timeout> = new Map()
  
  constructor(private io: Server) {}
  
  // ==========================================================================
  // ROOM CODE GENERATION
  // ==========================================================================
  
  private generateRoomCode(): string {
    let code: string
    do {
      code = Array.from(
        { length: ROOM_CODE_LENGTH },
        () => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
      ).join('')
    } while (this.rooms.has(code))
    return code
  }
  
  // ==========================================================================
  // ROOM CREATION
  // ==========================================================================
  
  async createRoom(
    gameId: GameId,
    userId: UserId,
    userName: string,
    maxPlayers: number = 8
  ): Promise<{ roomCode: string; joinUrl: string }> {
    const code = this.generateRoomCode()
    
    const roomState: RoomState = {
      code,
      gameId,
      hostId: userId,
      status: 'waiting',
      players: new Map(),
      maxPlayers,
      createdAt: new Date(),
    }
    
    this.rooms.set(code, roomState)
    
    // Persist to database
    await prisma.room.create({
      data: {
        code,
        gameId,
        creatorId: userId,
        maxPlayers,
        status: 'WAITING',
      },
    })
    
    const joinUrl = `${process.env.CLIENT_URL}/rooms/${code}`
    
    return { roomCode: code, joinUrl }
  }
  
  // ==========================================================================
  // ROOM JOINING
  // ==========================================================================
  
  async joinRoom(
    socket: Socket,
    roomCode: string,
    userId: UserId,
    userName: string,
    userImage?: string
  ): Promise<Room | null> {
    const room = this.rooms.get(roomCode)
    
    if (!room) {
      // Try to load from database (room might exist but not in memory)
      const dbRoom = await prisma.room.findUnique({
        where: { code: roomCode },
        include: { players: { include: { user: true } } },
      })
      
      if (!dbRoom || dbRoom.status === 'FINISHED' || dbRoom.status === 'ABANDONED') {
        socket.emit('room:error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' })
        return null
      }
      
      // Room exists in DB but not in memory - shouldn't happen in normal flow
      socket.emit('room:error', { code: 'ROOM_INACTIVE', message: 'Room is no longer active' })
      return null
    }
    
    // Check if room is full
    const connectedCount = Array.from(room.players.values()).filter(p => p.isConnected).length
    if (connectedCount >= room.maxPlayers) {
      socket.emit('room:error', { code: 'ROOM_FULL', message: 'Room is full' })
      return null
    }
    
    // Check if game already started
    if (room.status === 'playing') {
      // Allow rejoining if player was in the game
      const existingPlayer = room.players.get(userId)
      if (!existingPlayer) {
        socket.emit('room:error', { code: 'GAME_IN_PROGRESS', message: 'Game already in progress' })
        return null
      }
    }
    
    // Clear any disconnect timer
    const timer = this.disconnectTimers.get(userId)
    if (timer) {
      clearTimeout(timer)
      this.disconnectTimers.delete(userId)
    }
    
    // Check if user was previously in the room (reconnecting)
    const existingPlayer = room.players.get(userId)
    
    if (existingPlayer) {
      // Reconnection
      existingPlayer.socketId = socket.id
      existingPlayer.isConnected = true
      existingPlayer.disconnectedAt = undefined
    } else {
      // New player
      const isHost = room.players.size === 0
      
      const playerState: PlayerState = {
        id: userId,
        name: userName,
        image: userImage,
        socketId: socket.id,
        isHost,
        isConnected: true,
        score: 0,
      }
      
      room.players.set(userId, playerState)
      
      if (isHost) {
        room.hostId = userId
      }
      
      // Persist to database
      await prisma.roomPlayer.upsert({
        where: {
          roomId_userId: {
            roomId: (await prisma.room.findUnique({ where: { code: roomCode } }))!.id,
            userId,
          },
        },
        create: {
          room: { connect: { code: roomCode } },
          user: { connect: { id: userId } },
          isHost,
        },
        update: {
          leftAt: null,
        },
      })
    }
    
    // Track socket -> room mapping
    this.playerRooms.set(socket.id, roomCode)
    this.userSockets.set(userId, socket.id)
    
    // Join socket.io room
    socket.join(roomCode)
    
    // Emit join success to the joining player
    const roomData = this.getRoomData(room)
    socket.emit('room:joined', { room: roomData, playerId: userId })
    
    // Broadcast presence update to all players
    this.broadcastPresence(room)
    
    return roomData
  }
  
  // ==========================================================================
  // ROOM LEAVING
  // ==========================================================================
  
  async leaveRoom(socket: Socket, userId: UserId): Promise<void> {
    const roomCode = this.playerRooms.get(socket.id)
    if (!roomCode) return
    
    const room = this.rooms.get(roomCode)
    if (!room) return
    
    const player = room.players.get(userId)
    if (!player) return
    
    // Mark as disconnected
    player.isConnected = false
    player.disconnectedAt = new Date()
    
    // Leave socket.io room
    socket.leave(roomCode)
    this.playerRooms.delete(socket.id)
    this.userSockets.delete(userId)
    
    // Start grace period timer
    const timer = setTimeout(() => {
      this.finalizeLeave(roomCode, userId)
    }, DISCONNECT_GRACE_PERIOD)
    
    this.disconnectTimers.set(userId, timer)
    
    // Broadcast presence update
    this.broadcastPresence(room)
  }
  
  private async finalizeLeave(roomCode: string, userId: UserId): Promise<void> {
    const room = this.rooms.get(roomCode)
    if (!room) return
    
    const player = room.players.get(userId)
    if (!player || player.isConnected) return // Player reconnected
    
    // Remove player
    room.players.delete(userId)
    this.disconnectTimers.delete(userId)
    
    // Update database
    const dbRoom = await prisma.room.findUnique({ where: { code: roomCode } })
    if (dbRoom) {
      await prisma.roomPlayer.updateMany({
        where: {
          roomId: dbRoom.id,
          userId,
        },
        data: {
          leftAt: new Date(),
        },
      })
    }
    
    // Check if host left
    if (player.isHost && room.players.size > 0) {
      // Transfer host to next player
      const newHost = room.players.values().next().value
      if (newHost) {
        newHost.isHost = true
        room.hostId = newHost.id
        
        const newHostSocket = this.userSockets.get(newHost.id)
        if (newHostSocket) {
          this.io.to(newHostSocket).emit('room:hostChanged', { newHostId: newHost.id })
        }
      }
    }
    
    // Check if room is empty
    if (room.players.size === 0) {
      await this.closeRoom(roomCode)
      return
    }
    
    // Broadcast presence update
    this.broadcastPresence(room)
  }
  
  // ==========================================================================
  // ROOM MANAGEMENT
  // ==========================================================================
  
  async kickPlayer(socket: Socket, roomCode: string, targetUserId: UserId, actorUserId: UserId): Promise<boolean> {
    const room = this.rooms.get(roomCode)
    if (!room) return false
    
    // Only host can kick
    if (room.hostId !== actorUserId) {
      socket.emit('room:error', { code: 'NOT_HOST', message: 'Only host can kick players' })
      return false
    }
    
    // Can't kick yourself
    if (targetUserId === actorUserId) {
      socket.emit('room:error', { code: 'CANNOT_KICK_SELF', message: 'Cannot kick yourself' })
      return false
    }
    
    const targetPlayer = room.players.get(targetUserId)
    if (!targetPlayer) return false
    
    // Remove player
    room.players.delete(targetUserId)
    
    // Clear any timers
    const timer = this.disconnectTimers.get(targetUserId)
    if (timer) {
      clearTimeout(timer)
      this.disconnectTimers.delete(targetUserId)
    }
    
    // Notify kicked player
    const targetSocketId = this.userSockets.get(targetUserId)
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('room:playerKicked', { playerId: targetUserId })
      
      const targetSocket = this.io.sockets.sockets.get(targetSocketId)
      if (targetSocket) {
        targetSocket.leave(roomCode)
        this.playerRooms.delete(targetSocketId)
      }
    }
    
    this.userSockets.delete(targetUserId)
    
    // Broadcast presence update
    this.broadcastPresence(room)
    
    return true
  }
  
  async startGame(socket: Socket, roomCode: string, userId: UserId): Promise<boolean> {
    const room = this.rooms.get(roomCode)
    if (!room) {
      socket.emit('room:error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' })
      return false
    }
    
    // Only host can start
    if (room.hostId !== userId) {
      socket.emit('room:error', { code: 'NOT_HOST', message: 'Only host can start the game' })
      return false
    }
    
    // Check minimum players
    const connectedCount = Array.from(room.players.values()).filter(p => p.isConnected).length
    const minPlayers = 1 // Could be game-specific
    
    if (connectedCount < minPlayers) {
      socket.emit('room:error', { code: 'NOT_ENOUGH_PLAYERS', message: 'Not enough players' })
      return false
    }
    
    // Update room status
    room.status = 'playing'
    
    // Update database
    await prisma.room.update({
      where: { code: roomCode },
      data: {
        status: 'PLAYING',
        startedAt: new Date(),
      },
    })
    
    // Broadcast game start
    this.io.to(roomCode).emit('room:gameStarted', { gameId: room.gameId })
    
    return true
  }
  
  async closeRoom(roomCode: string): Promise<void> {
    const room = this.rooms.get(roomCode)
    if (!room) return
    
    // Update database
    await prisma.room.update({
      where: { code: roomCode },
      data: {
        status: 'ABANDONED',
        endedAt: new Date(),
      },
    })
    
    // Clean up
    for (const player of room.players.values()) {
      this.userSockets.delete(player.id)
      const timer = this.disconnectTimers.get(player.id)
      if (timer) {
        clearTimeout(timer)
        this.disconnectTimers.delete(player.id)
      }
    }
    
    // Notify remaining players
    this.io.to(roomCode).emit('room:left', { roomCode })
    
    // Clean up socket.io room
    this.io.socketsLeave(roomCode)
    
    // Remove from memory
    this.rooms.delete(roomCode)
  }
  
  // ==========================================================================
  // HELPERS
  // ==========================================================================
  
  private getRoomData(room: RoomState): Room {
    const players: Player[] = Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      image: p.image,
      isHost: p.isHost,
      isConnected: p.isConnected,
      score: p.score,
    }))
    
    return {
      code: room.code,
      gameId: room.gameId as GameId,
      hostId: room.hostId,
      status: room.status,
      players,
      maxPlayers: room.maxPlayers,
      createdAt: room.createdAt.toISOString(),
    }
  }
  
  private broadcastPresence(room: RoomState): void {
    const presence = {
      roomCode: room.code,
      players: Array.from(room.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        image: p.image,
        isHost: p.isHost,
        isConnected: p.isConnected,
        score: p.score,
      })),
      hostId: room.hostId,
      status: room.status,
    }
    
    this.io.to(room.code).emit('room:presence', presence)
  }
  
  getRoom(roomCode: string): RoomState | undefined {
    return this.rooms.get(roomCode)
  }
  
  getRoomBySocket(socketId: string): RoomState | undefined {
    const roomCode = this.playerRooms.get(socketId)
    if (!roomCode) return undefined
    return this.rooms.get(roomCode)
  }
  
  getUserRoom(userId: UserId): string | undefined {
    for (const [code, room] of this.rooms) {
      if (room.players.has(userId)) {
        return code
      }
    }
    return undefined
  }
}
```

---

### Step 2: Room HTTP API

#### 2.1 Create `server/src/routes/rooms.ts`
```typescript
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { RoomService } from '../services/RoomService'
import { gameIdSchema, roomCodeSchema } from '@mini-arcade/shared'
import { z } from 'zod'

const createRoomSchema = z.object({
  gameId: gameIdSchema,
  maxPlayers: z.number().int().min(1).max(10).optional(),
})

export function createRoomRoutes(roomService: RoomService) {
  const router = Router()
  
  // Create room
  router.post('/', async (req, res) => {
    try {
      const { gameId, maxPlayers } = createRoomSchema.parse(req.body)
      
      // Get user from session/token (implement based on your auth)
      const userId = req.user?.id
      const userName = req.user?.name || 'Player'
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      
      const result = await roomService.createRoom(gameId, userId, userName, maxPlayers)
      
      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request', details: error.errors })
      }
      console.error('Create room error:', error)
      res.status(500).json({ error: 'Failed to create room' })
    }
  })
  
  // Get room info
  router.get('/:code', async (req, res) => {
    try {
      const code = roomCodeSchema.parse(req.params.code.toUpperCase())
      
      const room = await prisma.room.findUnique({
        where: { code },
        include: {
          creator: {
            select: { id: true, name: true, image: true },
          },
          players: {
            where: { leftAt: null },
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
      })
      
      if (!room) {
        return res.status(404).json({ error: 'Room not found' })
      }
      
      res.json({
        success: true,
        data: {
          code: room.code,
          gameId: room.gameId,
          status: room.status.toLowerCase(),
          maxPlayers: room.maxPlayers,
          createdAt: room.createdAt.toISOString(),
          creator: room.creator,
          players: room.players.map(p => ({
            id: p.user.id,
            name: p.user.name,
            image: p.user.image,
            isHost: p.isHost,
            score: p.score,
          })),
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid room code' })
      }
      console.error('Get room error:', error)
      res.status(500).json({ error: 'Failed to get room' })
    }
  })
  
  // Validate room code
  router.get('/:code/validate', async (req, res) => {
    try {
      const code = roomCodeSchema.parse(req.params.code.toUpperCase())
      
      const room = await prisma.room.findUnique({
        where: { code },
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
        return res.json({
          valid: false,
          reason: 'Room not found',
        })
      }
      
      if (room.status === 'FINISHED' || room.status === 'ABANDONED') {
        return res.json({
          valid: false,
          reason: 'Room has ended',
        })
      }
      
      if (room._count.players >= room.maxPlayers) {
        return res.json({
          valid: false,
          reason: 'Room is full',
        })
      }
      
      res.json({
        valid: true,
        gameId: room.gameId,
        playerCount: room._count.players,
        maxPlayers: room.maxPlayers,
      })
    } catch (error) {
      res.json({ valid: false, reason: 'Invalid room code format' })
    }
  })
  
  return router
}
```

---

### Step 3: Room Socket Handlers

#### 3.1 Update `server/src/socket/roomHandlers.ts`
```typescript
import { Socket } from 'socket.io'
import { RoomService } from '../services/RoomService'
import {
  RoomJoinPayload,
  RoomLeavePayload,
  RoomStartGamePayload,
  RoomKickPlayerPayload,
  safeParseSocketPayload,
  ROOM_EVENTS,
} from '@mini-arcade/shared'

export function setupRoomHandlers(socket: Socket, roomService: RoomService) {
  // Join room
  socket.on(ROOM_EVENTS.JOIN, async (payload: unknown) => {
    const result = safeParseSocketPayload<RoomJoinPayload>(ROOM_EVENTS.JOIN, payload)
    
    if (!result.success) {
      socket.emit('room:error', { code: 'VALIDATION_ERROR', message: result.error })
      return
    }
    
    const { roomCode, playerName } = result.data
    const userId = socket.data.userId
    const userName = playerName || socket.data.userName || 'Player'
    const userImage = socket.data.userImage
    
    if (!userId) {
      socket.emit('room:error', { code: 'NOT_AUTHENTICATED', message: 'Please sign in first' })
      return
    }
    
    await roomService.joinRoom(socket, roomCode.toUpperCase(), userId, userName, userImage)
  })
  
  // Leave room
  socket.on(ROOM_EVENTS.LEAVE, async (payload: unknown) => {
    const result = safeParseSocketPayload<RoomLeavePayload>(ROOM_EVENTS.LEAVE, payload)
    
    if (!result.success) {
      socket.emit('room:error', { code: 'VALIDATION_ERROR', message: result.error })
      return
    }
    
    const userId = socket.data.userId
    if (userId) {
      await roomService.leaveRoom(socket, userId)
    }
  })
  
  // Start game
  socket.on(ROOM_EVENTS.START_GAME, async (payload: unknown) => {
    const result = safeParseSocketPayload<RoomStartGamePayload>(ROOM_EVENTS.START_GAME, payload)
    
    if (!result.success) {
      socket.emit('room:error', { code: 'VALIDATION_ERROR', message: result.error })
      return
    }
    
    const userId = socket.data.userId
    if (!userId) {
      socket.emit('room:error', { code: 'NOT_AUTHENTICATED', message: 'Please sign in first' })
      return
    }
    
    await roomService.startGame(socket, result.data.roomCode.toUpperCase(), userId)
  })
  
  // Kick player
  socket.on(ROOM_EVENTS.KICK_PLAYER, async (payload: unknown) => {
    const result = safeParseSocketPayload<RoomKickPlayerPayload>(ROOM_EVENTS.KICK_PLAYER, payload)
    
    if (!result.success) {
      socket.emit('room:error', { code: 'VALIDATION_ERROR', message: result.error })
      return
    }
    
    const actorUserId = socket.data.userId
    if (!actorUserId) {
      socket.emit('room:error', { code: 'NOT_AUTHENTICATED', message: 'Please sign in first' })
      return
    }
    
    await roomService.kickPlayer(
      socket,
      result.data.roomCode.toUpperCase(),
      result.data.playerId,
      actorUserId
    )
  })
  
  // Handle disconnect
  socket.on('disconnect', async () => {
    const userId = socket.data.userId
    if (userId) {
      await roomService.leaveRoom(socket, userId)
    }
  })
}
```

---

### Step 4: Client-Side Room Components

#### 4.1 Create `client/src/hooks/useRoom.ts`
```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from './useSocket'
import { useAuth } from './useAuth'
import type { Room, Player, RoomPresence, RoomError, GameId } from '@mini-arcade/shared'

interface UseRoomOptions {
  roomCode?: string
  autoJoin?: boolean
}

interface UseRoomReturn {
  room: Room | null
  players: Player[]
  isHost: boolean
  isConnected: boolean
  isJoining: boolean
  error: string | null
  join: (code: string) => void
  leave: () => void
  startGame: () => void
  kickPlayer: (playerId: string) => void
}

export function useRoom(options: UseRoomOptions = {}): UseRoomReturn {
  const { roomCode, autoJoin = false } = options
  const { socket, isConnected: socketConnected, emit, on, off } = useSocket()
  const { user, isAuthenticated } = useAuth()
  
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const isHost = room?.hostId === user?.id
  
  // Handle room events
  useEffect(() => {
    if (!socketConnected) return
    
    const handleJoined = ({ room, playerId }: { room: Room; playerId: string }) => {
      setRoom(room)
      setPlayers(room.players)
      setIsJoining(false)
      setError(null)
    }
    
    const handlePresence = (presence: RoomPresence) => {
      setPlayers(presence.players)
      setRoom(prev => prev ? {
        ...prev,
        hostId: presence.hostId,
        status: presence.status,
        players: presence.players,
      } : null)
    }
    
    const handleLeft = () => {
      setRoom(null)
      setPlayers([])
    }
    
    const handleError = (err: RoomError) => {
      setError(err.message)
      setIsJoining(false)
    }
    
    const handleGameStarted = ({ gameId }: { gameId: GameId }) => {
      setRoom(prev => prev ? { ...prev, status: 'playing' } : null)
    }
    
    const handleKicked = ({ playerId }: { playerId: string }) => {
      if (playerId === user?.id) {
        setRoom(null)
        setPlayers([])
        setError('You have been kicked from the room')
      }
    }
    
    const handleHostChanged = ({ newHostId }: { newHostId: string }) => {
      setRoom(prev => prev ? { ...prev, hostId: newHostId } : null)
    }
    
    on('room:joined', handleJoined)
    on('room:presence', handlePresence)
    on('room:left', handleLeft)
    on('room:error', handleError)
    on('room:gameStarted', handleGameStarted)
    on('room:playerKicked', handleKicked)
    on('room:hostChanged', handleHostChanged)
    
    return () => {
      off('room:joined')
      off('room:presence')
      off('room:left')
      off('room:error')
      off('room:gameStarted')
      off('room:playerKicked')
      off('room:hostChanged')
    }
  }, [socketConnected, on, off, user?.id])
  
  // Auto-join if enabled
  useEffect(() => {
    if (autoJoin && roomCode && socketConnected && isAuthenticated && !room && !isJoining) {
      join(roomCode)
    }
  }, [autoJoin, roomCode, socketConnected, isAuthenticated, room, isJoining])
  
  const join = useCallback((code: string) => {
    if (!isAuthenticated) {
      setError('Please sign in to join a room')
      return
    }
    
    setIsJoining(true)
    setError(null)
    emit('room:join', { roomCode: code.toUpperCase() })
  }, [emit, isAuthenticated])
  
  const leave = useCallback(() => {
    if (room) {
      emit('room:leave', { roomCode: room.code })
    }
  }, [emit, room])
  
  const startGame = useCallback(() => {
    if (room && isHost) {
      emit('room:startGame', { roomCode: room.code })
    }
  }, [emit, room, isHost])
  
  const kickPlayer = useCallback((playerId: string) => {
    if (room && isHost) {
      emit('room:kickPlayer', { roomCode: room.code, playerId })
    }
  }, [emit, room, isHost])
  
  return {
    room,
    players,
    isHost,
    isConnected: socketConnected && !!room,
    isJoining,
    error,
    join,
    leave,
    startGame,
    kickPlayer,
  }
}
```

#### 4.2 Create Room Lobby Component `client/src/components/room/RoomLobby.tsx`
```typescript
'use client'

import { useRoom } from '@/hooks/useRoom'
import { PlayerList } from './PlayerList'
import { RoomCode } from './RoomCode'
import { GAMES } from '@mini-arcade/shared'

interface RoomLobbyProps {
  roomCode: string
}

export function RoomLobby({ roomCode }: RoomLobbyProps) {
  const {
    room,
    players,
    isHost,
    isConnected,
    isJoining,
    error,
    startGame,
    kickPlayer,
    leave,
  } = useRoom({ roomCode, autoJoin: true })
  
  if (isJoining) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-white">Joining room...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
        <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
        <p className="text-red-200">{error}</p>
        <a href="/" className="inline-block mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white">
          Back to Home
        </a>
      </div>
    )
  }
  
  if (!room) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Room not found</p>
      </div>
    )
  }
  
  const game = GAMES[room.gameId as keyof typeof GAMES]
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{game?.name || room.gameId}</h1>
            <p className="text-gray-400">{game?.description}</p>
          </div>
          <RoomCode code={room.code} />
        </div>
        
        <div className="flex gap-4 text-sm text-gray-400">
          <span>Status: <span className="text-white capitalize">{room.status}</span></span>
          <span>Players: <span className="text-white">{players.length}/{room.maxPlayers}</span></span>
        </div>
      </div>
      
      <PlayerList
        players={players}
        currentUserId={room.hostId}
        isHost={isHost}
        onKick={kickPlayer}
      />
      
      <div className="flex gap-4 mt-6">
        <button
          onClick={leave}
          className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Leave Room
        </button>
        
        {isHost && room.status === 'waiting' && (
          <button
            onClick={startGame}
            disabled={players.filter(p => p.isConnected).length < 1}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Start Game
          </button>
        )}
      </div>
    </div>
  )
}
```

---

## Files Created/Modified

```
server/src/
├── services/
│   └── RoomService.ts
├── routes/
│   └── rooms.ts
└── socket/
    └── roomHandlers.ts

client/src/
├── hooks/
│   └── useRoom.ts
├── components/
│   └── room/
│       ├── RoomLobby.tsx
│       ├── RoomCode.tsx
│       ├── PlayerList.tsx
│       ├── JoinRoomForm.tsx
│       └── CreateRoomButton.tsx
└── app/
    └── rooms/
        └── [code]/
            └── page.tsx
```

---

## Next Phase
Once all acceptance criteria are met, proceed to **Phase 4: Game Runtime Layer**.
