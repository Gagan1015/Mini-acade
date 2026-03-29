# Phase 0: Monorepo + Baseline Tooling

## Overview
Set up the foundational monorepo structure with pnpm workspaces and Turborepo. This phase creates the scaffolding for all future development.

**Status:** To Implement  
**Priority:** Critical (Foundation)  
**Estimated Time:** 2-3 hours

---

## Goals
- Create monorepo structure with `client`, `server`, and `shared` packages
- Configure TypeScript across all packages
- Set up ESLint and Prettier
- Configure development scripts
- Ensure cross-package imports work correctly

---

## Acceptance Criteria
- [ ] `pnpm dev` starts both `client` and `server` without errors
- [ ] `client` can import from `shared`
- [ ] `server` can import from `shared`
- [ ] TypeScript compiles without errors
- [ ] ESLint runs without errors
- [ ] Hot reload works in development

---

## Implementation Steps

### Step 1: Create Root Configuration Files

#### 1.1 Create `package.json` (root)
```json
{
  "name": "mini-arcade",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules",
    "db:push": "pnpm --filter server db:push",
    "db:studio": "pnpm --filter server db:studio",
    "db:seed": "pnpm --filter server db:seed"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  },
  "packageManager": "pnpm@8.15.0",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### 1.2 Create `pnpm-workspace.yaml`
```yaml
packages:
  - "client"
  - "server"
  - "shared"
```

#### 1.3 Create `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

#### 1.4 Create `tsconfig.base.json` (root)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

#### 1.5 Create `.gitignore`
```gitignore
# Dependencies
node_modules
.pnpm-store

# Build outputs
dist
.next
out

# Environment files
.env
.env.local
.env.*.local
!.env.example

# IDE
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
.idea

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Turbo
.turbo

# Prisma
prisma/migrations/**/migration_lock.toml

# Testing
coverage
```

#### 1.6 Create `.prettierrc`
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

#### 1.7 Create `.eslintrc.js` (root)
```javascript
module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: ['node_modules', 'dist', '.next', '.turbo'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
}
```

---

### Step 2: Create Shared Package

#### 2.1 Create `shared/package.json`
```json
{
  "name": "@mini-arcade/shared",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "lint": "eslint src --ext .ts"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "typescript": "^5.3.0"
  },
  "dependencies": {
    "zod": "^3.22.0"
  }
}
```

#### 2.2 Create `shared/tsconfig.json`
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 2.3 Create `shared/src/index.ts`
```typescript
// Types
export * from './types'

// Schemas
export * from './schemas'

// Socket Events
export * from './socketEvents'

// Constants
export * from './constants'
```

#### 2.4 Create `shared/src/types.ts`
```typescript
// Placeholder - will be expanded in Phase 1
export type UserId = string
export type RoomCode = string
export type GameId = 'skribble' | 'trivia' | 'wordel' | 'flagel'

export interface User {
  id: UserId
  name: string
  email: string
  image?: string
}

export interface Room {
  code: RoomCode
  gameId: GameId
  hostId: UserId
  status: 'waiting' | 'playing' | 'finished'
  createdAt: Date
}
```

#### 2.5 Create `shared/src/schemas.ts`
```typescript
import { z } from 'zod'

// Placeholder - will be expanded in Phase 1
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  image: z.string().optional(),
})

export const roomCodeSchema = z.string().length(6).regex(/^[A-Z0-9]+$/)

export const gameIdSchema = z.enum(['skribble', 'trivia', 'wordel', 'flagel'])
```

#### 2.6 Create `shared/src/socketEvents.ts`
```typescript
// Placeholder - will be expanded in Phase 1
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Room events
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_PRESENCE: 'room:presence',
  ROOM_ERROR: 'room:error',
} as const

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS]
```

#### 2.7 Create `shared/src/constants.ts`
```typescript
// Game configuration
export const GAMES = {
  skribble: {
    id: 'skribble',
    name: 'Skribble',
    description: 'Draw and guess with friends',
    minPlayers: 2,
    maxPlayers: 8,
    icon: 'pencil',
  },
  trivia: {
    id: 'trivia',
    name: 'Trivia',
    description: 'Test your knowledge',
    minPlayers: 1,
    maxPlayers: 10,
    icon: 'brain',
  },
  wordel: {
    id: 'wordel',
    name: 'Wordel',
    description: 'Guess the word in 6 tries',
    minPlayers: 1,
    maxPlayers: 4,
    icon: 'letter',
  },
  flagel: {
    id: 'flagel',
    name: 'Flagel',
    description: 'Guess the country by its flag',
    minPlayers: 1,
    maxPlayers: 4,
    icon: 'flag',
  },
} as const

// Room configuration
export const ROOM_CONFIG = {
  codeLength: 6,
  maxPlayersDefault: 8,
  disconnectGracePeriod: 10000, // 10 seconds
} as const
```

---

### Step 3: Create Server Package

#### 3.1 Create `server/package.json`
```json
{
  "name": "@mini-arcade/server",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "clean": "rm -rf dist",
    "lint": "eslint src --ext .ts",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@mini-arcade/shared": "workspace:*",
    "@prisma/client": "^5.10.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.18.0",
    "socket.io": "^4.7.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "prisma": "^5.10.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

#### 3.2 Create `server/tsconfig.json`
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "CommonJS",
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 3.3 Create `server/src/index.ts`
```typescript
import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

// Start server
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
```

#### 3.4 Create `server/.env.example`
```env
# Server
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/miniarcade

# Auth
JWT_SECRET=your-jwt-secret-change-in-production

# Admin
ADMIN_EMAILS=admin@example.com
```

#### 3.5 Create `server/prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Will be expanded in Phase 2
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

### Step 4: Create Client Package

#### 4.1 Create Next.js App
```bash
cd client
pnpm create next-app . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

#### 4.2 Update `client/package.json`
```json
{
  "name": "@mini-arcade/client",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "clean": "rm -rf .next out"
  },
  "dependencies": {
    "@mini-arcade/shared": "workspace:*",
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.7.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.1.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0"
  }
}
```

#### 4.3 Update `client/tsconfig.json`
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "ES2022"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    },
    "incremental": true,
    "noEmit": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### 4.4 Create `client/.env.example`
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-change-in-production

# OAuth (to be configured in Phase 2)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

#### 4.5 Create `client/src/app/page.tsx`
```tsx
import { GAMES } from '@mini-arcade/shared'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-white text-center mb-12">
          Mini Arcade
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(GAMES).map((game) => (
            <div
              key={game.id}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <h2 className="text-2xl font-semibold text-white mb-2">
                {game.name}
              </h2>
              <p className="text-white/70">
                {game.description}
              </p>
              <p className="text-white/50 text-sm mt-4">
                {game.minPlayers}-{game.maxPlayers} players
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
```

---

### Step 5: Initialize and Test

#### 5.1 Install All Dependencies
```bash
# From root directory
pnpm install
```

#### 5.2 Build Shared Package First
```bash
pnpm --filter @mini-arcade/shared build
```

#### 5.3 Start Development
```bash
pnpm dev
```

#### 5.4 Verify
- Client should be running at http://localhost:3000
- Server should be running at http://localhost:3001
- Health check at http://localhost:3001/health should return JSON
- Client page should show game cards (imported from shared)

---

## Troubleshooting

### "Cannot find module '@mini-arcade/shared'"
- Ensure shared package is built: `pnpm --filter @mini-arcade/shared build`
- Check that workspace dependency is correct in package.json

### TypeScript Errors in IDE
- Run `pnpm install` to ensure all dependencies are installed
- Restart TypeScript server in VS Code (Cmd/Ctrl + Shift + P > "TypeScript: Restart TS Server")

### Port Already in Use
- Change PORT in server/.env
- Check for running processes: `netstat -ano | findstr :3001` (Windows)

---

## Files Created in This Phase

```
C:\game\
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── shared/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── types.ts
│       ├── schemas.ts
│       ├── socketEvents.ts
│       └── constants.ts
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       └── index.ts
└── client/
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    └── src/
        └── app/
            └── page.tsx
```

---

## Next Phase
Once all acceptance criteria are met, proceed to **Phase 1: Shared Contracts**.
