# Phase 2: Authentication + Admin Dashboard

## Overview
Implement complete authentication system using NextAuth.js with OAuth providers, and build a comprehensive admin dashboard for managing users, games, rooms, and platform settings.

**Status:** To Implement  
**Priority:** Critical  
**Estimated Time:** 8-12 hours  
**Dependencies:** Phase 0, Phase 1 completed

---

## Goals
- Implement OAuth authentication (Google, GitHub)
- Create user database models with roles
- Build protected API routes
- Create admin dashboard with full CRUD operations
- Implement role-based access control
- Add admin analytics and monitoring

---

## Acceptance Criteria
- [ ] Users can sign in with Google OAuth
- [ ] Users can sign in with GitHub OAuth
- [ ] User sessions persist across page refreshes
- [ ] Admin role is properly assigned and checked
- [ ] Admin dashboard is protected from non-admin users
- [ ] Admin can view/manage all users
- [ ] Admin can view/manage all games
- [ ] Admin can view/manage all rooms
- [ ] Admin can view analytics and statistics
- [ ] All admin actions are logged

---

## Database Schema

### Update `server/prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =============================================================================
// NEXTAUTH MODELS
// =============================================================================

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// =============================================================================
// USER MODEL
// =============================================================================

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  role          UserRole  @default(USER)
  status        UserStatus @default(ACTIVE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  
  // Relations
  accounts      Account[]
  sessions      Session[]
  roomsCreated  Room[]        @relation("RoomCreator")
  roomPlayers   RoomPlayer[]
  gameStats     GameStat[]
  gameResults   GameResult[]
  adminLogs     AdminLog[]    @relation("AdminActor")
  targetedLogs  AdminLog[]    @relation("AdminTarget")

  @@index([email])
  @@index([role])
  @@index([status])
}

enum UserRole {
  USER
  MODERATOR
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
}

// =============================================================================
// ROOM MODELS
// =============================================================================

model Room {
  id          String      @id @default(cuid())
  code        String      @unique @db.VarChar(6)
  gameId      String
  status      RoomStatus  @default(WAITING)
  maxPlayers  Int         @default(8)
  isPrivate   Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  startedAt   DateTime?
  endedAt     DateTime?
  
  // Relations
  creatorId   String
  creator     User        @relation("RoomCreator", fields: [creatorId], references: [id])
  players     RoomPlayer[]
  gameResults GameResult[]
  
  @@index([code])
  @@index([gameId])
  @@index([status])
  @@index([creatorId])
  @@index([createdAt])
}

enum RoomStatus {
  WAITING
  PLAYING
  FINISHED
  ABANDONED
}

model RoomPlayer {
  id        String   @id @default(cuid())
  roomId    String
  userId    String
  joinedAt  DateTime @default(now())
  leftAt    DateTime?
  isHost    Boolean  @default(false)
  score     Int      @default(0)
  
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])

  @@unique([roomId, userId])
  @@index([roomId])
  @@index([userId])
}

// =============================================================================
// GAME STATISTICS
// =============================================================================

model GameStat {
  id           String   @id @default(cuid())
  userId       String
  gameId       String
  gamesPlayed  Int      @default(0)
  gamesWon     Int      @default(0)
  totalScore   Int      @default(0)
  highScore    Int      @default(0)
  totalTime    Int      @default(0) // seconds
  updatedAt    DateTime @updatedAt
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, gameId])
  @@index([userId])
  @@index([gameId])
}

model GameResult {
  id          String   @id @default(cuid())
  roomId      String
  userId      String
  gameId      String
  score       Int      @default(0)
  rank        Int?
  isWinner    Boolean  @default(false)
  duration    Int?     // seconds
  metadata    Json?    // Game-specific data
  createdAt   DateTime @default(now())
  
  room        Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id])

  @@index([roomId])
  @@index([userId])
  @@index([gameId])
  @@index([createdAt])
}

// =============================================================================
// ADMIN & CONFIGURATION
// =============================================================================

model AdminLog {
  id          String   @id @default(cuid())
  actorId     String
  action      String
  targetType  String?  // USER, ROOM, GAME, SETTING
  targetId    String?
  details     Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  actor       User     @relation("AdminActor", fields: [actorId], references: [id])
  targetUser  User?    @relation("AdminTarget", fields: [targetId], references: [id])

  @@index([actorId])
  @@index([action])
  @@index([targetType])
  @@index([createdAt])
}

model GameConfig {
  id           String   @id @default(cuid())
  gameId       String   @unique
  name         String
  description  String?
  isEnabled    Boolean  @default(true)
  minPlayers   Int      @default(1)
  maxPlayers   Int      @default(8)
  defaultRounds Int     @default(5)
  roundTime    Int      @default(60) // seconds
  settings     Json?    // Game-specific settings
  updatedAt    DateTime @updatedAt

  @@index([gameId])
  @@index([isEnabled])
}

model SystemSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  type      String   @default("string") // string, number, boolean, json
  category  String   @default("general")
  updatedAt DateTime @updatedAt

  @@index([key])
  @@index([category])
}

model Announcement {
  id         String    @id @default(cuid())
  title      String
  message    String    @db.Text
  type       String    @default("info") // info, warning, success, error
  isActive   Boolean   @default(true)
  startsAt   DateTime  @default(now())
  endsAt     DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([isActive])
  @@index([startsAt])
  @@index([endsAt])
}
```

---

## Implementation Steps

### Step 1: NextAuth Setup

#### 1.1 Install Dependencies (client)
```bash
pnpm --filter client add next-auth @auth/prisma-adapter
```

#### 1.2 Create `client/src/app/api/auth/[...nextauth]/route.ts`
```typescript
import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'

// Note: In production, import prisma from a shared location
const prisma = new PrismaClient()

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Auto-assign admin role to specified emails
      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        await prisma.user.update({
          where: { email: user.email },
          data: { role: 'ADMIN' },
        }).catch(() => {
          // User might not exist yet on first sign in
        })
      }
      return true
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        
        // Fetch user role from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, status: true },
        })
        
        session.user.role = dbUser?.role || 'USER'
        session.user.status = dbUser?.status || 'ACTIVE'
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  events: {
    async signIn({ user }) {
      // Update last login time
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }).catch(() => {})
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

#### 1.3 Create `client/src/types/next-auth.d.ts`
```typescript
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN'
      status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
    }
  }

  interface User {
    role?: 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN'
    status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role?: string
  }
}
```

#### 1.4 Create Auth Provider `client/src/components/providers/AuthProvider.tsx`
```typescript
'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>
}
```

#### 1.5 Update `client/src/app/layout.tsx`
```typescript
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/providers/AuthProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Mini Arcade',
  description: 'Play fun games with friends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

---

### Step 2: Authentication UI

#### 2.1 Create `client/src/app/auth/signin/page.tsx`
```typescript
'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function SignInPage() {
  const [providers, setProviders] = useState<any>(null)
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')

  useEffect(() => {
    getProviders().then(setProviders)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Welcome to Mini Arcade
        </h1>
        <p className="text-white/70 text-center mb-8">
          Sign in to play games with friends
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-200 text-sm text-center">
              {error === 'OAuthAccountNotLinked'
                ? 'This email is already linked to another account'
                : 'An error occurred during sign in'}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {providers &&
            Object.values(providers).map((provider: any) => (
              <button
                key={provider.name}
                onClick={() => signIn(provider.id, { callbackUrl })}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {provider.id === 'google' && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                {provider.id === 'github' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                )}
                Continue with {provider.name}
              </button>
            ))}
        </div>

        <p className="text-white/50 text-xs text-center mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
```

#### 2.2 Create Auth Hook `client/src/hooks/useAuth.ts`
```typescript
'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useCallback } from 'react'

export function useAuth() {
  const { data: session, status } = useSession()
  
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const user = session?.user
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isModerator = user?.role === 'MODERATOR' || isAdmin
  const isBanned = user?.status === 'BANNED'
  const isSuspended = user?.status === 'SUSPENDED'

  const login = useCallback((provider?: string, callbackUrl?: string) => {
    if (provider) {
      signIn(provider, { callbackUrl })
    } else {
      signIn(undefined, { callbackUrl })
    }
  }, [])

  const logout = useCallback((callbackUrl?: string) => {
    signOut({ callbackUrl: callbackUrl || '/' })
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isModerator,
    isBanned,
    isSuspended,
    login,
    logout,
  }
}
```

---

### Step 3: Admin Dashboard Structure

#### 3.1 Create Admin Layout `client/src/app/admin/layout.tsx`
```typescript
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin?callbackUrl=/admin')
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/?error=unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminHeader user={session.user} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

#### 3.2 Create Admin Sidebar `client/src/components/admin/AdminSidebar.tsx`
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  UsersIcon,
  GamepadIcon,
  DoorOpenIcon,
  SettingsIcon,
  ChartBarIcon,
  BellIcon,
  ShieldIcon,
  ClipboardListIcon,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Games', href: '/admin/games', icon: GamepadIcon },
  { name: 'Rooms', href: '/admin/rooms', icon: DoorOpenIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Announcements', href: '/admin/announcements', icon: BellIcon },
  { name: 'Moderation', href: '/admin/moderation', icon: ShieldIcon },
  { name: 'Audit Log', href: '/admin/logs', icon: ClipboardListIcon },
  { name: 'Settings', href: '/admin/settings', icon: SettingsIcon },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-800 min-h-[calc(100vh-64px)] p-4">
      <nav className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

#### 3.3 Create Admin Header `client/src/components/admin/AdminHeader.tsx`
```typescript
'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'

interface AdminHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role: string
  }
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-gray-800 border-b border-gray-700 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="text-xl font-bold text-white">
          Mini Arcade Admin
        </Link>
        <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
          {user.role}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-gray-300 hover:text-white transition-colors"
        >
          View Site
        </Link>
        
        <div className="flex items-center gap-3">
          {user.image && (
            <Image
              src={user.image}
              alt={user.name || 'User'}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <div className="text-sm">
            <p className="text-white">{user.name}</p>
            <p className="text-gray-400 text-xs">{user.email}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
```

---

### Step 4: Admin Dashboard Pages

#### 4.1 Dashboard Home `client/src/app/admin/page.tsx`
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { StatsCards } from '@/components/admin/StatsCards'
import { RecentActivity } from '@/components/admin/RecentActivity'
import { ActiveRooms } from '@/components/admin/ActiveRooms'
import { prisma } from '@/lib/prisma'

async function getDashboardStats() {
  const [
    totalUsers,
    activeUsers24h,
    totalRooms,
    activeRooms,
    gamesPlayed24h,
    gameStats,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.room.count(),
    prisma.room.count({
      where: {
        status: { in: ['WAITING', 'PLAYING'] },
      },
    }),
    prisma.gameResult.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.gameResult.groupBy({
      by: ['gameId'],
      _count: true,
      orderBy: {
        _count: {
          gameId: 'desc',
        },
      },
    }),
  ])

  return {
    totalUsers,
    activeUsers24h,
    totalRooms,
    activeRooms,
    gamesPlayed24h,
    gameStats,
  }
}

async function getRecentActivity() {
  const [recentUsers, recentRooms, recentLogs] = await Promise.all([
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    }),
    prisma.room.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { name: true },
        },
        _count: {
          select: { players: true },
        },
      },
    }),
    prisma.adminLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { name: true, email: true },
        },
      },
    }),
  ])

  return { recentUsers, recentRooms, recentLogs }
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  const stats = await getDashboardStats()
  const activity = await getRecentActivity()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Welcome back, {session?.user?.name}</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activity={activity} />
        <ActiveRooms rooms={activity.recentRooms} />
      </div>
    </div>
  )
}
```

#### 4.2 Create Stats Cards Component `client/src/components/admin/StatsCards.tsx`
```typescript
import {
  UsersIcon,
  GamepadIcon,
  DoorOpenIcon,
  TrophyIcon,
} from 'lucide-react'

interface StatsCardsProps {
  stats: {
    totalUsers: number
    activeUsers24h: number
    totalRooms: number
    activeRooms: number
    gamesPlayed24h: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers24h} active today`,
      icon: UsersIcon,
      color: 'bg-blue-600',
    },
    {
      title: 'Active Rooms',
      value: stats.activeRooms,
      subtitle: `${stats.totalRooms} total`,
      icon: DoorOpenIcon,
      color: 'bg-green-600',
    },
    {
      title: 'Games Played',
      value: stats.gamesPlayed24h,
      subtitle: 'Last 24 hours',
      icon: GamepadIcon,
      color: 'bg-purple-600',
    },
    {
      title: 'Win Rate',
      value: '48%',
      subtitle: 'Average',
      icon: TrophyIcon,
      color: 'bg-yellow-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${card.color}`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white">{card.value}</h3>
          <p className="text-gray-400 text-sm">{card.title}</p>
          <p className="text-gray-500 text-xs mt-1">{card.subtitle}</p>
        </div>
      ))}
    </div>
  )
}
```

---

### Step 5: User Management

#### 5.1 Create Users Page `client/src/app/admin/users/page.tsx`
```typescript
import { prisma } from '@/lib/prisma'
import { UserTable } from '@/components/admin/users/UserTable'
import { UserFilters } from '@/components/admin/users/UserFilters'

interface UsersPageProps {
  searchParams: {
    search?: string
    role?: string
    status?: string
    page?: string
  }
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where: any = {}

  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { email: { contains: searchParams.search, mode: 'insensitive' } },
    ]
  }

  if (searchParams.role) {
    where.role = searchParams.role
  }

  if (searchParams.status) {
    where.status = searchParams.status
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            roomsCreated: true,
            gameResults: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400">{totalCount} total users</p>
        </div>
      </div>

      <UserFilters />
      
      <UserTable users={users} />

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <a
            key={p}
            href={`/admin/users?page=${p}&search=${searchParams.search || ''}&role=${searchParams.role || ''}&status=${searchParams.status || ''}`}
            className={`px-4 py-2 rounded ${
              p === page
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {p}
          </a>
        ))}
      </div>
    </div>
  )
}
```

#### 5.2 Create User Table Component `client/src/components/admin/users/UserTable.tsx`
```typescript
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { UserActions } from './UserActions'

interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string
  status: string
  createdAt: Date
  lastLoginAt: Date | null
  _count: {
    roomsCreated: number
    gameResults: number
  }
}

interface UserTableProps {
  users: User[]
}

export function UserTable({ users }: UserTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const toggleSelect = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map((u) => u.id))
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-600'
      case 'ADMIN':
        return 'bg-purple-600'
      case 'MODERATOR':
        return 'bg-blue-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-600'
      case 'SUSPENDED':
        return 'bg-yellow-600'
      case 'BANNED':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length}
                onChange={toggleSelectAll}
                className="rounded"
              />
            </th>
            <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">
              User
            </th>
            <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">
              Role
            </th>
            <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">
              Status
            </th>
            <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">
              Stats
            </th>
            <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">
              Last Login
            </th>
            <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-750">
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => toggleSelect(user.id)}
                  className="rounded"
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || 'User'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white">
                      {user.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">{user.name || 'Unknown'}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded text-xs text-white ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded text-xs text-white ${getStatusBadgeColor(
                    user.status
                  )}`}
                >
                  {user.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-300 text-sm">
                <p>{user._count.gameResults} games</p>
                <p className="text-gray-500">{user._count.roomsCreated} rooms</p>
              </td>
              <td className="px-4 py-3 text-gray-400 text-sm">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString()
                  : 'Never'}
              </td>
              <td className="px-4 py-3">
                <UserActions user={user} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

#### 5.3 Create User Actions Component `client/src/components/admin/users/UserActions.tsx`
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreVerticalIcon,
  EyeIcon,
  BanIcon,
  ShieldIcon,
  TrashIcon,
} from 'lucide-react'

interface User {
  id: string
  name: string | null
  role: string
  status: string
}

interface UserActionsProps {
  user: User
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (action: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-700 rounded"
        disabled={isLoading}
      >
        <MoreVerticalIcon className="w-5 h-5 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg z-20 py-1">
            <a
              href={`/admin/users/${user.id}`}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-600"
            >
              <EyeIcon className="w-4 h-4" />
              View Details
            </a>
            
            {user.status === 'ACTIVE' ? (
              <button
                onClick={() => handleAction('suspend')}
                className="w-full flex items-center gap-2 px-4 py-2 text-yellow-400 hover:bg-gray-600"
              >
                <BanIcon className="w-4 h-4" />
                Suspend User
              </button>
            ) : (
              <button
                onClick={() => handleAction('activate')}
                className="w-full flex items-center gap-2 px-4 py-2 text-green-400 hover:bg-gray-600"
              >
                <ShieldIcon className="w-4 h-4" />
                Activate User
              </button>
            )}

            {user.status !== 'BANNED' && (
              <button
                onClick={() => handleAction('ban')}
                className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-gray-600"
              >
                <BanIcon className="w-4 h-4" />
                Ban User
              </button>
            )}

            <button
              onClick={() => handleAction('promote')}
              className="w-full flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-gray-600"
            >
              <ShieldIcon className="w-4 h-4" />
              Change Role
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

---

### Step 6: Admin API Routes

#### 6.1 Create `client/src/app/api/admin/users/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      gameStats: true,
      gameResults: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      roomsCreated: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { action, role, status } = body

  let updateData: any = {}

  switch (action) {
    case 'suspend':
      updateData.status = 'SUSPENDED'
      break
    case 'ban':
      updateData.status = 'BANNED'
      break
    case 'activate':
      updateData.status = 'ACTIVE'
      break
    case 'promote':
      if (role) updateData.role = role
      break
    default:
      if (role) updateData.role = role
      if (status) updateData.status = status
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
  })

  // Log admin action
  await prisma.adminLog.create({
    data: {
      actorId: session.user.id,
      action: action || 'update',
      targetType: 'USER',
      targetId: params.id,
      details: { previousStatus: user.status, newStatus: updateData.status },
    },
  })

  return NextResponse.json(user)
}
```

#### 6.2 Create Game Management API `client/src/app/api/admin/games/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const games = await prisma.gameConfig.findMany({
    orderBy: { gameId: 'asc' },
  })

  // Get stats for each game
  const gameStats = await prisma.gameResult.groupBy({
    by: ['gameId'],
    _count: true,
    _avg: {
      score: true,
    },
  })

  const gamesWithStats = games.map((game) => {
    const stats = gameStats.find((s) => s.gameId === game.gameId)
    return {
      ...game,
      totalGames: stats?._count || 0,
      avgScore: Math.round(stats?._avg.score || 0),
    }
  })

  return NextResponse.json(gamesWithStats)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()

  const game = await prisma.gameConfig.create({
    data: body,
  })

  await prisma.adminLog.create({
    data: {
      actorId: session.user.id,
      action: 'create_game',
      targetType: 'GAME',
      targetId: game.id,
      details: body,
    },
  })

  return NextResponse.json(game)
}
```

---

### Step 7: Prisma Client Setup

#### 7.1 Create `client/src/lib/prisma.ts`
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

---

## Files Created/Modified

```
server/prisma/
└── schema.prisma (updated with full schema)

client/src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   └── admin/
│   │       ├── users/
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       └── games/
│   │           └── route.ts
│   ├── auth/
│   │   └── signin/
│   │       └── page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   ├── games/
│   │   │   └── page.tsx
│   │   ├── rooms/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── announcements/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── logs/
│   │       └── page.tsx
│   └── layout.tsx (updated)
├── components/
│   ├── providers/
│   │   └── AuthProvider.tsx
│   └── admin/
│       ├── AdminSidebar.tsx
│       ├── AdminHeader.tsx
│       ├── StatsCards.tsx
│       ├── RecentActivity.tsx
│       ├── ActiveRooms.tsx
│       └── users/
│           ├── UserTable.tsx
│           ├── UserFilters.tsx
│           └── UserActions.tsx
├── hooks/
│   └── useAuth.ts
├── lib/
│   └── prisma.ts
└── types/
    └── next-auth.d.ts
```

---

## Admin Features Summary

| Feature | Description |
|---------|-------------|
| Dashboard | Overview stats, recent activity, active rooms |
| User Management | Search, filter, view, suspend, ban, change roles |
| Game Management | Enable/disable games, configure settings |
| Room Management | View active/past rooms, force close |
| Analytics | Usage graphs, popular games, peak times |
| Announcements | Create/manage site-wide announcements |
| Moderation | Review reports, manage content |
| Audit Log | Track all admin actions |
| Settings | Configure site-wide settings |

---

## Next Phase
Once all acceptance criteria are met, proceed to **Phase 3: Private Rooms**.
