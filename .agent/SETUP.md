# Mini Arcade - Project Setup Guide

## Overview

This document provides the complete setup instructions for the Mini Arcade project - a web-based arcade platform featuring Wordel, Flagel, Skribble-style drawing, and realtime Trivia games with private shareable rooms.

---

## Prerequisites

### Required Software
- **Node.js** v18.x or higher
- **pnpm** v8.x or higher (package manager)
- **PostgreSQL** v14.x or higher (database)
- **Git** (version control)

### Optional Tools
- **Docker Desktop** (recommended for containerized PostgreSQL on Windows)
- **VS Code** with recommended extensions

### VS Code Extensions (Recommended)
```
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- TypeScript Importer
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router), React 18, TypeScript |
| Styling | Tailwind CSS |
| Canvas | HTML5 Canvas API |
| Backend | Node.js, TypeScript, Express |
| Realtime | Socket.IO |
| Auth | NextAuth.js (Google/GitHub OAuth) |
| Database | PostgreSQL + Prisma ORM |
| Validation | Zod |
| Monorepo | pnpm workspaces + Turborepo |

---

## Project Structure

```
game/
├── .agent/                    # AI agent documentation
│   ├── SETUP.md              # This file
│   ├── plan.md               # Master plan
│   ├── phases/               # Phase implementation guides
│   │   ├── PHASE_00_MONOREPO.md
│   │   ├── PHASE_01_CONTRACTS.md
│   │   ├── PHASE_02_AUTH_ADMIN.md
│   │   ├── PHASE_03_ROOMS.md
│   │   ├── PHASE_04_GAME_RUNTIME.md
│   │   ├── PHASE_08_UI_SHELL.md
│   │   └── PHASE_09_HARDENING.md
│   └── games/                # Game-specific implementation guides
│       ├── GAME_SKRIBBLE.md
│       ├── GAME_TRIVIA.md
│       ├── GAME_WORDEL.md
│       └── GAME_FLAGEL.md
├── client/                   # Next.js frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities
│   │   └── styles/          # Global styles
│   ├── public/              # Static assets
│   └── package.json
├── server/                   # Node.js backend
│   ├── src/
│   │   ├── routes/          # HTTP routes
│   │   ├── socket/          # Socket.IO handlers
│   │   ├── games/           # Game runtimes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   └── lib/             # Utilities
│   ├── prisma/              # Database schema
│   └── package.json
├── shared/                   # Shared types & schemas
│   ├── src/
│   │   ├── types.ts         # TypeScript types
│   │   ├── schemas.ts       # Zod schemas
│   │   ├── socketEvents.ts  # Event constants
│   │   └── constants.ts     # Shared constants
│   └── package.json
├── turbo.json               # Turborepo config
├── pnpm-workspace.yaml      # pnpm workspaces
└── package.json             # Root package.json
```

---

## Initial Setup Commands

### 1. Install pnpm (if not installed)
```bash
npm install -g pnpm
```

### 2. Clone/Initialize Repository
```bash
cd C:\game
git init
```

### 3. Create Root Package Files
```bash
# Create pnpm-workspace.yaml
# Create turbo.json
# Create root package.json
```

### 4. Install Dependencies
```bash
pnpm install
```

### 5. Setup Database
```bash
# Using Docker Desktop + docker compose (recommended)
pnpm db:up

# Watch database logs if needed
pnpm db:logs

# Stop the database later
pnpm db:down

# OR install PostgreSQL locally and create database
createdb miniarcade
```

### 6. Configure Environment Variables
```bash
# Copy example env files
cp client/.env.example client/.env.local
cp server/.env.example server/.env
```

### 7. Generate Prisma Client
```bash
cd server && pnpm prisma generate && pnpm prisma db push
```

### 8. Start Development
```bash
# From root directory
pnpm dev
```

---

## Environment Variables

### Client (.env.local)
```env
# App
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Server (.env)
```env
# App
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/miniarcade

# Auth
JWT_SECRET=your-jwt-secret-here

# Admin
ADMIN_EMAILS=admin@example.com
```

### Docker Notes
- `docker-compose.yml` lives at the repo root and starts PostgreSQL on `localhost:5432`
- The default credentials match `server/.env.example`
- Data is stored in the named Docker volume `postgres_data`
- First-time local flow with Docker Desktop:
```bash
pnpm db:up
cp server/.env.example server/.env
cp db/.env.example db/.env
cd server && pnpm prisma generate && pnpm prisma db push
```

---

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services in dev mode |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run all tests |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:seed` | Seed database with sample data |

---

## OAuth Setup Instructions

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" > "Create Credentials" > "OAuth Client ID"
5. Configure consent screen
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Secret to `.env.local`

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to `.env.local`

---

## Database Schema Overview

### Core Tables
- **User** - User accounts and profiles
- **Account** - OAuth provider accounts (NextAuth)
- **Session** - User sessions (NextAuth)
- **VerificationToken** - Email verification tokens

### Game Tables
- **Room** - Game rooms with codes
- **RoomPlayer** - Players in rooms
- **GameStat** - Per-user per-game statistics
- **GameResult** - Individual game round results

### Admin Tables
- **AdminLog** - Admin action audit log
- **GameConfig** - Game configuration settings
- **SystemSetting** - Platform-wide settings

---

## Implementation Order

1. **Phase 0** - Monorepo + Baseline Tooling
2. **Phase 1** - Shared Contracts (Types + Zod)
3. **Phase 2** - Authentication + Admin Dashboard
4. **Phase 3** - Private Rooms System
5. **Phase 4** - Game Runtime Layer
6. **Game: Skribble** - Drawing game implementation
7. **Game: Trivia** - Quiz game implementation
8. **Game: Wordel** - Word guessing game
9. **Game: Flagel** - Flag guessing game
10. **Phase 8** - UI Shell + Polish
11. **Phase 9** - Hardening + Deployment

---

## Quality Checklist

### Before Starting Each Phase
- [ ] Read the phase documentation completely
- [ ] Understand acceptance criteria
- [ ] Check dependencies from previous phases

### Before Marking Phase Complete
- [ ] All acceptance criteria met
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Manual testing completed
- [ ] Edge cases handled

---

## Admin Dashboard Features (Phase 2)

The admin dashboard will include:

### User Management
- View all users with search/filter
- Ban/unban users
- View user activity and stats
- Reset user passwords
- Assign admin roles

### Game Management
- Enable/disable games
- Configure game settings (round time, max players, etc.)
- View game statistics and analytics
- Manage word lists and question banks

### Room Management
- View active rooms
- Force close rooms
- View room history
- Ban users from creating rooms

### Analytics Dashboard
- Active users graph
- Games played per day
- Popular games
- Peak usage times
- Error tracking

### System Settings
- Site maintenance mode
- Global announcements
- Feature flags
- Rate limit configuration

---

## Notes

- Each phase file contains detailed implementation steps
- Game files contain complete game logic and specifications
- Follow phases in order for best results
- Test thoroughly before moving to next phase
