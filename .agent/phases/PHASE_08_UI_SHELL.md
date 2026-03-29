# Phase 8: UI Arcade Shell + Room UX

## Overview
Build the complete user interface for the arcade platform including landing page, lobby system, room management, and game screens with a polished, cohesive design.

**Status:** To Implement  
**Priority:** High  
**Estimated Time:** 6-8 hours  
**Dependencies:** Phase 0, Phase 1, Phase 2, Phase 3, Phase 4 completed

---

## Goals
- Create arcade landing page with game cards
- Build lobby UI for creating/joining rooms
- Implement room waiting screen with player list
- Create game-specific screens for each game
- Add navigation and layout components
- Implement responsive design for mobile/tablet/desktop
- Show user stats and recent games

---

## Acceptance Criteria
- [ ] Landing page shows all games with visual cards
- [ ] User can create a room and get a shareable code
- [ ] User can join a room by entering code
- [ ] Room waiting screen shows players and start button (host only)
- [ ] Each game has its dedicated game screen
- [ ] Navigation works correctly between all routes
- [ ] UI is responsive and works on mobile
- [ ] Loading and error states are handled gracefully

---

## Implementation Steps

### Step 1: Layout Components

#### 1.1 Create `client/src/components/layout/AppLayout.tsx`
```tsx
'use client'

import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from './Header'
import { Footer } from './Footer'

interface AppLayoutProps {
  children: ReactNode
  showFooter?: boolean
}

export function AppLayout({ children, showFooter = true }: AppLayoutProps) {
  const { data: session, status } = useSession()

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header user={session?.user} status={status} />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  )
}
```

#### 1.2 Create `client/src/components/layout/Header.tsx`
```tsx
'use client'

import Link from 'next/link'
import { signIn, signOut } from 'next-auth/react'
import { User } from 'next-auth'
import { Gamepad2, LogIn, LogOut, User as UserIcon, LayoutDashboard } from 'lucide-react'

interface HeaderProps {
  user?: User | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
}

export function Header({ user, status }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors">
            <Gamepad2 className="w-8 h-8" />
            <span className="text-xl font-bold">Mini Arcade</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">
              Games
            </Link>
            <Link href="/lobby" className="text-white/80 hover:text-white transition-colors">
              Lobby
            </Link>
            {user && (
              <Link href="/stats" className="text-white/80 hover:text-white transition-colors">
                My Stats
              </Link>
            )}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm text-white/80 hidden sm:block">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
```

#### 1.3 Create `client/src/components/layout/Footer.tsx`
```tsx
export function Footer() {
  return (
    <footer className="border-t border-white/10 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <p>&copy; {new Date().getFullYear()} Mini Arcade. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
            <a href="#" className="hover:text-white/60 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
```

---

### Step 2: Landing Page

#### 2.1 Create `client/src/app/page.tsx`
```tsx
import { AppLayout } from '@/components/layout/AppLayout'
import { GameCard } from '@/components/games/GameCard'
import { GAMES } from '@/lib/games'

export default function HomePage() {
  return (
    <AppLayout>
      {/* Hero */}
      <section className="text-center py-12 md:py-20">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Play Together, <span className="text-purple-400">Anywhere</span>
        </h1>
        <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-8">
          Classic party games reimagined for the browser. Create a room, share the code, and start playing with friends in seconds.
        </p>
        <a
          href="/lobby"
          className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
        >
          Start Playing
        </a>
      </section>

      {/* Game Grid */}
      <section className="py-8">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Choose Your Game</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {GAMES.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <h2 className="text-2xl font-bold text-white mb-12 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-600/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">1</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Pick a Game</h3>
            <p className="text-white/60">Choose from Skribble, Trivia, Wordel, or Flagel</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-600/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">2</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Create a Room</h3>
            <p className="text-white/60">Get a unique code to share with your friends</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-600/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">3</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Play Together</h3>
            <p className="text-white/60">Compete in real-time with friends anywhere</p>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
```

#### 2.2 Create `client/src/lib/games.ts`
```typescript
import { GameId } from '@mini-arcade/shared'

export interface GameInfo {
  id: GameId
  name: string
  description: string
  icon: string // emoji or icon name
  color: string // tailwind color class
  minPlayers: number
  maxPlayers: number
  features: string[]
}

export const GAMES: GameInfo[] = [
  {
    id: 'skribble',
    name: 'Skribble',
    description: 'Draw and guess words with friends. Take turns drawing while others try to guess!',
    icon: '🎨',
    color: 'from-pink-500 to-rose-500',
    minPlayers: 2,
    maxPlayers: 8,
    features: ['Real-time drawing', 'Word hints', 'Score tracking'],
  },
  {
    id: 'trivia',
    name: 'Trivia',
    description: 'Test your knowledge! Answer questions faster than your friends to score big.',
    icon: '🧠',
    color: 'from-blue-500 to-cyan-500',
    minPlayers: 1,
    maxPlayers: 10,
    features: ['Multiple categories', 'Speed scoring', 'Leaderboards'],
  },
  {
    id: 'wordel',
    name: 'Wordel',
    description: 'Guess the 5-letter word in 6 tries. Color-coded hints guide your guesses!',
    icon: '📝',
    color: 'from-green-500 to-emerald-500',
    minPlayers: 1,
    maxPlayers: 8,
    features: ['Daily words', 'Multiplayer race', 'Streak tracking'],
  },
  {
    id: 'flagel',
    name: 'Flagel',
    description: 'Identify countries by their flags. Progressive hints help you learn!',
    icon: '🏳️',
    color: 'from-amber-500 to-orange-500',
    minPlayers: 1,
    maxPlayers: 8,
    features: ['195+ countries', 'Hint system', 'Geography facts'],
  },
]

export function getGameById(id: GameId): GameInfo | undefined {
  return GAMES.find(g => g.id === id)
}
```

#### 2.3 Create `client/src/components/games/GameCard.tsx`
```tsx
import Link from 'next/link'
import { GameInfo } from '@/lib/games'
import { Users, ArrowRight } from 'lucide-react'

interface GameCardProps {
  game: GameInfo
}

export function GameCard({ game }: GameCardProps) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${game.color} p-[1px]`}>
      <div className="relative bg-slate-900 rounded-2xl p-6 h-full flex flex-col">
        {/* Icon */}
        <div className="text-5xl mb-4">{game.icon}</div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
        
        {/* Description */}
        <p className="text-white/60 text-sm mb-4 flex-1">{game.description}</p>
        
        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {game.features.slice(0, 2).map((feature) => (
            <span
              key={feature}
              className="px-2 py-1 text-xs bg-white/10 rounded-full text-white/80"
            >
              {feature}
            </span>
          ))}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-1 text-sm text-white/40">
            <Users className="w-4 h-4" />
            <span>{game.minPlayers}-{game.maxPlayers}</span>
          </div>
          <Link
            href={`/lobby?game=${game.id}`}
            className="flex items-center gap-1 text-sm font-medium text-white hover:text-purple-400 transition-colors"
          >
            Play
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
```

---

### Step 3: Lobby System

#### 3.1 Create `client/src/app/lobby/page.tsx`
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AppLayout } from '@/components/layout/AppLayout'
import { GameSelector } from '@/components/lobby/GameSelector'
import { CreateRoomForm } from '@/components/lobby/CreateRoomForm'
import { JoinRoomForm } from '@/components/lobby/JoinRoomForm'
import { GAMES, GameInfo, getGameById } from '@/lib/games'
import { GameId } from '@mini-arcade/shared'

type TabType = 'create' | 'join'

export default function LobbyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  
  const [activeTab, setActiveTab] = useState<TabType>('create')
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-select game from URL
  useEffect(() => {
    const gameParam = searchParams.get('game') as GameId | null
    if (gameParam && GAMES.some(g => g.id === gameParam)) {
      setSelectedGame(gameParam)
    }
  }, [searchParams])

  const handleCreateRoom = async () => {
    if (!selectedGame) {
      setError('Please select a game')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: selectedGame }),
      })

      if (!response.ok) {
        throw new Error('Failed to create room')
      }

      const { roomCode } = await response.json()
      router.push(`/rooms/${roomCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async (roomCode: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate room exists
      const response = await fetch(`/api/rooms/${roomCode}`)
      
      if (!response.ok) {
        throw new Error('Room not found')
      }

      router.push(`/rooms/${roomCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Room not found')
    } finally {
      setIsLoading(false)
    }
  }

  // Require authentication
  if (status === 'loading') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
          <p className="text-white/60 mb-6">You need to sign in to create or join rooms.</p>
          <button
            onClick={() => signIn()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Game Lobby</h1>

        {/* Tabs */}
        <div className="flex rounded-xl bg-white/5 p-1 mb-8">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-purple-600 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'join'
                ? 'bg-purple-600 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Join Room
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Content */}
        {activeTab === 'create' ? (
          <div className="space-y-6">
            <GameSelector
              games={GAMES}
              selectedGame={selectedGame}
              onSelect={setSelectedGame}
            />
            <CreateRoomForm
              selectedGame={selectedGame ? getGameById(selectedGame) : null}
              isLoading={isLoading}
              onCreate={handleCreateRoom}
            />
          </div>
        ) : (
          <JoinRoomForm isLoading={isLoading} onJoin={handleJoinRoom} />
        )}
      </div>
    </AppLayout>
  )
}
```

#### 3.2 Create `client/src/components/lobby/GameSelector.tsx`
```tsx
import { GameInfo } from '@/lib/games'
import { GameId } from '@mini-arcade/shared'
import { Check } from 'lucide-react'

interface GameSelectorProps {
  games: GameInfo[]
  selectedGame: GameId | null
  onSelect: (gameId: GameId) => void
}

export function GameSelector({ games, selectedGame, onSelect }: GameSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/80 mb-3">
        Select a Game
      </label>
      <div className="grid grid-cols-2 gap-3">
        {games.map((game) => {
          const isSelected = selectedGame === game.id
          return (
            <button
              key={game.id}
              onClick={() => onSelect(game.id)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/10 hover:border-white/20 bg-white/5'
              }`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              
              <div className="text-2xl mb-2">{game.icon}</div>
              <div className="font-semibold text-white">{game.name}</div>
              <div className="text-xs text-white/50 mt-1">
                {game.minPlayers}-{game.maxPlayers} players
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

#### 3.3 Create `client/src/components/lobby/CreateRoomForm.tsx`
```tsx
import { GameInfo } from '@/lib/games'
import { Loader2, Sparkles } from 'lucide-react'

interface CreateRoomFormProps {
  selectedGame: GameInfo | null
  isLoading: boolean
  onCreate: () => void
}

export function CreateRoomForm({ selectedGame, isLoading, onCreate }: CreateRoomFormProps) {
  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      {selectedGame ? (
        <>
          <div className="flex items-center gap-4 mb-6">
            <div className="text-4xl">{selectedGame.icon}</div>
            <div>
              <h3 className="text-lg font-semibold text-white">{selectedGame.name}</h3>
              <p className="text-sm text-white/60">{selectedGame.description}</p>
            </div>
          </div>
          
          <button
            onClick={onCreate}
            disabled={isLoading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create Room
              </>
            )}
          </button>
        </>
      ) : (
        <div className="text-center py-8 text-white/40">
          Select a game above to create a room
        </div>
      )}
    </div>
  )
}
```

#### 3.4 Create `client/src/components/lobby/JoinRoomForm.tsx`
```tsx
'use client'

import { useState } from 'react'
import { LogIn, Loader2 } from 'lucide-react'

interface JoinRoomFormProps {
  isLoading: boolean
  onJoin: (roomCode: string) => void
}

export function JoinRoomForm({ isLoading, onJoin }: JoinRoomFormProps) {
  const [roomCode, setRoomCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomCode.trim()) {
      onJoin(roomCode.trim().toUpperCase())
    }
  }

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4">Join with Room Code</h3>
      <p className="text-white/60 text-sm mb-6">
        Enter the 6-character room code shared by your friend.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="roomCode" className="block text-sm font-medium text-white/80 mb-2">
            Room Code
          </label>
          <input
            id="roomCode"
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-white/30 placeholder:tracking-normal focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || roomCode.length < 6}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Join Room
            </>
          )}
        </button>
      </form>
    </div>
  )
}
```

---

### Step 4: Room Waiting Screen

#### 4.1 Create `client/src/app/rooms/[roomCode]/page.tsx`
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AppLayout } from '@/components/layout/AppLayout'
import { RoomHeader } from '@/components/room/RoomHeader'
import { PlayerList } from '@/components/room/PlayerList'
import { RoomControls } from '@/components/room/RoomControls'
import { useSocket } from '@/hooks/useSocket'
import { getGameById } from '@/lib/games'
import { ROOM_EVENTS, Player, GameId } from '@mini-arcade/shared'

interface RoomState {
  code: string
  gameId: GameId
  hostId: string
  players: Player[]
  status: 'WAITING' | 'PLAYING' | 'FINISHED'
}

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const roomCode = params.roomCode as string
  
  const [room, setRoom] = useState<RoomState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const socket = useSocket()
  const game = room?.gameId ? getGameById(room.gameId) : null
  const isHost = room?.hostId === session?.user?.id

  // Join room on mount
  useEffect(() => {
    if (!socket || !session) return

    // Join the room
    socket.emit(ROOM_EVENTS.JOIN, { roomCode })

    // Listen for room updates
    socket.on(ROOM_EVENTS.STATE, (state: RoomState) => {
      setRoom(state)
      setIsLoading(false)
    })

    socket.on(ROOM_EVENTS.PLAYER_JOINED, (player: Player) => {
      setRoom((prev) => prev ? { ...prev, players: [...prev.players, player] } : prev)
    })

    socket.on(ROOM_EVENTS.PLAYER_LEFT, ({ playerId }: { playerId: string }) => {
      setRoom((prev) => prev ? {
        ...prev,
        players: prev.players.filter(p => p.id !== playerId),
      } : prev)
    })

    socket.on(ROOM_EVENTS.HOST_CHANGED, ({ hostId }: { hostId: string }) => {
      setRoom((prev) => prev ? { ...prev, hostId } : prev)
    })

    socket.on(ROOM_EVENTS.GAME_STARTED, () => {
      router.push(`/rooms/${roomCode}/play`)
    })

    socket.on(ROOM_EVENTS.ERROR, ({ message }: { message: string }) => {
      setError(message)
      setIsLoading(false)
    })

    return () => {
      socket.emit(ROOM_EVENTS.LEAVE, { roomCode })
      socket.off(ROOM_EVENTS.STATE)
      socket.off(ROOM_EVENTS.PLAYER_JOINED)
      socket.off(ROOM_EVENTS.PLAYER_LEFT)
      socket.off(ROOM_EVENTS.HOST_CHANGED)
      socket.off(ROOM_EVENTS.GAME_STARTED)
      socket.off(ROOM_EVENTS.ERROR)
    }
  }, [socket, session, roomCode, router])

  const handleStartGame = () => {
    if (socket && isHost) {
      socket.emit(ROOM_EVENTS.START_GAME, { roomCode })
    }
  }

  const handleKickPlayer = (playerId: string) => {
    if (socket && isHost) {
      socket.emit(ROOM_EVENTS.KICK_PLAYER, { roomCode, playerId })
    }
  }

  const handleLeaveRoom = () => {
    router.push('/lobby')
  }

  if (isLoading) {
    return (
      <AppLayout showFooter={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60">Joining room...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !room) {
    return (
      <AppLayout showFooter={false}>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-white mb-4">Room Not Found</h1>
          <p className="text-white/60 mb-6">{error || 'This room does not exist or has expired.'}</p>
          <button
            onClick={() => router.push('/lobby')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout showFooter={false}>
      <div className="max-w-2xl mx-auto">
        <RoomHeader roomCode={room.code} game={game} />
        
        <div className="mt-8 space-y-6">
          <PlayerList
            players={room.players}
            hostId={room.hostId}
            currentUserId={session?.user?.id}
            isHost={isHost}
            onKick={handleKickPlayer}
          />

          <RoomControls
            isHost={isHost}
            playerCount={room.players.length}
            minPlayers={game?.minPlayers ?? 2}
            onStart={handleStartGame}
            onLeave={handleLeaveRoom}
          />
        </div>
      </div>
    </AppLayout>
  )
}
```

#### 4.2 Create `client/src/components/room/RoomHeader.tsx`
```tsx
'use client'

import { useState } from 'react'
import { GameInfo } from '@/lib/games'
import { Copy, Check, Share2 } from 'lucide-react'

interface RoomHeaderProps {
  roomCode: string
  game: GameInfo | null
}

export function RoomHeader({ roomCode, game }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false)

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareRoom = async () => {
    const url = `${window.location.origin}/rooms/${roomCode}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my ${game?.name || 'game'} room!`,
          text: `Join room ${roomCode}`,
          url,
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {game && <div className="text-4xl">{game.icon}</div>}
          <div>
            <h1 className="text-2xl font-bold text-white">{game?.name || 'Game'} Room</h1>
            <p className="text-white/60">Waiting for players...</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Room Code */}
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg transition-colors"
          >
            <span className="font-mono text-xl font-bold text-white tracking-wider">
              {roomCode}
            </span>
            {copied ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <Copy className="w-5 h-5 text-white/60" />
            )}
          </button>

          {/* Share */}
          <button
            onClick={shareRoom}
            className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
```

#### 4.3 Create `client/src/components/room/PlayerList.tsx`
```tsx
import { Player } from '@mini-arcade/shared'
import { Crown, Wifi, WifiOff, X } from 'lucide-react'

interface PlayerListProps {
  players: Player[]
  hostId: string
  currentUserId?: string
  isHost: boolean
  onKick: (playerId: string) => void
}

export function PlayerList({ players, hostId, currentUserId, isHost, onKick }: PlayerListProps) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <h2 className="text-lg font-semibold text-white mb-4">
        Players ({players.length})
      </h2>
      
      <div className="space-y-2">
        {players.map((player) => {
          const isPlayerHost = player.id === hostId
          const isCurrentUser = player.id === currentUserId
          
          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                isCurrentUser ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Name + badges */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{player.name}</span>
                    {isPlayerHost && (
                      <Crown className="w-4 h-4 text-amber-400" />
                    )}
                    {isCurrentUser && (
                      <span className="text-xs text-purple-400">(You)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions + status */}
              <div className="flex items-center gap-2">
                {/* Connection status */}
                {player.isConnected ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}

                {/* Kick button (host only, can't kick self) */}
                {isHost && !isCurrentUser && (
                  <button
                    onClick={() => onKick(player.id)}
                    className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

#### 4.4 Create `client/src/components/room/RoomControls.tsx`
```tsx
import { Play, LogOut, Users } from 'lucide-react'

interface RoomControlsProps {
  isHost: boolean
  playerCount: number
  minPlayers: number
  onStart: () => void
  onLeave: () => void
}

export function RoomControls({
  isHost,
  playerCount,
  minPlayers,
  onStart,
  onLeave,
}: RoomControlsProps) {
  const canStart = playerCount >= minPlayers

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {isHost ? (
        <>
          <button
            onClick={onStart}
            disabled={!canStart}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
              canStart
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5" />
            {canStart ? 'Start Game' : `Need ${minPlayers - playerCount} more player(s)`}
          </button>
          <button
            onClick={onLeave}
            className="py-3 px-6 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Leave
          </button>
        </>
      ) : (
        <>
          <div className="flex-1 py-3 px-6 bg-white/5 text-white/60 rounded-xl text-center">
            Waiting for host to start...
          </div>
          <button
            onClick={onLeave}
            className="py-3 px-6 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Leave
          </button>
        </>
      )}
    </div>
  )
}
```

---

### Step 5: Game Screen Layout

#### 5.1 Create `client/src/app/rooms/[roomCode]/play/page.tsx`
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'
import { AppLayout } from '@/components/layout/AppLayout'
import { SkribbleGame } from '@/components/games/skribble/SkribbleGame'
import { TriviaGame } from '@/components/games/trivia/TriviaGame'
import { WordelGame } from '@/components/games/wordel/WordelGame'
import { FlagelGame } from '@/components/games/flagel/FlagelGame'
import { GameHeader } from '@/components/game/GameHeader'
import { GameOver } from '@/components/game/GameOver'
import { ROOM_EVENTS, GameId, GameSnapshot } from '@mini-arcade/shared'

const GAME_COMPONENTS: Record<GameId, React.ComponentType<{ roomCode: string }>> = {
  skribble: SkribbleGame,
  trivia: TriviaGame,
  wordel: WordelGame,
  flagel: FlagelGame,
}

export default function PlayPage() {
  const params = useParams()
  const router = useRouter()
  const socket = useSocket()
  const roomCode = params.roomCode as string

  const [gameId, setGameId] = useState<GameId | null>(null)
  const [gameSnapshot, setGameSnapshot] = useState<GameSnapshot | null>(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const [finalResults, setFinalResults] = useState<any>(null)

  useEffect(() => {
    if (!socket) return

    // Get initial game state
    socket.emit(ROOM_EVENTS.REQUEST_SYNC, { roomCode })

    socket.on('sync', (snapshot: GameSnapshot & { gameId: GameId }) => {
      setGameId(snapshot.gameId)
      setGameSnapshot(snapshot)
      
      if (snapshot.phase === 'gameEnd') {
        setIsGameOver(true)
      }
    })

    socket.on('gameEnd', (results: any) => {
      setIsGameOver(true)
      setFinalResults(results)
    })

    return () => {
      socket.off('sync')
      socket.off('gameEnd')
    }
  }, [socket, roomCode])

  const handlePlayAgain = () => {
    router.push(`/rooms/${roomCode}`)
  }

  const handleBackToLobby = () => {
    router.push('/lobby')
  }

  if (!gameId || !gameSnapshot) {
    return (
      <AppLayout showFooter={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60">Loading game...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (isGameOver) {
    return (
      <AppLayout showFooter={false}>
        <GameOver
          results={finalResults}
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handleBackToLobby}
        />
      </AppLayout>
    )
  }

  const GameComponent = GAME_COMPONENTS[gameId]

  return (
    <AppLayout showFooter={false}>
      <div className="max-w-6xl mx-auto">
        <GameHeader
          gameId={gameId}
          currentRound={gameSnapshot.currentRound}
          totalRounds={gameSnapshot.totalRounds}
          scores={gameSnapshot.scores}
          timeRemaining={gameSnapshot.timeRemaining}
        />
        
        <div className="mt-6">
          <GameComponent roomCode={roomCode} />
        </div>
      </div>
    </AppLayout>
  )
}
```

#### 5.2 Create `client/src/components/game/GameHeader.tsx`
```tsx
import { GameId } from '@mini-arcade/shared'
import { getGameById } from '@/lib/games'
import { Timer } from './Timer'

interface GameHeaderProps {
  gameId: GameId
  currentRound: number
  totalRounds: number
  scores: Record<string, number>
  timeRemaining?: number
}

export function GameHeader({
  gameId,
  currentRound,
  totalRounds,
  scores,
  timeRemaining,
}: GameHeaderProps) {
  const game = getGameById(gameId)
  const sortedScores = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between">
        {/* Game info */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">{game?.icon}</span>
          <div>
            <h1 className="font-bold text-white">{game?.name}</h1>
            <p className="text-sm text-white/60">
              Round {currentRound} of {totalRounds}
            </p>
          </div>
        </div>

        {/* Timer */}
        {timeRemaining !== undefined && (
          <Timer seconds={timeRemaining} />
        )}

        {/* Top scores */}
        <div className="hidden md:flex items-center gap-4">
          {sortedScores.map(([playerId, score], index) => (
            <div key={playerId} className="flex items-center gap-2">
              <span className="text-sm text-white/60">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
              </span>
              <span className="text-sm text-white">{score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

#### 5.3 Create `client/src/components/game/Timer.tsx`
```tsx
interface TimerProps {
  seconds: number
}

export function Timer({ seconds }: TimerProps) {
  const isLow = seconds <= 10
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  return (
    <div
      className={`px-4 py-2 rounded-lg font-mono text-xl font-bold ${
        isLow
          ? 'bg-red-500/20 text-red-400 animate-pulse'
          : 'bg-white/10 text-white'
      }`}
    >
      {minutes > 0 && `${minutes}:`}
      {secs.toString().padStart(2, '0')}
    </div>
  )
}
```

#### 5.4 Create `client/src/components/game/GameOver.tsx`
```tsx
import { Trophy, RotateCcw, Home } from 'lucide-react'

interface GameOverProps {
  results: {
    finalScores: Array<{
      playerId: string
      playerName: string
      score: number
      rank: number
    }>
  } | null
  onPlayAgain: () => void
  onBackToLobby: () => void
}

export function GameOver({ results, onPlayAgain, onBackToLobby }: GameOverProps) {
  const sortedScores = results?.finalScores || []

  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-white mb-2">Game Over!</h1>
      <p className="text-white/60 mb-8">Here are the final results</p>

      {/* Leaderboard */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden mb-8">
        {sortedScores.map((player, index) => (
          <div
            key={player.playerId}
            className={`flex items-center justify-between p-4 ${
              index < sortedScores.length - 1 ? 'border-b border-white/10' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && <span className="text-white/40">{index + 1}</span>}
              </span>
              <span className="font-medium text-white">{player.playerName}</span>
            </div>
            <span className="text-xl font-bold text-purple-400">{player.score}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </button>
        <button
          onClick={onBackToLobby}
          className="flex-1 py-3 px-6 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Home className="w-5 h-5" />
          Back to Lobby
        </button>
      </div>
    </div>
  )
}
```

---

### Step 6: Socket Hook

#### 6.1 Create `client/src/hooks/useSocket.ts`
```tsx
'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

let globalSocket: Socket | null = null

export function useSocket() {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (!session?.user) {
      return
    }

    // Reuse existing socket or create new one
    if (!globalSocket) {
      globalSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        auth: {
          token: session.accessToken,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      globalSocket.on('connect', () => {
        console.log('Socket connected:', globalSocket?.id)
      })

      globalSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
      })

      globalSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
      })
    }

    setSocket(globalSocket)

    return () => {
      // Don't disconnect on component unmount, let it persist
    }
  }, [session])

  return socket
}

// Cleanup function for app unmount
export function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect()
    globalSocket = null
  }
}
```

---

### Step 7: User Stats Page

#### 7.1 Create `client/src/app/stats/page.tsx`
```tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatsCard } from '@/components/stats/StatsCard'
import { RecentGames } from '@/components/stats/RecentGames'
import { authOptions } from '@/lib/auth'

export default async function StatsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/api/auth/signin')
  }

  // Fetch user stats
  const gameStats = await prisma.gameStat.findMany({
    where: { userId: session.user.id },
  })

  // Fetch recent game results
  const recentResults = await prisma.gameResult.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      room: {
        select: { code: true },
      },
    },
  })

  // Calculate totals
  const totals = gameStats.reduce(
    (acc, stat) => ({
      gamesPlayed: acc.gamesPlayed + stat.gamesPlayed,
      gamesWon: acc.gamesWon + stat.gamesWon,
      totalScore: acc.totalScore + stat.totalScore,
    }),
    { gamesPlayed: 0, gamesWon: 0, totalScore: 0 }
  )

  const winRate = totals.gamesPlayed > 0
    ? Math.round((totals.gamesWon / totals.gamesPlayed) * 100)
    : 0

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">My Stats</h1>

        {/* Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Games Played" value={totals.gamesPlayed} icon="🎮" />
          <StatsCard title="Games Won" value={totals.gamesWon} icon="🏆" />
          <StatsCard title="Win Rate" value={`${winRate}%`} icon="📈" />
          <StatsCard title="Total Score" value={totals.totalScore.toLocaleString()} icon="⭐" />
        </div>

        {/* Per-game stats */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">By Game</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameStats.map((stat) => (
              <div
                key={stat.gameId}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white capitalize">{stat.gameId}</h3>
                  <span className="text-sm text-white/60">
                    High Score: {stat.highScore}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-white/60">Played</span>
                    <p className="font-semibold text-white">{stat.gamesPlayed}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Won</span>
                    <p className="font-semibold text-white">{stat.gamesWon}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Total</span>
                    <p className="font-semibold text-white">{stat.totalScore}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent games */}
        <RecentGames results={recentResults} />
      </div>
    </AppLayout>
  )
}
```

#### 7.2 Create `client/src/components/stats/StatsCard.tsx`
```tsx
interface StatsCardProps {
  title: string
  value: string | number
  icon: string
}

export function StatsCard({ title, value, icon }: StatsCardProps) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-white/60">{title}</div>
    </div>
  )
}
```

#### 7.3 Create `client/src/components/stats/RecentGames.tsx`
```tsx
import { formatDistanceToNow } from 'date-fns'

interface GameResult {
  id: string
  gameId: string
  score: number
  rank: number
  isWinner: boolean
  createdAt: Date
  room: {
    code: string
  }
}

interface RecentGamesProps {
  results: GameResult[]
}

export function RecentGames({ results }: RecentGamesProps) {
  if (results.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Recent Games</h2>
        <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
          <p className="text-white/60">No games played yet</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-4">Recent Games</h2>
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        {results.map((result, index) => (
          <div
            key={result.id}
            className={`flex items-center justify-between p-4 ${
              index < results.length - 1 ? 'border-b border-white/10' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Rank badge */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  result.isWinner
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                #{result.rank}
              </div>

              {/* Game info */}
              <div>
                <p className="font-medium text-white capitalize">{result.gameId}</p>
                <p className="text-sm text-white/40">
                  Room {result.room.code}
                </p>
              </div>
            </div>

            {/* Score + time */}
            <div className="text-right">
              <p className="font-semibold text-purple-400">{result.score} pts</p>
              <p className="text-xs text-white/40">
                {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

---

## Files Created/Modified

```
client/src/
├── app/
│   ├── page.tsx (landing)
│   ├── lobby/
│   │   └── page.tsx
│   ├── rooms/
│   │   └── [roomCode]/
│   │       ├── page.tsx (waiting room)
│   │       └── play/
│   │           └── page.tsx (game screen)
│   └── stats/
│       └── page.tsx
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── lobby/
│   │   ├── GameSelector.tsx
│   │   ├── CreateRoomForm.tsx
│   │   └── JoinRoomForm.tsx
│   ├── room/
│   │   ├── RoomHeader.tsx
│   │   ├── PlayerList.tsx
│   │   └── RoomControls.tsx
│   ├── game/
│   │   ├── GameHeader.tsx
│   │   ├── Timer.tsx
│   │   └── GameOver.tsx
│   ├── games/
│   │   ├── GameCard.tsx
│   │   ├── skribble/
│   │   │   └── SkribbleGame.tsx (placeholder)
│   │   ├── trivia/
│   │   │   └── TriviaGame.tsx (placeholder)
│   │   ├── wordel/
│   │   │   └── WordelGame.tsx (placeholder)
│   │   └── flagel/
│   │       └── FlagelGame.tsx (placeholder)
│   └── stats/
│       ├── StatsCard.tsx
│       └── RecentGames.tsx
├── hooks/
│   └── useSocket.ts
└── lib/
    └── games.ts
```

---

## Route Structure

```
/                           Landing page with game cards
/lobby                      Create or join room
/lobby?game=skribble        Pre-select game when coming from game card
/rooms/ABC123               Room waiting screen
/rooms/ABC123/play          Active game screen
/stats                      User statistics
/admin/*                    Admin dashboard (see PHASE_02_AUTH_ADMIN.md)
```

---

## Design System Reference

**IMPORTANT:** Follow the complete design system defined in `C:\game\.agent\DESIGN_SYSTEM.md`

### Key Points
- **Light mode background:** `#F7F9FC` (NOT pure white)
- **Dark mode background:** `#0B0E14` (deep dark, not pure black)
- **Border radius:** `xl` (12px) for cards, `lg` (8px) for buttons
- **Sidebar:** Dark in both themes for contrast
- **Typography:** Inter font family, consistent spacing
- **Spacing:** Based on 4px grid system

See `DESIGN_SYSTEM.md` for complete color tokens, typography scale, spacing system, and component guidelines.

---

## Next Phase
Continue with **PHASE_09_HARDENING.md** for validation, rate limiting, reconnection handling, and deployment configuration.
