# Phase 1: Shared Contracts (Types + Zod Validation)

## Overview
Create comprehensive shared contracts including Socket.IO event types, Zod validation schemas, and TypeScript interfaces. This ensures type safety between client and server.

**Status:** To Implement  
**Priority:** Critical (Foundation)  
**Estimated Time:** 2-3 hours  
**Dependencies:** Phase 0 completed

---

## Goals
- Define all Socket.IO event names as constants
- Create Zod schemas for all event payloads
- Generate TypeScript types from Zod schemas
- Create server-side validation helper
- Ensure client and server use identical contracts

---

## Acceptance Criteria
- [ ] All Socket.IO events defined in shared package
- [ ] Zod schemas validate all event payloads
- [ ] TypeScript types inferred from Zod schemas
- [ ] Server rejects invalid payloads
- [ ] Client has type-safe event emissions
- [ ] No TypeScript errors in either package

---

## Implementation Steps

### Step 1: Define Socket Event Constants

#### 1.1 Update `shared/src/socketEvents.ts`
```typescript
/**
 * Socket.IO Event Names
 * All events are namespaced by feature (room:*, draw:*, trivia:*, etc.)
 */

// =============================================================================
// CONNECTION EVENTS
// =============================================================================
export const CONNECTION_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
} as const

// =============================================================================
// ROOM EVENTS
// =============================================================================
export const ROOM_EVENTS = {
  // Client -> Server
  JOIN: 'room:join',
  LEAVE: 'room:leave',
  START_GAME: 'room:startGame',
  KICK_PLAYER: 'room:kickPlayer',
  
  // Server -> Client
  JOINED: 'room:joined',
  LEFT: 'room:left',
  PRESENCE: 'room:presence',
  GAME_STARTED: 'room:gameStarted',
  PLAYER_KICKED: 'room:playerKicked',
  ERROR: 'room:error',
  HOST_CHANGED: 'room:hostChanged',
} as const

// =============================================================================
// SKRIBBLE (DRAWING) EVENTS
// =============================================================================
export const SKRIBBLE_EVENTS = {
  // Client -> Server
  STROKE_BATCH: 'draw:strokeBatch',
  CLEAR_CANVAS: 'draw:clearCanvas',
  GUESS: 'draw:guess',
  REQUEST_SYNC: 'draw:requestSync',
  
  // Server -> Client
  STROKE_BROADCAST: 'draw:strokeBroadcast',
  CANVAS_CLEARED: 'draw:canvasCleared',
  GUESS_RESULT: 'draw:guessResult',
  CORRECT_GUESS: 'draw:correctGuess',
  SYNC: 'draw:sync',
  ROUND_STARTED: 'draw:roundStarted',
  ROUND_ENDED: 'draw:roundEnded',
  TURN_STARTED: 'draw:turnStarted',
  WORD_HINT: 'draw:wordHint',
} as const

// =============================================================================
// TRIVIA EVENTS
// =============================================================================
export const TRIVIA_EVENTS = {
  // Client -> Server
  SUBMIT_ANSWER: 'trivia:submitAnswer',
  REQUEST_NEXT: 'trivia:requestNext',
  
  // Server -> Client
  ROUND_STARTED: 'trivia:roundStarted',
  ROUND_ENDED: 'trivia:roundEnded',
  ANSWER_RESULT: 'trivia:answerResult',
  PLAYER_ANSWERED: 'trivia:playerAnswered',
  GAME_ENDED: 'trivia:gameEnded',
  TIMER_TICK: 'trivia:timerTick',
} as const

// =============================================================================
// WORDEL EVENTS
// =============================================================================
export const WORDEL_EVENTS = {
  // Client -> Server
  SUBMIT_GUESS: 'wordel:submitGuess',
  
  // Server -> Client
  ROUND_STARTED: 'wordel:roundStarted',
  GUESS_RESULT: 'wordel:guessResult',
  ROUND_ENDED: 'wordel:roundEnded',
  GAME_ENDED: 'wordel:gameEnded',
  OPPONENT_PROGRESS: 'wordel:opponentProgress',
} as const

// =============================================================================
// FLAGEL EVENTS
// =============================================================================
export const FLAGEL_EVENTS = {
  // Client -> Server
  SUBMIT_GUESS: 'flagel:submitGuess',
  SKIP: 'flagel:skip',
  
  // Server -> Client
  ROUND_STARTED: 'flagel:roundStarted',
  GUESS_RESULT: 'flagel:guessResult',
  ROUND_ENDED: 'flagel:roundEnded',
  GAME_ENDED: 'flagel:gameEnded',
  OPPONENT_PROGRESS: 'flagel:opponentProgress',
} as const

// =============================================================================
// CHAT EVENTS (for in-game communication)
// =============================================================================
export const CHAT_EVENTS = {
  // Client -> Server
  SEND_MESSAGE: 'chat:sendMessage',
  
  // Server -> Client
  MESSAGE: 'chat:message',
  SYSTEM_MESSAGE: 'chat:systemMessage',
} as const

// =============================================================================
// ADMIN EVENTS (for admin dashboard realtime updates)
// =============================================================================
export const ADMIN_EVENTS = {
  // Server -> Client (admin only)
  STATS_UPDATE: 'admin:statsUpdate',
  USER_ACTIVITY: 'admin:userActivity',
  ROOM_UPDATE: 'admin:roomUpdate',
  ERROR_LOG: 'admin:errorLog',
} as const

// Combined export for convenience
export const SOCKET_EVENTS = {
  ...CONNECTION_EVENTS,
  ...ROOM_EVENTS,
  ...SKRIBBLE_EVENTS,
  ...TRIVIA_EVENTS,
  ...WORDEL_EVENTS,
  ...FLAGEL_EVENTS,
  ...CHAT_EVENTS,
  ...ADMIN_EVENTS,
} as const

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS]
```

---

### Step 2: Create Comprehensive Zod Schemas

#### 2.1 Update `shared/src/schemas.ts`
```typescript
import { z } from 'zod'

// =============================================================================
// PRIMITIVE SCHEMAS
// =============================================================================
export const userIdSchema = z.string().min(1).max(50)
export const roomCodeSchema = z.string().length(6).regex(/^[A-Z0-9]+$/, 'Room code must be 6 alphanumeric characters')
export const gameIdSchema = z.enum(['skribble', 'trivia', 'wordel', 'flagel'])
export const playerNameSchema = z.string().min(1).max(30).trim()

// =============================================================================
// USER SCHEMAS
// =============================================================================
export const userSchema = z.object({
  id: userIdSchema,
  name: playerNameSchema,
  email: z.string().email(),
  image: z.string().url().optional(),
  role: z.enum(['user', 'admin']).default('user'),
})

export const playerSchema = z.object({
  id: userIdSchema,
  name: playerNameSchema,
  image: z.string().url().optional(),
  isHost: z.boolean().default(false),
  isConnected: z.boolean().default(true),
  score: z.number().int().min(0).default(0),
})

// =============================================================================
// ROOM SCHEMAS
// =============================================================================
export const roomStatusSchema = z.enum(['waiting', 'playing', 'finished'])

export const roomSchema = z.object({
  code: roomCodeSchema,
  gameId: gameIdSchema,
  hostId: userIdSchema,
  status: roomStatusSchema,
  players: z.array(playerSchema),
  maxPlayers: z.number().int().min(1).max(10).default(8),
  createdAt: z.string().datetime(),
})

// Room Event Payloads
export const roomJoinPayloadSchema = z.object({
  roomCode: roomCodeSchema,
  playerName: playerNameSchema.optional(),
})

export const roomLeavePayloadSchema = z.object({
  roomCode: roomCodeSchema,
})

export const roomStartGamePayloadSchema = z.object({
  roomCode: roomCodeSchema,
})

export const roomKickPlayerPayloadSchema = z.object({
  roomCode: roomCodeSchema,
  playerId: userIdSchema,
})

export const roomPresenceSchema = z.object({
  roomCode: roomCodeSchema,
  players: z.array(playerSchema),
  hostId: userIdSchema,
  status: roomStatusSchema,
})

export const roomErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
})

// =============================================================================
// SKRIBBLE (DRAWING) SCHEMAS
// =============================================================================
export const pointSchema = z.object({
  x: z.number().min(0).max(2000),
  y: z.number().min(0).max(2000),
})

export const strokeSchema = z.object({
  points: z.array(pointSchema).min(1).max(1000),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  width: z.number().min(1).max(50),
  tool: z.enum(['brush', 'eraser']).default('brush'),
})

export const strokeBatchPayloadSchema = z.object({
  roomCode: roomCodeSchema,
  strokes: z.array(strokeSchema).min(1).max(100),
  timestamp: z.number(),
})

export const clearCanvasPayloadSchema = z.object({
  roomCode: roomCodeSchema,
})

export const guessPayloadSchema = z.object({
  roomCode: roomCodeSchema,
  guess: z.string().min(1).max(100).trim(),
})

export const requestSyncPayloadSchema = z.object({
  roomCode: roomCodeSchema,
})

export const skribbleRoundStartedSchema = z.object({
  roundNumber: z.number().int().min(1),
  totalRounds: z.number().int().min(1),
  drawerId: userIdSchema,
  wordLength: z.number().int().min(1),
  wordHint: z.string().optional(), // e.g., "_ _ _ _ E"
  roundEndsAt: z.string().datetime(),
})

export const skribbleGuessResultSchema = z.object({
  playerId: userIdSchema,
  isCorrect: z.boolean(),
  pointsEarned: z.number().int().min(0),
  guess: z.string().optional(), // Only if incorrect, for chat display
})

// =============================================================================
// TRIVIA SCHEMAS
// =============================================================================
export const triviaAnswerSchema = z.object({
  id: z.string(),
  text: z.string(),
})

export const triviaQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  answers: z.array(triviaAnswerSchema).length(4),
  category: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
})

export const triviaSubmitAnswerPayloadSchema = z.object({
  roomCode: roomCodeSchema,
  questionId: z.string(),
  answerId: z.string(),
})

export const triviaRoundStartedSchema = z.object({
  roundNumber: z.number().int().min(1),
  totalRounds: z.number().int().min(1),
  question: triviaQuestionSchema,
  roundEndsAt: z.string().datetime(),
  timeLimit: z.number().int().min(1), // seconds
})

export const triviaRoundEndedSchema = z.object({
  correctAnswerId: z.string(),
  playerResults: z.array(z.object({
    playerId: userIdSchema,
    answerId: z.string().nullable(),
    isCorrect: z.boolean(),
    pointsEarned: z.number().int(),
    totalScore: z.number().int(),
    answerTime: z.number().optional(), // ms from round start
  })),
})

export const triviaGameEndedSchema = z.object({
  finalScores: z.array(z.object({
    playerId: userIdSchema,
    playerName: playerNameSchema,
    score: z.number().int(),
    correctAnswers: z.number().int(),
    rank: z.number().int().min(1),
  })),
})

// =============================================================================
// WORDEL SCHEMAS
// =============================================================================
export const wordelLetterResultSchema = z.enum(['correct', 'present', 'absent'])

export const wordelGuessResultSchema = z.object({
  guess: z.string().length(5),
  results: z.array(wordelLetterResultSchema).length(5),
  isCorrect: z.boolean(),
  attemptsUsed: z.number().int().min(1).max(6),
})

export const wordelSubmitGuessPayloadSchema = z.object({
  roomCode: roomCodeSchema,
  guess: z.string().length(5).regex(/^[A-Za-z]+$/),
})

export const wordelRoundStartedSchema = z.object({
  roundNumber: z.number().int().min(1),
  totalRounds: z.number().int().min(1),
  wordLength: z.number().int().default(5),
  maxAttempts: z.number().int().default(6),
  roundEndsAt: z.string().datetime().optional(),
})

export const wordelRoundEndedSchema = z.object({
  correctWord: z.string(),
  playerResults: z.array(z.object({
    playerId: userIdSchema,
    solved: z.boolean(),
    attempts: z.number().int(),
    pointsEarned: z.number().int(),
  })),
})

// =============================================================================
// FLAGEL SCHEMAS
// =============================================================================
export const flagelSubmitGuessPayloadSchema = z.object({
  roomCode: roomCodeSchema,
  guess: z.string().min(1).max(100), // Country name
})

export const flagelSkipPayloadSchema = z.object({
  roomCode: roomCodeSchema,
})

export const flagelRoundStartedSchema = z.object({
  roundNumber: z.number().int().min(1),
  totalRounds: z.number().int().min(1),
  flagEmoji: z.string().optional(), // Unicode flag emoji
  flagImageUrl: z.string().url().optional(), // Alternative: image URL
  hintsAvailable: z.number().int().min(0),
  roundEndsAt: z.string().datetime().optional(),
})

export const flagelGuessResultSchema = z.object({
  isCorrect: z.boolean(),
  distance: z.number().optional(), // Geographic distance if wrong
  direction: z.string().optional(), // e.g., "North", "Southwest"
  attemptsUsed: z.number().int(),
  maxAttempts: z.number().int(),
})

export const flagelRoundEndedSchema = z.object({
  correctCountry: z.string(),
  countryCode: z.string(), // ISO code
  playerResults: z.array(z.object({
    playerId: userIdSchema,
    solved: z.boolean(),
    attempts: z.number().int(),
    pointsEarned: z.number().int(),
  })),
})

// =============================================================================
// CHAT SCHEMAS
// =============================================================================
export const chatMessagePayloadSchema = z.object({
  roomCode: roomCodeSchema,
  message: z.string().min(1).max(500).trim(),
})

export const chatMessageSchema = z.object({
  id: z.string(),
  playerId: userIdSchema,
  playerName: playerNameSchema,
  message: z.string(),
  timestamp: z.string().datetime(),
  type: z.enum(['user', 'system', 'guess']).default('user'),
})

// =============================================================================
// ADMIN SCHEMAS
// =============================================================================
export const adminStatsSchema = z.object({
  onlineUsers: z.number().int().min(0),
  activeRooms: z.number().int().min(0),
  gamesPlayed24h: z.number().int().min(0),
  totalUsers: z.number().int().min(0),
})

export const adminUserActivitySchema = z.object({
  userId: userIdSchema,
  action: z.enum(['login', 'logout', 'game_start', 'game_end', 'room_create', 'room_join']),
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
})

// =============================================================================
// API RESPONSE SCHEMAS
// =============================================================================
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }).optional(),
  })

export const createRoomResponseSchema = z.object({
  roomCode: roomCodeSchema,
  joinUrl: z.string().url(),
})

export const roomInfoResponseSchema = roomSchema
```

---

### Step 3: Generate TypeScript Types

#### 3.1 Update `shared/src/types.ts`
```typescript
import { z } from 'zod'
import {
  userSchema,
  playerSchema,
  roomSchema,
  roomJoinPayloadSchema,
  roomLeavePayloadSchema,
  roomStartGamePayloadSchema,
  roomKickPlayerPayloadSchema,
  roomPresenceSchema,
  roomErrorSchema,
  strokeSchema,
  strokeBatchPayloadSchema,
  clearCanvasPayloadSchema,
  guessPayloadSchema,
  requestSyncPayloadSchema,
  skribbleRoundStartedSchema,
  skribbleGuessResultSchema,
  triviaQuestionSchema,
  triviaSubmitAnswerPayloadSchema,
  triviaRoundStartedSchema,
  triviaRoundEndedSchema,
  triviaGameEndedSchema,
  wordelGuessResultSchema,
  wordelSubmitGuessPayloadSchema,
  wordelRoundStartedSchema,
  wordelRoundEndedSchema,
  flagelSubmitGuessPayloadSchema,
  flagelSkipPayloadSchema,
  flagelRoundStartedSchema,
  flagelGuessResultSchema,
  flagelRoundEndedSchema,
  chatMessagePayloadSchema,
  chatMessageSchema,
  adminStatsSchema,
  adminUserActivitySchema,
  gameIdSchema,
  roomStatusSchema,
} from './schemas'

// =============================================================================
// PRIMITIVE TYPES
// =============================================================================
export type UserId = string
export type RoomCode = string
export type GameId = z.infer<typeof gameIdSchema>
export type RoomStatus = z.infer<typeof roomStatusSchema>

// =============================================================================
// USER TYPES
// =============================================================================
export type User = z.infer<typeof userSchema>
export type Player = z.infer<typeof playerSchema>

// =============================================================================
// ROOM TYPES
// =============================================================================
export type Room = z.infer<typeof roomSchema>
export type RoomJoinPayload = z.infer<typeof roomJoinPayloadSchema>
export type RoomLeavePayload = z.infer<typeof roomLeavePayloadSchema>
export type RoomStartGamePayload = z.infer<typeof roomStartGamePayloadSchema>
export type RoomKickPlayerPayload = z.infer<typeof roomKickPlayerPayloadSchema>
export type RoomPresence = z.infer<typeof roomPresenceSchema>
export type RoomError = z.infer<typeof roomErrorSchema>

// =============================================================================
// SKRIBBLE TYPES
// =============================================================================
export type Stroke = z.infer<typeof strokeSchema>
export type StrokeBatchPayload = z.infer<typeof strokeBatchPayloadSchema>
export type ClearCanvasPayload = z.infer<typeof clearCanvasPayloadSchema>
export type GuessPayload = z.infer<typeof guessPayloadSchema>
export type RequestSyncPayload = z.infer<typeof requestSyncPayloadSchema>
export type SkribbleRoundStarted = z.infer<typeof skribbleRoundStartedSchema>
export type SkribbleGuessResult = z.infer<typeof skribbleGuessResultSchema>

// =============================================================================
// TRIVIA TYPES
// =============================================================================
export type TriviaQuestion = z.infer<typeof triviaQuestionSchema>
export type TriviaSubmitAnswerPayload = z.infer<typeof triviaSubmitAnswerPayloadSchema>
export type TriviaRoundStarted = z.infer<typeof triviaRoundStartedSchema>
export type TriviaRoundEnded = z.infer<typeof triviaRoundEndedSchema>
export type TriviaGameEnded = z.infer<typeof triviaGameEndedSchema>

// =============================================================================
// WORDEL TYPES
// =============================================================================
export type WordelGuessResult = z.infer<typeof wordelGuessResultSchema>
export type WordelSubmitGuessPayload = z.infer<typeof wordelSubmitGuessPayloadSchema>
export type WordelRoundStarted = z.infer<typeof wordelRoundStartedSchema>
export type WordelRoundEnded = z.infer<typeof wordelRoundEndedSchema>
export type WordelLetterResult = 'correct' | 'present' | 'absent'

// =============================================================================
// FLAGEL TYPES
// =============================================================================
export type FlagelSubmitGuessPayload = z.infer<typeof flagelSubmitGuessPayloadSchema>
export type FlagelSkipPayload = z.infer<typeof flagelSkipPayloadSchema>
export type FlagelRoundStarted = z.infer<typeof flagelRoundStartedSchema>
export type FlagelGuessResult = z.infer<typeof flagelGuessResultSchema>
export type FlagelRoundEnded = z.infer<typeof flagelRoundEndedSchema>

// =============================================================================
// CHAT TYPES
// =============================================================================
export type ChatMessagePayload = z.infer<typeof chatMessagePayloadSchema>
export type ChatMessage = z.infer<typeof chatMessageSchema>

// =============================================================================
// ADMIN TYPES
// =============================================================================
export type AdminStats = z.infer<typeof adminStatsSchema>
export type AdminUserActivity = z.infer<typeof adminUserActivitySchema>

// =============================================================================
// SOCKET EVENT MAPS (for type-safe socket handling)
// =============================================================================
export interface ClientToServerEvents {
  // Room
  'room:join': (payload: RoomJoinPayload) => void
  'room:leave': (payload: RoomLeavePayload) => void
  'room:startGame': (payload: RoomStartGamePayload) => void
  'room:kickPlayer': (payload: RoomKickPlayerPayload) => void
  
  // Skribble
  'draw:strokeBatch': (payload: StrokeBatchPayload) => void
  'draw:clearCanvas': (payload: ClearCanvasPayload) => void
  'draw:guess': (payload: GuessPayload) => void
  'draw:requestSync': (payload: RequestSyncPayload) => void
  
  // Trivia
  'trivia:submitAnswer': (payload: TriviaSubmitAnswerPayload) => void
  
  // Wordel
  'wordel:submitGuess': (payload: WordelSubmitGuessPayload) => void
  
  // Flagel
  'flagel:submitGuess': (payload: FlagelSubmitGuessPayload) => void
  'flagel:skip': (payload: FlagelSkipPayload) => void
  
  // Chat
  'chat:sendMessage': (payload: ChatMessagePayload) => void
}

export interface ServerToClientEvents {
  // Room
  'room:joined': (payload: { room: Room; playerId: UserId }) => void
  'room:left': (payload: { roomCode: RoomCode }) => void
  'room:presence': (payload: RoomPresence) => void
  'room:gameStarted': (payload: { gameId: GameId }) => void
  'room:playerKicked': (payload: { playerId: UserId }) => void
  'room:error': (payload: RoomError) => void
  'room:hostChanged': (payload: { newHostId: UserId }) => void
  
  // Skribble
  'draw:strokeBroadcast': (payload: { strokes: Stroke[]; playerId: UserId }) => void
  'draw:canvasCleared': (payload: { playerId: UserId }) => void
  'draw:guessResult': (payload: SkribbleGuessResult) => void
  'draw:correctGuess': (payload: { playerId: UserId; playerName: string }) => void
  'draw:sync': (payload: { strokes: Stroke[] }) => void
  'draw:roundStarted': (payload: SkribbleRoundStarted) => void
  'draw:roundEnded': (payload: { word: string; scores: Record<UserId, number> }) => void
  'draw:turnStarted': (payload: { drawerId: UserId; word?: string }) => void
  'draw:wordHint': (payload: { hint: string }) => void
  
  // Trivia
  'trivia:roundStarted': (payload: TriviaRoundStarted) => void
  'trivia:roundEnded': (payload: TriviaRoundEnded) => void
  'trivia:answerResult': (payload: { isCorrect: boolean; pointsEarned: number }) => void
  'trivia:playerAnswered': (payload: { playerId: UserId }) => void
  'trivia:gameEnded': (payload: TriviaGameEnded) => void
  'trivia:timerTick': (payload: { remainingSeconds: number }) => void
  
  // Wordel
  'wordel:roundStarted': (payload: WordelRoundStarted) => void
  'wordel:guessResult': (payload: WordelGuessResult) => void
  'wordel:roundEnded': (payload: WordelRoundEnded) => void
  'wordel:gameEnded': (payload: { finalScores: Array<{ playerId: UserId; score: number; rank: number }> }) => void
  'wordel:opponentProgress': (payload: { playerId: UserId; attemptCount: number; solved: boolean }) => void
  
  // Flagel
  'flagel:roundStarted': (payload: FlagelRoundStarted) => void
  'flagel:guessResult': (payload: FlagelGuessResult) => void
  'flagel:roundEnded': (payload: FlagelRoundEnded) => void
  'flagel:gameEnded': (payload: { finalScores: Array<{ playerId: UserId; score: number; rank: number }> }) => void
  'flagel:opponentProgress': (payload: { playerId: UserId; attemptCount: number }) => void
  
  // Chat
  'chat:message': (payload: ChatMessage) => void
  'chat:systemMessage': (payload: { message: string; type: 'info' | 'warning' | 'success' }) => void
  
  // Admin
  'admin:statsUpdate': (payload: AdminStats) => void
  'admin:userActivity': (payload: AdminUserActivity) => void
  'admin:roomUpdate': (payload: { action: 'created' | 'closed'; room: Room }) => void
  'admin:errorLog': (payload: { error: string; timestamp: string }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId: UserId
  userName: string
  isAdmin: boolean
}
```

---

### Step 4: Create Validation Helper

#### 4.1 Create `shared/src/validation.ts`
```typescript
import { z, ZodError, ZodSchema } from 'zod'
import * as schemas from './schemas'

/**
 * Result type for validation
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details: z.ZodIssue[] }

/**
 * Validate payload against schema
 */
export function validatePayload<T>(
  schema: ZodSchema<T>,
  payload: unknown
): ValidationResult<T> {
  try {
    const data = schema.parse(payload)
    return { success: true, data }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        details: error.errors,
      }
    }
    return {
      success: false,
      error: 'Unknown validation error',
      details: [],
    }
  }
}

/**
 * Event name to schema mapping
 */
export const eventSchemas: Record<string, ZodSchema> = {
  // Room events
  'room:join': schemas.roomJoinPayloadSchema,
  'room:leave': schemas.roomLeavePayloadSchema,
  'room:startGame': schemas.roomStartGamePayloadSchema,
  'room:kickPlayer': schemas.roomKickPlayerPayloadSchema,
  
  // Skribble events
  'draw:strokeBatch': schemas.strokeBatchPayloadSchema,
  'draw:clearCanvas': schemas.clearCanvasPayloadSchema,
  'draw:guess': schemas.guessPayloadSchema,
  'draw:requestSync': schemas.requestSyncPayloadSchema,
  
  // Trivia events
  'trivia:submitAnswer': schemas.triviaSubmitAnswerPayloadSchema,
  
  // Wordel events
  'wordel:submitGuess': schemas.wordelSubmitGuessPayloadSchema,
  
  // Flagel events
  'flagel:submitGuess': schemas.flagelSubmitGuessPayloadSchema,
  'flagel:skip': schemas.flagelSkipPayloadSchema,
  
  // Chat events
  'chat:sendMessage': schemas.chatMessagePayloadSchema,
}

/**
 * Validate socket event payload
 * Returns typed payload or throws error
 */
export function parseSocketPayload<T = unknown>(
  eventName: string,
  payload: unknown
): T {
  const schema = eventSchemas[eventName]
  
  if (!schema) {
    throw new Error(`No schema defined for event: ${eventName}`)
  }
  
  const result = validatePayload(schema, payload)
  
  if (!result.success) {
    throw new Error(`Validation failed for ${eventName}: ${result.error}`)
  }
  
  return result.data as T
}

/**
 * Safe validation that doesn't throw
 */
export function safeParseSocketPayload<T = unknown>(
  eventName: string,
  payload: unknown
): ValidationResult<T> {
  const schema = eventSchemas[eventName]
  
  if (!schema) {
    return {
      success: false,
      error: `No schema defined for event: ${eventName}`,
      details: [],
    }
  }
  
  return validatePayload(schema, payload) as ValidationResult<T>
}
```

#### 4.2 Update `shared/src/index.ts`
```typescript
// Types
export * from './types'

// Schemas
export * from './schemas'

// Socket Events
export * from './socketEvents'

// Constants
export * from './constants'

// Validation
export * from './validation'
```

---

### Step 5: Create Server Socket Handler with Validation

#### 5.1 Create `server/src/socket/socketHandler.ts`
```typescript
import { Server, Socket } from 'socket.io'
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  safeParseSocketPayload,
  ROOM_EVENTS,
  SKRIBBLE_EVENTS,
  TRIVIA_EVENTS,
  WORDEL_EVENTS,
  FLAGEL_EVENTS,
  CHAT_EVENTS,
} from '@mini-arcade/shared'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

/**
 * Wrapper to validate event payloads before processing
 */
function withValidation<T>(
  socket: TypedSocket,
  eventName: string,
  handler: (payload: T) => void | Promise<void>
) {
  return async (payload: unknown) => {
    const result = safeParseSocketPayload<T>(eventName, payload)
    
    if (!result.success) {
      console.error(`Validation failed for ${eventName}:`, result.error)
      socket.emit('room:error', {
        code: 'VALIDATION_ERROR',
        message: result.error,
      })
      return
    }
    
    try {
      await handler(result.data)
    } catch (error) {
      console.error(`Handler error for ${eventName}:`, error)
      socket.emit('room:error', {
        code: 'HANDLER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

export function setupSocketHandlers(io: TypedServer) {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`Client connected: ${socket.id}`)
    
    // ==========================================================================
    // ROOM EVENTS
    // ==========================================================================
    socket.on(
      ROOM_EVENTS.JOIN,
      withValidation(socket, ROOM_EVENTS.JOIN, async (payload) => {
        // TODO: Implement in Phase 3
        console.log('Room join:', payload)
      })
    )
    
    socket.on(
      ROOM_EVENTS.LEAVE,
      withValidation(socket, ROOM_EVENTS.LEAVE, async (payload) => {
        // TODO: Implement in Phase 3
        console.log('Room leave:', payload)
      })
    )
    
    socket.on(
      ROOM_EVENTS.START_GAME,
      withValidation(socket, ROOM_EVENTS.START_GAME, async (payload) => {
        // TODO: Implement in Phase 4
        console.log('Start game:', payload)
      })
    )
    
    socket.on(
      ROOM_EVENTS.KICK_PLAYER,
      withValidation(socket, ROOM_EVENTS.KICK_PLAYER, async (payload) => {
        // TODO: Implement in Phase 3
        console.log('Kick player:', payload)
      })
    )
    
    // ==========================================================================
    // SKRIBBLE EVENTS
    // ==========================================================================
    socket.on(
      SKRIBBLE_EVENTS.STROKE_BATCH,
      withValidation(socket, SKRIBBLE_EVENTS.STROKE_BATCH, async (payload) => {
        // TODO: Implement in Skribble game
        console.log('Stroke batch:', payload.strokes.length, 'strokes')
      })
    )
    
    socket.on(
      SKRIBBLE_EVENTS.CLEAR_CANVAS,
      withValidation(socket, SKRIBBLE_EVENTS.CLEAR_CANVAS, async (payload) => {
        // TODO: Implement in Skribble game
        console.log('Clear canvas:', payload)
      })
    )
    
    socket.on(
      SKRIBBLE_EVENTS.GUESS,
      withValidation(socket, SKRIBBLE_EVENTS.GUESS, async (payload) => {
        // TODO: Implement in Skribble game
        console.log('Guess:', payload)
      })
    )
    
    // ==========================================================================
    // TRIVIA EVENTS
    // ==========================================================================
    socket.on(
      TRIVIA_EVENTS.SUBMIT_ANSWER,
      withValidation(socket, TRIVIA_EVENTS.SUBMIT_ANSWER, async (payload) => {
        // TODO: Implement in Trivia game
        console.log('Trivia answer:', payload)
      })
    )
    
    // ==========================================================================
    // WORDEL EVENTS
    // ==========================================================================
    socket.on(
      WORDEL_EVENTS.SUBMIT_GUESS,
      withValidation(socket, WORDEL_EVENTS.SUBMIT_GUESS, async (payload) => {
        // TODO: Implement in Wordel game
        console.log('Wordel guess:', payload)
      })
    )
    
    // ==========================================================================
    // FLAGEL EVENTS
    // ==========================================================================
    socket.on(
      FLAGEL_EVENTS.SUBMIT_GUESS,
      withValidation(socket, FLAGEL_EVENTS.SUBMIT_GUESS, async (payload) => {
        // TODO: Implement in Flagel game
        console.log('Flagel guess:', payload)
      })
    )
    
    // ==========================================================================
    // CHAT EVENTS
    // ==========================================================================
    socket.on(
      CHAT_EVENTS.SEND_MESSAGE,
      withValidation(socket, CHAT_EVENTS.SEND_MESSAGE, async (payload) => {
        // TODO: Implement chat
        console.log('Chat message:', payload)
      })
    )
    
    // ==========================================================================
    // DISCONNECT
    // ==========================================================================
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
      // TODO: Handle disconnect in Phase 3
    })
  })
}
```

---

### Step 6: Create Client Socket Hook

#### 6.1 Create `client/src/hooks/useSocket.ts`
```typescript
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@mini-arcade/shared'

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

interface UseSocketOptions {
  autoConnect?: boolean
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true } = options
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<TypedSocket | null>(null)
  
  useEffect(() => {
    if (!autoConnect) return
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'
    
    const socket: TypedSocket = io(wsUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    
    socketRef.current = socket
    
    socket.on('connect', () => {
      setIsConnected(true)
      setError(null)
      console.log('Socket connected:', socket.id)
    })
    
    socket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Socket disconnected')
    })
    
    socket.on('connect_error', (err) => {
      setError(err.message)
      console.error('Socket connection error:', err)
    })
    
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [autoConnect])
  
  const emit = useCallback(<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) => {
    if (socketRef.current) {
      socketRef.current.emit(event, ...args)
    } else {
      console.warn('Socket not connected, cannot emit:', event)
    }
  }, [])
  
  const on = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler as any)
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler as any)
      }
    }
  }, [])
  
  const off = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler as any)
    }
  }, [])
  
  return {
    socket: socketRef.current,
    isConnected,
    error,
    emit,
    on,
    off,
  }
}
```

---

## Testing

### Manual Testing Steps
1. Start server: `pnpm --filter server dev`
2. Start client: `pnpm --filter client dev`
3. Open browser console
4. Verify socket connects
5. Send test events and verify validation works

### Test Invalid Payload
```javascript
// In browser console
socket.emit('room:join', { roomCode: 'invalid' }) // Should fail - too short
socket.emit('room:join', { roomCode: 'ABCDEF' }) // Should succeed
```

---

## Files Created/Modified

```
shared/src/
├── index.ts (updated)
├── socketEvents.ts (updated)
├── schemas.ts (updated)
├── types.ts (updated)
└── validation.ts (new)

server/src/
└── socket/
    └── socketHandler.ts (new)

client/src/
└── hooks/
    └── useSocket.ts (new)
```

---

## Next Phase
Once all acceptance criteria are met, proceed to **Phase 2: Authentication + Admin Dashboard**.
