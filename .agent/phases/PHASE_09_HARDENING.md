# Phase 9: Hardening + Deployment

## Overview
Add production hardening measures including comprehensive validation, rate limiting, reconnection handling, error boundaries, and deployment configuration for the client and server.

**Status:** To Implement  
**Priority:** High  
**Estimated Time:** 4-6 hours  
**Dependencies:** All previous phases completed

---

## Goals
- Validate all Socket.IO payloads with Zod
- Implement rate limiting for events and API routes
- Handle reconnection gracefully with state sync
- Add error boundaries and fallback UI
- Configure deployment for client (Vercel) and server (Railway/Fly/Render)
- Set up monitoring and logging
- Implement security best practices

---

## Acceptance Criteria
- [ ] All socket events validate payloads before processing
- [ ] Rate limits prevent abuse (stroke batching, answer spam, etc.)
- [ ] Players can reconnect and resume their game state
- [ ] Errors are handled gracefully with user-friendly messages
- [ ] Client deploys to Vercel successfully
- [ ] Server deploys to Railway/Fly/Render successfully
- [ ] WebSocket connections work in production
- [ ] Environment variables are properly configured

---

## Implementation Steps

### Step 1: Socket Payload Validation

#### 1.1 Create `server/src/lib/validation.ts`
```typescript
import { z, ZodSchema } from 'zod'
import { Socket } from 'socket.io'
import {
  ROOM_EVENTS,
  SKRIBBLE_EVENTS,
  TRIVIA_EVENTS,
  WORDEL_EVENTS,
  FLAGEL_EVENTS,
  RoomJoinSchema,
  RoomLeaveSchema,
  StrokeBatchSchema,
  ClearCanvasSchema,
  GuessSchema,
  TriviaAnswerSchema,
  WordelGuessSchema,
  FlagelGuessSchema,
} from '@mini-arcade/shared'

// Map events to their validation schemas
const EVENT_SCHEMAS: Record<string, ZodSchema> = {
  // Room events
  [ROOM_EVENTS.JOIN]: RoomJoinSchema,
  [ROOM_EVENTS.LEAVE]: RoomLeaveSchema,
  [ROOM_EVENTS.KICK_PLAYER]: z.object({
    roomCode: z.string().length(6),
    playerId: z.string().uuid(),
  }),
  [ROOM_EVENTS.START_GAME]: z.object({
    roomCode: z.string().length(6),
  }),
  
  // Skribble events
  [SKRIBBLE_EVENTS.STROKE_BATCH]: StrokeBatchSchema,
  [SKRIBBLE_EVENTS.CLEAR_CANVAS]: ClearCanvasSchema,
  [SKRIBBLE_EVENTS.GUESS]: GuessSchema,
  [SKRIBBLE_EVENTS.REQUEST_SYNC]: z.object({}),
  
  // Trivia events
  [TRIVIA_EVENTS.SUBMIT_ANSWER]: TriviaAnswerSchema,
  
  // Wordel events
  [WORDEL_EVENTS.SUBMIT_GUESS]: WordelGuessSchema,
  
  // Flagel events
  [FLAGEL_EVENTS.SUBMIT_GUESS]: FlagelGuessSchema,
  [FLAGEL_EVENTS.SKIP]: z.object({}),
}

/**
 * Validate socket event payload
 * Returns parsed data or null if invalid
 */
export function validatePayload<T>(
  eventName: string,
  payload: unknown
): { success: true; data: T } | { success: false; error: string } {
  const schema = EVENT_SCHEMAS[eventName]
  
  if (!schema) {
    // Unknown event - reject
    return { success: false, error: `Unknown event: ${eventName}` }
  }
  
  const result = schema.safeParse(payload)
  
  if (!result.success) {
    const errorMessage = result.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join(', ')
    return { success: false, error: errorMessage }
  }
  
  return { success: true, data: result.data as T }
}

/**
 * Socket middleware that wraps handlers with validation
 */
export function withValidation<T>(
  eventName: string,
  handler: (socket: Socket, data: T) => void | Promise<void>
): (socket: Socket, payload: unknown) => void {
  return async (socket: Socket, payload: unknown) => {
    const result = validatePayload<T>(eventName, payload)
    
    if (!result.success) {
      console.warn(`Validation failed for ${eventName}:`, result.error)
      socket.emit('error', {
        code: 'VALIDATION_ERROR',
        message: result.error,
        event: eventName,
      })
      return
    }
    
    try {
      await handler(socket, result.data)
    } catch (error) {
      console.error(`Handler error for ${eventName}:`, error)
      socket.emit('error', {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        event: eventName,
      })
    }
  }
}
```

#### 1.2 Update Socket Handlers with Validation
```typescript
// server/src/socket/roomHandlers.ts
import { withValidation } from '../lib/validation'
import { ROOM_EVENTS, RoomJoinPayload, RoomLeavePayload } from '@mini-arcade/shared'

export function setupRoomHandlers(socket: Socket, roomService: RoomService, gameManager: GameManager) {
  socket.on(
    ROOM_EVENTS.JOIN,
    withValidation<RoomJoinPayload>(ROOM_EVENTS.JOIN, async (socket, data) => {
      await roomService.joinRoom(socket, data.roomCode)
    })
  )
  
  socket.on(
    ROOM_EVENTS.LEAVE,
    withValidation<RoomLeavePayload>(ROOM_EVENTS.LEAVE, async (socket, data) => {
      await roomService.leaveRoom(socket, data.roomCode)
    })
  )
  
  // ... other handlers
}
```

---

### Step 2: Rate Limiting

#### 2.1 Create `server/src/lib/rateLimiter.ts`
```typescript
interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Check if request should be allowed
   * @returns true if allowed, false if rate limited
   */
  check(key: string): boolean {
    const now = Date.now()
    const entry = this.limits.get(key)

    if (!entry || now >= entry.resetAt) {
      // New window
      this.limits.set(key, {
        count: 1,
        resetAt: now + this.config.windowMs,
      })
      return true
    }

    if (entry.count >= this.config.maxRequests) {
      // Rate limited
      return false
    }

    // Increment count
    entry.count++
    return true
  }

  /**
   * Get remaining requests in current window
   */
  remaining(key: string): number {
    const entry = this.limits.get(key)
    if (!entry || Date.now() >= entry.resetAt) {
      return this.config.maxRequests
    }
    return Math.max(0, this.config.maxRequests - entry.count)
  }

  /**
   * Get time until rate limit resets (ms)
   */
  resetIn(key: string): number {
    const entry = this.limits.get(key)
    if (!entry) return 0
    return Math.max(0, entry.resetAt - Date.now())
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetAt) {
        this.limits.delete(key)
      }
    }
  }
}

// Pre-configured limiters for different use cases
export const rateLimiters = {
  // Stroke batching: 30 batches per second (generous for drawing)
  strokeBatch: new RateLimiter({ maxRequests: 30, windowMs: 1000 }),
  
  // Guesses: 10 per 5 seconds (prevent spam)
  guess: new RateLimiter({ maxRequests: 10, windowMs: 5000 }),
  
  // Answer submissions: 5 per 10 seconds
  answer: new RateLimiter({ maxRequests: 5, windowMs: 10000 }),
  
  // Room creation: 5 per minute
  roomCreate: new RateLimiter({ maxRequests: 5, windowMs: 60000 }),
  
  // Room join: 10 per minute
  roomJoin: new RateLimiter({ maxRequests: 10, windowMs: 60000 }),
  
  // Generic API: 100 per minute
  api: new RateLimiter({ maxRequests: 100, windowMs: 60000 }),
}

/**
 * Create rate limit key from socket/user
 */
export function createRateLimitKey(socket: Socket, action: string): string {
  const userId = socket.data.userId || socket.id
  return `${action}:${userId}`
}
```

#### 2.2 Create Rate Limit Middleware for Sockets
```typescript
// server/src/middleware/rateLimit.ts
import { Socket } from 'socket.io'
import { RateLimiter, createRateLimitKey } from '../lib/rateLimiter'

export function withRateLimit(
  limiter: RateLimiter,
  action: string,
  handler: (socket: Socket, data: unknown) => void | Promise<void>
): (socket: Socket, data: unknown) => void {
  return async (socket: Socket, data: unknown) => {
    const key = createRateLimitKey(socket, action)
    
    if (!limiter.check(key)) {
      const resetIn = Math.ceil(limiter.resetIn(key) / 1000)
      socket.emit('error', {
        code: 'RATE_LIMITED',
        message: `Too many requests. Try again in ${resetIn} seconds.`,
        retryAfter: resetIn,
      })
      return
    }
    
    await handler(socket, data)
  }
}
```

#### 2.3 Apply Rate Limiting to Handlers
```typescript
// server/src/socket/gameHandlers.ts
import { withRateLimit } from '../middleware/rateLimit'
import { withValidation } from '../lib/validation'
import { rateLimiters } from '../lib/rateLimiter'

export function setupGameHandlers(socket: Socket, gameManager: GameManager) {
  // Skribble stroke batching with rate limit
  socket.on(
    SKRIBBLE_EVENTS.STROKE_BATCH,
    withRateLimit(
      rateLimiters.strokeBatch,
      'strokeBatch',
      withValidation(SKRIBBLE_EVENTS.STROKE_BATCH, async (socket, data) => {
        const roomCode = getRoomCode(socket)
        if (roomCode) {
          await gameManager.handleGameEvent(socket, roomCode, 'strokeBatch', data)
        }
      })
    )
  )
  
  // Guessing with rate limit
  socket.on(
    SKRIBBLE_EVENTS.GUESS,
    withRateLimit(
      rateLimiters.guess,
      'guess',
      withValidation(SKRIBBLE_EVENTS.GUESS, async (socket, data) => {
        const roomCode = getRoomCode(socket)
        if (roomCode) {
          await gameManager.handleGameEvent(socket, roomCode, 'guess', data)
        }
      })
    )
  )
}
```

#### 2.4 API Rate Limiting
```typescript
// server/src/middleware/apiRateLimit.ts
import { Request, Response, NextFunction } from 'express'
import { rateLimiters, RateLimiter } from '../lib/rateLimiter'

export function apiRateLimit(limiter: RateLimiter = rateLimiters.api) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Use IP or user ID as key
    const key = req.ip || req.headers['x-forwarded-for']?.toString() || 'anonymous'
    
    if (!limiter.check(key)) {
      const retryAfter = Math.ceil(limiter.resetIn(key) / 1000)
      res.status(429).json({
        error: 'Too many requests',
        retryAfter,
      })
      return
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Remaining', limiter.remaining(key))
    res.setHeader('X-RateLimit-Reset', Math.ceil(limiter.resetIn(key) / 1000))
    
    next()
  }
}
```

---

### Step 3: Reconnection Handling

#### 3.1 Update `server/src/services/RoomService.ts`
```typescript
interface DisconnectedPlayer {
  playerId: string
  roomCode: string
  disconnectedAt: number
  socketId: string
}

export class RoomService {
  private disconnectedPlayers: Map<string, DisconnectedPlayer> = new Map()
  private readonly GRACE_PERIOD = 30000 // 30 seconds

  constructor(private io: Server) {
    // Cleanup expired disconnected players
    setInterval(() => this.cleanupDisconnected(), 10000)
  }

  /**
   * Handle player disconnect
   */
  async handleDisconnect(socket: Socket): Promise<void> {
    const userId = socket.data.userId
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id)
    
    for (const roomCode of rooms) {
      // Mark player as disconnected but don't remove yet
      this.disconnectedPlayers.set(userId, {
        playerId: userId,
        roomCode,
        disconnectedAt: Date.now(),
        socketId: socket.id,
      })

      // Notify others
      this.io.to(roomCode).emit(ROOM_EVENTS.PLAYER_DISCONNECTED, {
        playerId: userId,
        gracePeriodEnds: Date.now() + this.GRACE_PERIOD,
      })

      // Schedule removal after grace period
      setTimeout(() => {
        this.finalizeDisconnect(userId, roomCode)
      }, this.GRACE_PERIOD)
    }
  }

  /**
   * Handle player reconnect
   */
  async handleReconnect(socket: Socket): Promise<boolean> {
    const userId = socket.data.userId
    const disconnected = this.disconnectedPlayers.get(userId)

    if (!disconnected) {
      return false // No pending reconnection
    }

    const { roomCode } = disconnected

    // Check if room still exists
    const room = await this.getRoom(roomCode)
    if (!room) {
      this.disconnectedPlayers.delete(userId)
      return false
    }

    // Rejoin room
    socket.join(roomCode)
    socket.data.roomCode = roomCode
    this.disconnectedPlayers.delete(userId)

    // Notify others
    this.io.to(roomCode).emit(ROOM_EVENTS.PLAYER_RECONNECTED, {
      playerId: userId,
    })

    // Send current state to reconnected player
    const state = await this.getRoomState(roomCode)
    socket.emit(ROOM_EVENTS.STATE, state)

    // If game is in progress, sync game state
    const gameManager = this.getGameManager()
    if (gameManager && room.status === 'PLAYING') {
      const game = gameManager.getGame(roomCode)
      if (game) {
        const snapshot = game.getSnapshot()
        socket.emit('sync', snapshot)
      }
    }

    return true
  }

  /**
   * Finalize disconnect after grace period
   */
  private async finalizeDisconnect(playerId: string, roomCode: string): Promise<void> {
    const disconnected = this.disconnectedPlayers.get(playerId)
    
    // Player already reconnected
    if (!disconnected || disconnected.roomCode !== roomCode) {
      return
    }

    this.disconnectedPlayers.delete(playerId)

    // Actually remove from room
    await this.removePlayerFromRoom(playerId, roomCode)

    // Notify others
    this.io.to(roomCode).emit(ROOM_EVENTS.PLAYER_LEFT, {
      playerId,
      reason: 'disconnected',
    })

    // Check if host left
    const room = await this.getRoom(roomCode)
    if (room && room.hostId === playerId) {
      await this.assignNewHost(roomCode)
    }
  }

  private cleanupDisconnected(): void {
    const now = Date.now()
    for (const [playerId, data] of this.disconnectedPlayers.entries()) {
      if (now - data.disconnectedAt > this.GRACE_PERIOD * 2) {
        this.disconnectedPlayers.delete(playerId)
      }
    }
  }
}
```

#### 3.2 Client-side Reconnection Hook
```typescript
// client/src/hooks/useReconnection.ts
'use client'

import { useEffect, useState } from 'react'
import { useSocket } from './useSocket'
import { ROOM_EVENTS } from '@mini-arcade/shared'

interface ReconnectionState {
  isReconnecting: boolean
  reconnectAttempt: number
  maxAttempts: number
}

export function useReconnection(roomCode: string) {
  const socket = useSocket()
  const [state, setState] = useState<ReconnectionState>({
    isReconnecting: false,
    reconnectAttempt: 0,
    maxAttempts: 5,
  })

  useEffect(() => {
    if (!socket) return

    const handleDisconnect = () => {
      setState(prev => ({ ...prev, isReconnecting: true, reconnectAttempt: 1 }))
    }

    const handleReconnect = () => {
      setState(prev => ({ ...prev, isReconnecting: false, reconnectAttempt: 0 }))
      
      // Rejoin room after reconnection
      socket.emit(ROOM_EVENTS.REJOIN, { roomCode })
    }

    const handleReconnectAttempt = (attempt: number) => {
      setState(prev => ({ ...prev, reconnectAttempt: attempt }))
    }

    const handleReconnectFailed = () => {
      setState(prev => ({ ...prev, isReconnecting: false }))
      // Could redirect to lobby or show error
    }

    socket.on('disconnect', handleDisconnect)
    socket.io.on('reconnect', handleReconnect)
    socket.io.on('reconnect_attempt', handleReconnectAttempt)
    socket.io.on('reconnect_failed', handleReconnectFailed)

    return () => {
      socket.off('disconnect', handleDisconnect)
      socket.io.off('reconnect', handleReconnect)
      socket.io.off('reconnect_attempt', handleReconnectAttempt)
      socket.io.off('reconnect_failed', handleReconnectFailed)
    }
  }, [socket, roomCode])

  return state
}
```

#### 3.3 Reconnection UI Component
```tsx
// client/src/components/game/ReconnectionOverlay.tsx
interface ReconnectionOverlayProps {
  isReconnecting: boolean
  attempt: number
  maxAttempts: number
}

export function ReconnectionOverlay({
  isReconnecting,
  attempt,
  maxAttempts,
}: ReconnectionOverlayProps) {
  if (!isReconnecting) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Reconnecting...</h2>
        <p className="text-white/60 mb-4">
          Attempt {attempt} of {maxAttempts}
        </p>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-purple-500 h-2 rounded-full transition-all"
            style={{ width: `${(attempt / maxAttempts) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
```

---

### Step 4: Error Boundaries

#### 4.1 Create `client/src/components/ErrorBoundary.tsx`
```tsx
'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Send to error tracking service
    // e.g., Sentry.captureException(error)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-white/60 mb-6">
              An unexpected error occurred. Please try again or return to the home page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mb-6 p-4 bg-red-500/10 rounded-lg text-left text-sm text-red-400 overflow-auto">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              <a
                href="/"
                className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Home
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

#### 4.2 Create Global Error Handler
```tsx
// client/src/app/error.tsx
'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
    // Send to error tracking service
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-white/60 mb-6">
          We encountered an error while loading this page.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Home
          </a>
        </div>
      </div>
    </div>
  )
}
```

#### 4.3 Create Not Found Page
```tsx
// client/src/app/not-found.tsx
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl mb-4">🎮</div>
        <h1 className="text-4xl font-bold text-white mb-2">404</h1>
        <h2 className="text-xl text-white/80 mb-4">Page Not Found</h2>
        <p className="text-white/60 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go Home
          </a>
          <a
            href="/lobby"
            className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            Find a Game
          </a>
        </div>
      </div>
    </div>
  )
}
```

---

### Step 5: Security Hardening

#### 5.1 Create `server/src/middleware/security.ts`
```typescript
import helmet from 'helmet'
import cors from 'cors'
import { Express } from 'express'

export function setupSecurity(app: Express) {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'wss:', 'ws:', process.env.CLIENT_URL],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Needed for Next.js
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false, // May need to disable for some features
  }))

  // CORS configuration
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    maxAge: 86400, // 24 hours
  }))

  // Disable X-Powered-By
  app.disable('x-powered-by')
}
```

#### 5.2 Create Socket Authentication Middleware
```typescript
// server/src/middleware/auth.ts
import { Socket } from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

interface TokenPayload {
  sub: string
  email: string
  iat: number
  exp: number
}

export async function authenticateSocket(
  socket: Socket,
  next: (err?: ExtendedError) => void
) {
  try {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error('Authentication required'))
    }

    // Verify JWT
    const payload = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET!
    ) as TokenPayload

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    })

    if (!user) {
      return next(new Error('User not found'))
    }

    // Check if user is banned
    if (user.role === 'BANNED') {
      return next(new Error('Account is banned'))
    }

    // Attach user to socket
    socket.data.userId = user.id
    socket.data.userName = user.name
    socket.data.userRole = user.role

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Token expired'))
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Invalid token'))
    }
    return next(new Error('Authentication failed'))
  }
}
```

#### 5.3 Input Sanitization
```typescript
// server/src/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML allowed
    ALLOWED_ATTR: [],
  }).trim()
}

/**
 * Sanitize guess/chat input
 */
export function sanitizeGuess(guess: string): string {
  return sanitizeString(guess)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Only alphanumeric and spaces
    .slice(0, 100) // Max length
}

/**
 * Sanitize room code
 */
export function sanitizeRoomCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
}
```

---

### Step 6: Logging & Monitoring

#### 6.1 Create `server/src/lib/logger.ts`
```typescript
import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
  base: {
    service: 'mini-arcade-server',
    version: process.env.npm_package_version,
  },
})

// Child loggers for different modules
export const roomLogger = logger.child({ module: 'room' })
export const gameLogger = logger.child({ module: 'game' })
export const authLogger = logger.child({ module: 'auth' })
export const socketLogger = logger.child({ module: 'socket' })
```

#### 6.2 Health Check Endpoint
```typescript
// server/src/routes/health.ts
import { Router } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

router.get('/health', async (req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: false,
      memory: false,
    },
  }

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.checks.database = true
  } catch {
    checks.status = 'degraded'
  }

  // Memory check (warn if >80% heap used)
  const memUsage = process.memoryUsage()
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
  checks.checks.memory = heapUsedPercent < 80

  if (!checks.checks.memory) {
    checks.status = 'degraded'
  }

  const statusCode = checks.status === 'ok' ? 200 : 503
  res.status(statusCode).json(checks)
})

router.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' })
})

router.get('/health/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.status(200).json({ status: 'ready' })
  } catch {
    res.status(503).json({ status: 'not ready' })
  }
})

export const healthRoutes = router
```

---

### Step 7: Deployment Configuration

#### 7.1 Client Deployment (Vercel)

**`client/vercel.json`**
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SOCKET_URL": "@socket_url"
  }
}
```

**`client/next.config.js`**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
```

#### 7.2 Server Deployment (Railway)

**`server/Dockerfile`**
```dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY . .
RUN pnpm --filter @mini-arcade/shared build
RUN pnpm --filter @mini-arcade/server build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeuser

COPY --from=builder --chown=nodeuser:nodejs /app/shared/dist ./shared/dist
COPY --from=builder --chown=nodeuser:nodejs /app/server/dist ./server/dist
COPY --from=builder --chown=nodeuser:nodejs /app/server/package.json ./server/
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodejs /app/server/node_modules ./server/node_modules

USER nodeuser
EXPOSE 3001
ENV PORT=3001

CMD ["node", "server/dist/index.js"]
```

**`server/railway.toml`**
```toml
[build]
builder = "dockerfile"
dockerfilePath = "./Dockerfile"

[deploy]
healthcheckPath = "/health/live"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

#### 7.3 Environment Variables

**Client (`.env.local` / Vercel)**
```env
# Auth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key-here

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret

# Database
DATABASE_URL=postgresql://user:password@host:5432/db

# Socket server
NEXT_PUBLIC_SOCKET_URL=https://your-server.railway.app
```

**Server (`.env` / Railway)**
```env
# Server
NODE_ENV=production
PORT=3001

# Client URL (for CORS)
CLIENT_URL=https://your-app.vercel.app

# Database
DATABASE_URL=postgresql://user:password@host:5432/db

# Auth
NEXTAUTH_SECRET=your-secret-key-here

# Optional: Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx
```

#### 7.4 Database Migration Script

**`scripts/deploy-db.sh`**
```bash
#!/bin/bash
set -e

echo "Running database migrations..."
pnpm --filter @mini-arcade/server prisma migrate deploy

echo "Generating Prisma client..."
pnpm --filter @mini-arcade/server prisma generate

echo "Database deployment complete!"
```

---

### Step 8: Pre-deployment Checklist

#### 8.1 Create `DEPLOY_CHECKLIST.md`
```markdown
# Deployment Checklist

## Before First Deploy

- [ ] Set up PostgreSQL database (Railway, Supabase, or Neon)
- [ ] Configure OAuth providers (Google, GitHub)
- [ ] Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Run database migrations: `pnpm db:migrate`
- [ ] Test OAuth flows locally

## Environment Variables

### Vercel (Client)
- [ ] NEXTAUTH_URL
- [ ] NEXTAUTH_SECRET
- [ ] GOOGLE_CLIENT_ID
- [ ] GOOGLE_CLIENT_SECRET
- [ ] GITHUB_ID
- [ ] GITHUB_SECRET
- [ ] DATABASE_URL
- [ ] NEXT_PUBLIC_SOCKET_URL

### Railway (Server)
- [ ] NODE_ENV=production
- [ ] PORT=3001
- [ ] CLIENT_URL
- [ ] DATABASE_URL
- [ ] NEXTAUTH_SECRET

## Vercel Deploy

1. Connect GitHub repository
2. Set root directory: `client`
3. Configure environment variables
4. Deploy

## Railway Deploy

1. Create new project from GitHub
2. Set root directory: `server`
3. Add PostgreSQL service (or link external)
4. Configure environment variables
5. Deploy

## Post-Deploy

- [ ] Test WebSocket connection
- [ ] Test OAuth login flow
- [ ] Test room creation/joining
- [ ] Test each game type
- [ ] Test reconnection
- [ ] Monitor logs for errors
- [ ] Set up uptime monitoring
```

---

## Files Created/Modified

```
server/src/
├── lib/
│   ├── validation.ts
│   ├── rateLimiter.ts
│   ├── sanitize.ts
│   └── logger.ts
├── middleware/
│   ├── auth.ts
│   ├── security.ts
│   ├── rateLimit.ts
│   └── apiRateLimit.ts
├── routes/
│   └── health.ts
├── Dockerfile
└── railway.toml

client/src/
├── app/
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── ErrorBoundary.tsx
│   └── game/
│       └── ReconnectionOverlay.tsx
├── hooks/
│   └── useReconnection.ts
├── vercel.json
└── next.config.js

scripts/
└── deploy-db.sh

DEPLOY_CHECKLIST.md
```

---

## Security Summary

| Layer | Protection |
|-------|------------|
| Input | Zod validation, sanitization, length limits |
| Rate Limiting | Per-user, per-action limits |
| Authentication | JWT verification, role checking |
| Headers | Helmet (CSP, HSTS, etc.) |
| CORS | Whitelist origin |
| Secrets | Environment variables, no hardcoding |
| Errors | Sanitized messages, no stack traces in prod |

---

## Monitoring Recommendations

1. **Error Tracking**: Sentry for both client and server
2. **Uptime**: UptimeRobot or Better Uptime
3. **Logs**: Railway's built-in logs or Papertrail
4. **Analytics**: Vercel Analytics (client)
5. **Database**: Connection pool monitoring

---

## Next Steps After Deployment

1. Set up custom domain with SSL
2. Configure CDN for static assets
3. Add Sentry for error tracking
4. Set up uptime monitoring
5. Configure backup strategy for database
6. Load test WebSocket connections
7. Create admin user and seed initial data
