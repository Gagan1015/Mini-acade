# Phase 4: Game Runtime Layer

## Overview
Create a unified game runtime layer that manages per-room game state, handles game events, and provides a consistent interface for implementing different games.

**Status:** To Implement  
**Priority:** High  
**Estimated Time:** 4-6 hours  
**Dependencies:** Phase 0, Phase 1, Phase 2, Phase 3 completed

---

## Goals
- Create generic GameRuntime interface
- Implement per-room state machine
- Route events to correct game runtime
- Handle round flow (start, play, end)
- Persist game results
- Support multiple concurrent games

---

## Acceptance Criteria
- [ ] GameRuntime interface defined and documented
- [ ] Each game can implement the interface
- [ ] Events route to correct room's game
- [ ] State persists across reconnections
- [ ] Round lifecycle works correctly
- [ ] Results are saved to database
- [ ] No state leaks between rooms

---

## Implementation Steps

### Step 1: Define Game Runtime Interface

#### 1.1 Create `shared/src/gameRuntime.ts`
```typescript
import { UserId, GameId, Player } from './types'

/**
 * Game configuration passed when creating a runtime
 */
export interface GameConfig {
  gameId: GameId
  roomCode: string
  players: Player[]
  settings?: GameSettings
}

/**
 * Common game settings
 */
export interface GameSettings {
  rounds?: number
  roundTime?: number // seconds
  maxPlayers?: number
  customSettings?: Record<string, unknown>
}

/**
 * Game state snapshot (for reconnection sync)
 */
export interface GameSnapshot {
  phase: 'waiting' | 'playing' | 'roundEnd' | 'gameEnd'
  currentRound: number
  totalRounds: number
  scores: Record<UserId, number>
  roundData?: unknown
  timeRemaining?: number
}

/**
 * Result of processing a game event
 */
export interface GameEventResult {
  success: boolean
  broadcast?: {
    event: string
    data: unknown
    to?: 'room' | 'player'
    playerId?: UserId
  }[]
  error?: string
}

/**
 * Interface that all games must implement
 */
export interface IGameRuntime {
  // Lifecycle
  initialize(): Promise<void>
  start(): Promise<GameEventResult>
  pause(): Promise<void>
  resume(): Promise<void>
  end(): Promise<void>
  
  // Player management
  onPlayerJoin(player: Player): GameEventResult
  onPlayerLeave(playerId: UserId): GameEventResult
  onPlayerReconnect(player: Player): GameEventResult
  
  // Game events
  onClientEvent(playerId: UserId, eventName: string, payload: unknown): Promise<GameEventResult>
  
  // State
  getSnapshot(): GameSnapshot
  getRoundState(): unknown
  
  // Results
  getResults(): GameResultData[]
}

/**
 * Game result data for persistence
 */
export interface GameResultData {
  playerId: UserId
  score: number
  rank: number
  isWinner: boolean
  metadata?: Record<string, unknown>
}

/**
 * Base round state
 */
export interface BaseRoundState {
  roundNumber: number
  startedAt: Date
  endsAt: Date
  isActive: boolean
}
```

---

### Step 2: Create Base Game Runtime

#### 2.1 Create `server/src/games/BaseGameRuntime.ts`
```typescript
import { Server } from 'socket.io'
import { prisma } from '../lib/prisma'
import {
  IGameRuntime,
  GameConfig,
  GameSnapshot,
  GameEventResult,
  GameResultData,
  Player,
  UserId,
  GameId,
} from '@mini-arcade/shared'

export abstract class BaseGameRuntime implements IGameRuntime {
  protected roomCode: string
  protected gameId: GameId
  protected players: Map<UserId, Player> = new Map()
  protected scores: Map<UserId, number> = new Map()
  protected currentRound: number = 0
  protected totalRounds: number = 5
  protected roundTime: number = 60 // seconds
  protected phase: 'waiting' | 'playing' | 'roundEnd' | 'gameEnd' = 'waiting'
  protected roundTimer: NodeJS.Timeout | null = null
  protected roundStartedAt: Date | null = null
  protected roundEndsAt: Date | null = null
  
  constructor(
    protected io: Server,
    protected config: GameConfig
  ) {
    this.roomCode = config.roomCode
    this.gameId = config.gameId
    this.totalRounds = config.settings?.rounds || 5
    this.roundTime = config.settings?.roundTime || 60
    
    // Initialize players
    for (const player of config.players) {
      this.players.set(player.id, player)
      this.scores.set(player.id, 0)
    }
  }
  
  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================
  
  async initialize(): Promise<void> {
    // Override in subclass for game-specific initialization
  }
  
  async start(): Promise<GameEventResult> {
    this.phase = 'playing'
    this.currentRound = 0
    return this.startNextRound()
  }
  
  async pause(): Promise<void> {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer)
      this.roundTimer = null
    }
  }
  
  async resume(): Promise<void> {
    // Recalculate remaining time and restart timer
    if (this.roundEndsAt && this.phase === 'playing') {
      const remaining = this.roundEndsAt.getTime() - Date.now()
      if (remaining > 0) {
        this.roundTimer = setTimeout(() => this.endRound(), remaining)
      } else {
        await this.endRound()
      }
    }
  }
  
  async end(): Promise<void> {
    this.phase = 'gameEnd'
    
    if (this.roundTimer) {
      clearTimeout(this.roundTimer)
      this.roundTimer = null
    }
    
    // Save results
    await this.saveResults()
    
    // Broadcast game end
    this.broadcast('gameEnd', {
      finalScores: this.getFinalScores(),
    })
  }
  
  // ==========================================================================
  // PLAYER MANAGEMENT
  // ==========================================================================
  
  onPlayerJoin(player: Player): GameEventResult {
    if (this.phase !== 'waiting') {
      return { success: false, error: 'Game already in progress' }
    }
    
    this.players.set(player.id, player)
    this.scores.set(player.id, 0)
    
    return { success: true }
  }
  
  onPlayerLeave(playerId: UserId): GameEventResult {
    const player = this.players.get(playerId)
    if (player) {
      player.isConnected = false
    }
    
    // Check if any players remain
    const connectedPlayers = Array.from(this.players.values()).filter(p => p.isConnected)
    if (connectedPlayers.length === 0) {
      this.end()
    }
    
    return { success: true }
  }
  
  onPlayerReconnect(player: Player): GameEventResult {
    const existingPlayer = this.players.get(player.id)
    if (existingPlayer) {
      existingPlayer.isConnected = true
    }
    
    // Send current state
    return {
      success: true,
      broadcast: [{
        event: 'sync',
        data: this.getSnapshot(),
        to: 'player',
        playerId: player.id,
      }],
    }
  }
  
  // ==========================================================================
  // GAME EVENTS (Abstract - implement in subclass)
  // ==========================================================================
  
  abstract onClientEvent(
    playerId: UserId,
    eventName: string,
    payload: unknown
  ): Promise<GameEventResult>
  
  // ==========================================================================
  // ROUND MANAGEMENT
  // ==========================================================================
  
  protected async startNextRound(): Promise<GameEventResult> {
    this.currentRound++
    
    if (this.currentRound > this.totalRounds) {
      await this.end()
      return { success: true }
    }
    
    this.phase = 'playing'
    this.roundStartedAt = new Date()
    this.roundEndsAt = new Date(Date.now() + this.roundTime * 1000)
    
    // Clear previous timer
    if (this.roundTimer) {
      clearTimeout(this.roundTimer)
    }
    
    // Set round timer
    this.roundTimer = setTimeout(() => this.endRound(), this.roundTime * 1000)
    
    // Get round-specific data
    const roundData = await this.prepareRound()
    
    return {
      success: true,
      broadcast: [{
        event: 'roundStarted',
        data: {
          roundNumber: this.currentRound,
          totalRounds: this.totalRounds,
          roundEndsAt: this.roundEndsAt.toISOString(),
          ...roundData,
        },
        to: 'room',
      }],
    }
  }
  
  protected async endRound(): Promise<void> {
    this.phase = 'roundEnd'
    
    if (this.roundTimer) {
      clearTimeout(this.roundTimer)
      this.roundTimer = null
    }
    
    // Get round results
    const roundResults = this.calculateRoundResults()
    
    // Broadcast round end
    this.broadcast('roundEnded', {
      roundNumber: this.currentRound,
      results: roundResults,
      scores: Object.fromEntries(this.scores),
    })
    
    // Wait before starting next round
    setTimeout(async () => {
      if (this.currentRound < this.totalRounds) {
        await this.startNextRound()
      } else {
        await this.end()
      }
    }, 5000) // 5 second intermission
  }
  
  // ==========================================================================
  // ABSTRACT METHODS (Implement in subclass)
  // ==========================================================================
  
  /**
   * Prepare data for a new round
   * Override in subclass to generate questions, words, etc.
   */
  protected abstract prepareRound(): Promise<Record<string, unknown>>
  
  /**
   * Calculate round results
   * Override in subclass to determine winners, scores, etc.
   */
  protected abstract calculateRoundResults(): Record<string, unknown>
  
  /**
   * Get current round state for sync
   * Override in subclass to include game-specific state
   */
  abstract getRoundState(): unknown
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  
  getSnapshot(): GameSnapshot {
    const timeRemaining = this.roundEndsAt
      ? Math.max(0, Math.floor((this.roundEndsAt.getTime() - Date.now()) / 1000))
      : undefined
    
    return {
      phase: this.phase,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      scores: Object.fromEntries(this.scores),
      roundData: this.getRoundState(),
      timeRemaining,
    }
  }
  
  // ==========================================================================
  // RESULTS
  // ==========================================================================
  
  getResults(): GameResultData[] {
    const sortedScores = Array.from(this.scores.entries())
      .sort((a, b) => b[1] - a[1])
    
    const highestScore = sortedScores[0]?.[1] || 0
    
    return sortedScores.map(([playerId, score], index) => ({
      playerId,
      score,
      rank: index + 1,
      isWinner: score === highestScore && score > 0,
    }))
  }
  
  protected getFinalScores(): Array<{ playerId: UserId; playerName: string; score: number; rank: number }> {
    const results = this.getResults()
    return results.map(r => ({
      playerId: r.playerId,
      playerName: this.players.get(r.playerId)?.name || 'Unknown',
      score: r.score,
      rank: r.rank,
    }))
  }
  
  protected async saveResults(): Promise<void> {
    const results = this.getResults()
    const room = await prisma.room.findUnique({ where: { code: this.roomCode } })
    
    if (!room) return
    
    // Save individual results
    for (const result of results) {
      await prisma.gameResult.create({
        data: {
          roomId: room.id,
          userId: result.playerId,
          gameId: this.gameId,
          score: result.score,
          rank: result.rank,
          isWinner: result.isWinner,
          metadata: result.metadata,
        },
      })
      
      // Update game stats
      await prisma.gameStat.upsert({
        where: {
          userId_gameId: {
            userId: result.playerId,
            gameId: this.gameId,
          },
        },
        create: {
          userId: result.playerId,
          gameId: this.gameId,
          gamesPlayed: 1,
          gamesWon: result.isWinner ? 1 : 0,
          totalScore: result.score,
          highScore: result.score,
        },
        update: {
          gamesPlayed: { increment: 1 },
          gamesWon: result.isWinner ? { increment: 1 } : undefined,
          totalScore: { increment: result.score },
          highScore: {
            set: prisma.raw(`GREATEST("highScore", ${result.score})`),
          },
        },
      })
    }
    
    // Update room status
    await prisma.room.update({
      where: { code: this.roomCode },
      data: {
        status: 'FINISHED',
        endedAt: new Date(),
      },
    })
  }
  
  // ==========================================================================
  // HELPERS
  // ==========================================================================
  
  protected addScore(playerId: UserId, points: number): void {
    const current = this.scores.get(playerId) || 0
    this.scores.set(playerId, current + points)
  }
  
  protected broadcast(event: string, data: unknown): void {
    this.io.to(this.roomCode).emit(`${this.gameId}:${event}`, data)
  }
  
  protected emitToPlayer(playerId: UserId, event: string, data: unknown): void {
    // Get socket ID for player and emit
    const player = this.players.get(playerId)
    if (player) {
      this.io.to(this.roomCode).emit(`${this.gameId}:${event}`, { ...data, targetPlayerId: playerId })
    }
  }
  
  protected getConnectedPlayers(): Player[] {
    return Array.from(this.players.values()).filter(p => p.isConnected)
  }
}
```

---

### Step 3: Create Game Manager

#### 3.1 Create `server/src/games/GameManager.ts`
```typescript
import { Server, Socket } from 'socket.io'
import { BaseGameRuntime } from './BaseGameRuntime'
import { SkribbleRuntime } from './skribble/SkribbleRuntime'
import { TriviaRuntime } from './trivia/TriviaRuntime'
import { WordelRuntime } from './wordel/WordelRuntime'
import { FlagelRuntime } from './flagel/FlagelRuntime'
import { RoomService } from '../services/RoomService'
import { GameId, GameConfig, Player, UserId, safeParseSocketPayload } from '@mini-arcade/shared'

type RuntimeConstructor = new (io: Server, config: GameConfig) => BaseGameRuntime

const GAME_RUNTIMES: Record<GameId, RuntimeConstructor> = {
  skribble: SkribbleRuntime,
  trivia: TriviaRuntime,
  wordel: WordelRuntime,
  flagel: FlagelRuntime,
}

export class GameManager {
  private games: Map<string, BaseGameRuntime> = new Map() // roomCode -> runtime
  
  constructor(
    private io: Server,
    private roomService: RoomService
  ) {}
  
  /**
   * Create and start a game for a room
   */
  async createGame(roomCode: string, gameId: GameId, players: Player[]): Promise<BaseGameRuntime | null> {
    // Check if game already exists
    if (this.games.has(roomCode)) {
      console.error(`Game already exists for room ${roomCode}`)
      return null
    }
    
    const RuntimeClass = GAME_RUNTIMES[gameId]
    if (!RuntimeClass) {
      console.error(`Unknown game ID: ${gameId}`)
      return null
    }
    
    const config: GameConfig = {
      gameId,
      roomCode,
      players,
      settings: {
        rounds: 5,
        roundTime: 60,
      },
    }
    
    const runtime = new RuntimeClass(this.io, config)
    await runtime.initialize()
    
    this.games.set(roomCode, runtime)
    
    // Start the game
    const result = await runtime.start()
    if (result.broadcast) {
      for (const b of result.broadcast) {
        if (b.to === 'room') {
          this.io.to(roomCode).emit(b.event, b.data)
        }
      }
    }
    
    return runtime
  }
  
  /**
   * Get game runtime for a room
   */
  getGame(roomCode: string): BaseGameRuntime | undefined {
    return this.games.get(roomCode)
  }
  
  /**
   * Handle game event from client
   */
  async handleGameEvent(
    socket: Socket,
    roomCode: string,
    eventName: string,
    payload: unknown
  ): Promise<void> {
    const game = this.games.get(roomCode)
    if (!game) {
      socket.emit('room:error', { code: 'GAME_NOT_FOUND', message: 'Game not found' })
      return
    }
    
    const userId = socket.data.userId
    if (!userId) {
      socket.emit('room:error', { code: 'NOT_AUTHENTICATED', message: 'Not authenticated' })
      return
    }
    
    try {
      const result = await game.onClientEvent(userId, eventName, payload)
      
      if (!result.success && result.error) {
        socket.emit('room:error', { code: 'GAME_ERROR', message: result.error })
      }
      
      // Handle broadcasts
      if (result.broadcast) {
        for (const b of result.broadcast) {
          if (b.to === 'room') {
            this.io.to(roomCode).emit(b.event, b.data)
          } else if (b.to === 'player' && b.playerId) {
            // Emit to specific player
            socket.emit(b.event, b.data)
          }
        }
      }
    } catch (error) {
      console.error(`Game event error: ${eventName}`, error)
      socket.emit('room:error', { code: 'GAME_ERROR', message: 'Game error occurred' })
    }
  }
  
  /**
   * Handle player leaving during game
   */
  handlePlayerLeave(roomCode: string, playerId: UserId): void {
    const game = this.games.get(roomCode)
    if (game) {
      game.onPlayerLeave(playerId)
    }
  }
  
  /**
   * Handle player reconnecting during game
   */
  handlePlayerReconnect(roomCode: string, player: Player): void {
    const game = this.games.get(roomCode)
    if (game) {
      const result = game.onPlayerReconnect(player)
      if (result.broadcast) {
        for (const b of result.broadcast) {
          if (b.to === 'player' && b.playerId) {
            // Send sync to reconnected player
            this.io.to(roomCode).emit(b.event, { ...b.data, targetPlayerId: b.playerId })
          }
        }
      }
    }
  }
  
  /**
   * End and cleanup a game
   */
  async endGame(roomCode: string): Promise<void> {
    const game = this.games.get(roomCode)
    if (game) {
      await game.end()
      this.games.delete(roomCode)
    }
  }
  
  /**
   * Get all active games
   */
  getActiveGames(): Array<{ roomCode: string; gameId: GameId }> {
    return Array.from(this.games.entries()).map(([roomCode, game]) => ({
      roomCode,
      gameId: game['gameId'] as GameId,
    }))
  }
}
```

---

### Step 4: Game Event Router

#### 4.1 Create `server/src/socket/gameHandlers.ts`
```typescript
import { Socket } from 'socket.io'
import { GameManager } from '../games/GameManager'
import {
  SKRIBBLE_EVENTS,
  TRIVIA_EVENTS,
  WORDEL_EVENTS,
  FLAGEL_EVENTS,
  safeParseSocketPayload,
} from '@mini-arcade/shared'

// Map of event prefixes to game IDs
const EVENT_GAME_MAP: Record<string, string> = {
  draw: 'skribble',
  trivia: 'trivia',
  wordel: 'wordel',
  flagel: 'flagel',
}

export function setupGameHandlers(socket: Socket, gameManager: GameManager) {
  // Helper to get room code from socket
  const getRoomCode = (): string | null => {
    const rooms = Array.from(socket.rooms)
    // Find room code (not socket ID)
    return rooms.find(r => r !== socket.id && r.length === 6) || null
  }
  
  // ==========================================================================
  // SKRIBBLE EVENTS
  // ==========================================================================
  
  socket.on(SKRIBBLE_EVENTS.STROKE_BATCH, async (payload) => {
    const roomCode = getRoomCode()
    if (roomCode) {
      await gameManager.handleGameEvent(socket, roomCode, 'strokeBatch', payload)
    }
  })
  
  socket.on(SKRIBBLE_EVENTS.CLEAR_CANVAS, async (payload) => {
    const roomCode = getRoomCode()
    if (roomCode) {
      await gameManager.handleGameEvent(socket, roomCode, 'clearCanvas', payload)
    }
  })
  
  socket.on(SKRIBBLE_EVENTS.GUESS, async (payload) => {
    const roomCode = getRoomCode()
    if (roomCode) {
      await gameManager.handleGameEvent(socket, roomCode, 'guess', payload)
    }
  })
  
  socket.on(SKRIBBLE_EVENTS.REQUEST_SYNC, async (payload) => {
    const roomCode = getRoomCode()
    if (roomCode) {
      await gameManager.handleGameEvent(socket, roomCode, 'requestSync', payload)
    }
  })
  
  // ==========================================================================
  // TRIVIA EVENTS
  // ==========================================================================
  
  socket.on(TRIVIA_EVENTS.SUBMIT_ANSWER, async (payload) => {
    const roomCode = getRoomCode()
    if (roomCode) {
      await gameManager.handleGameEvent(socket, roomCode, 'submitAnswer', payload)
    }
  })
  
  // ==========================================================================
  // WORDEL EVENTS
  // ==========================================================================
  
  socket.on(WORDEL_EVENTS.SUBMIT_GUESS, async (payload) => {
    const roomCode = getRoomCode()
    if (roomCode) {
      await gameManager.handleGameEvent(socket, roomCode, 'submitGuess', payload)
    }
  })
  
  // ==========================================================================
  // FLAGEL EVENTS
  // ==========================================================================
  
  socket.on(FLAGEL_EVENTS.SUBMIT_GUESS, async (payload) => {
    const roomCode = getRoomCode()
    if (roomCode) {
      await gameManager.handleGameEvent(socket, roomCode, 'submitGuess', payload)
    }
  })
  
  socket.on(FLAGEL_EVENTS.SKIP, async (payload) => {
    const roomCode = getRoomCode()
    if (roomCode) {
      await gameManager.handleGameEvent(socket, roomCode, 'skip', payload)
    }
  })
}
```

---

### Step 5: Integration with Server

#### 5.1 Update `server/src/index.ts`
```typescript
import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { RoomService } from './services/RoomService'
import { GameManager } from './games/GameManager'
import { setupRoomHandlers } from './socket/roomHandlers'
import { setupGameHandlers } from './socket/gameHandlers'
import { createRoomRoutes } from './routes/rooms'
import { authenticateSocket } from './middleware/auth'

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Initialize services
const roomService = new RoomService(io)
const gameManager = new GameManager(io, roomService)

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())

// Routes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/rooms', createRoomRoutes(roomService))

// Socket authentication middleware
io.use(authenticateSocket)

// Socket connection
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}, user: ${socket.data.userId}`)
  
  // Setup handlers
  setupRoomHandlers(socket, roomService, gameManager)
  setupGameHandlers(socket, gameManager)
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

// Start server
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...')
  httpServer.close(() => {
    process.exit(0)
  })
})
```

---

## Files Created/Modified

```
shared/src/
└── gameRuntime.ts (new)

server/src/
├── games/
│   ├── BaseGameRuntime.ts
│   ├── GameManager.ts
│   ├── skribble/
│   │   └── SkribbleRuntime.ts (placeholder)
│   ├── trivia/
│   │   └── TriviaRuntime.ts (placeholder)
│   ├── wordel/
│   │   └── WordelRuntime.ts (placeholder)
│   └── flagel/
│       └── FlagelRuntime.ts (placeholder)
├── socket/
│   └── gameHandlers.ts
└── index.ts (updated)
```

---

## Game Runtime Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       Client                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    Socket.IO Events
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Socket Handler                                │
│  - Validates payload with Zod                                   │
│  - Extracts roomCode from socket rooms                          │
│  - Routes to GameManager                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GameManager                                   │
│  - Looks up GameRuntime by roomCode                             │
│  - Calls runtime.onClientEvent()                                │
│  - Handles broadcasts from result                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  GameRuntime (per game)                          │
│  - Manages game state                                           │
│  - Processes player actions                                     │
│  - Calculates scores                                            │
│  - Returns broadcast instructions                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Next Phase
Now implement individual games. Start with **Game: Skribble** as it's the most complex.
