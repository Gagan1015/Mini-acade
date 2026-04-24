---
name: mini-arcade-stack
overview: Propose a web-focused mini-arcade tech stack and an MVP build plan for Wordel, Flagel, Skribble-style drawing, and a realtime Trivia game with private shareable rooms.
todos:
  - id: phase0-monorepo
    content: Scaffold monorepo (`client`, `server`, `shared`) + baseline tooling (TS, lint, env, dev scripts).
    status: completed
  - id: phase1-contracts
    content: Create shared contracts in `shared/` (Socket event types + Zod schemas + shared constants).
    status: completed
  - id: phase2-auth
    content: Add accounts/login (`NextAuth`) + Prisma models for users + game stats.
    status: in_progress
  - id: phase3-rooms
    content: Implement private rooms (HTTP to create + Socket to join/leave, room code validation, presence).
    status: completed
  - id: phase4-game-runtime
    content: Add a server game-runtime layer (per-room state machine + event dispatch).
    status: completed
  - id: phase5-skribble
    content: Implement Skribble-style drawing (Canvas strokes, throttling/batching, join sync, round flow).
    status: completed
  - id: phase6-trivia
    content: Implement realtime Trivia (server-controlled timer, answer submission, scoring, round end).
    status: completed
  - id: phase7-wordel-flagel
    content: Implement Wordel + Flagel (server-validated guesses, minimal realtime, persistence).
    status: completed
  - id: phase8-ui-shell
    content: Build UI shell (arcade landing, lobby, create/join room, game screens, basic stats).
    status: completed
  - id: phase9-hardening-deploy
    content: Add hardening (validation/rate limits/reconnect) + deploy `client` and `server`.
    status: in_progress
isProject: false
---

## Current implementation status

- `phase2-auth` is scaffolded but not fully finished:
  - `NextAuth` route exists
  - Prisma schema includes `User`, `Room`, `RoomPlayer`, `GameStat`, and `GameResult`
  - OAuth env configuration and result persistence wiring are still pending
- `phase9-hardening-deploy` is partially complete:
  - shared Zod validation is in place for the active socket contract
  - stroke batching is rate-limited
  - reconnect-aware room rejoin now keeps player identity stable with a grace period
  - deployment config and hosted environments are still pending

## Planned upgrade: AI-powered Trivia

- Add Gemini 2.5 Flash question generation for Trivia with strict server-side validation and fallback behavior.
- Keep realtime round/timer/scoring logic server-authoritative and unchanged.
- Implementation details: `.agent/games/GAME_TRIVIA.md`.

## Recommended tech stack (web, local/private realtime)

- **Frontend:** `Next.js` (React) + `TypeScript`
- **Styling:** `Tailwind CSS` (fast iteration) or `CSS Modules` (if you prefer no tooling)
- **Canvas drawing (Skribble):** HTML5 **Canvas API** (optionally with a lightweight helper like `roughjs` only if you need it)
- **Backend:** `Node.js` + `TypeScript`
- **Realtime networking (Skribble + Trivia):** `Socket.IO` (rooms, events, reconnection)
- **Auth/Accounts:** `NextAuth.js` (or OAuth via Google/GitHub) with database persistence
- **Database:** `PostgreSQL` + `Prisma ORM`
- **Validation / types:** `zod` for runtime validation and shared request/response shapes
- **Monorepo (optional but good):** `pnpm` + `Turborepo` with packages like `shared`, `server`, `client`

This matches your existing direction in `[c:\game\idea_01.md](c:\game\idea_01.md)` (React/TypeScript/Canvas and Socket.IO realtime).

## MVP architecture

- **Game router / matchmaker (private rooms):**
  - Create room + generate a `roomCode` (shareable link/code)
  - Authoritative server state per room for realtime games
- **Game modules (server + client):**
  - Each game exposes:
    - deterministic “question/round generation” (server chooses seed/state)
    - scoring rules
    - event schema for realtime updates
- **Shared types:** Put event names, DTOs, and game state types in `shared/` so client and server stay compatible.

## Data flow (realtime games)

```mermaid
flowchart LR
  User[User Browser] -->|joinRoom(roomCode)| Server[Socket.IO Server]
  Server --> Room[Room State: server-authoritative]
  User -->|Skribble input| Room
  Room -->|broadcast draw strokes| User
  User -->|Trivia answers| Room
  Room -->|broadcast round results| User
```

## Detailed phase-by-phase implementation roadmap

### Phase 0: Monorepo + baseline tooling

Goal: one working dev setup and a place for shared, strongly-typed contracts.
Deliverables:

- `client/` (Next.js + React + TS)
- `server/` (Node + TS + Socket.IO)
- `shared/` (types + Zod schemas + constants)
  Acceptance criteria:
- `pnpm dev` starts both `client` and `server` without crashing.
- `client` can import from `shared` and `server` can import from `shared`.

### Phase 1: Shared contracts (types + Zod validation)

Goal: prevent “event name mismatch” and “payload shape mismatch”.
Deliverables:

- In `shared/`:
  - `socketEvents.ts` (event name constants)
  - `schemas.ts` (Zod payload schemas per event)
  - `types.ts` (inferred types from Zod)
- A server helper like `parseSocketPayload(eventName, payload)` that:
  - validates payload against Zod
  - returns typed payload for the game runtime
    Acceptance criteria:
- If a client sends invalid payloads, the server rejects them and does not update room state.

### Phase 2: Accounts/login + persistence

Goal: players have identity and results can be stored.
Deliverables:

- Auth with `NextAuth` (MVP: Google/GitHub)
- Prisma models (outline):
  - `User`
  - `GameStat` (plays/wins per game)
  - `Room` (roomCode, createdBy, gameId, status)
  - `RoomPlayer` (roomCode, userId, joinedAt)
  - `GameResult` (roomCode, userId, gameId, scoring summary)
    Acceptance criteria:
- Logged-in users can create and join rooms.
- After a game round completes, `GameStat` updates.

### Phase 3: Private rooms (shareable room code)

Goal: friends can play together without public matchmaking.
Deliverables:

- HTTP endpoint to create a room:
  - `POST /api/rooms` with `{ gameId }` -> `{ roomCode, joinUrl }`
- Socket events:
  - `room:join` with `{ roomCode }`
  - `room:leave`
  - `room:presence` broadcast (players list + who is host)
    Server rules:
- RoomCode must exist and must match the expected gameId (or allow “pending” state until selected).
- On disconnect: remove player after a short grace period (ex: 5–10s).
  Acceptance criteria:
- Two browsers using the same `roomCode` show the same player list.

### Phase 4: Server game-runtime layer (state machine)

Goal: one consistent pattern to implement all games.
Deliverables:

- `GameRuntime` interface (per room):
  - `onJoin(player)`
  - `onLeave(player)`
  - `onClientEvent(eventName, payload)`
  - `getSnapshot()` (optional, used for join sync)
  - `finalizeRound()` (persist results)
- A `RoomManager`:
  - creates room runtime for a specific `gameId`
  - routes Socket.IO events to the correct runtime
    Acceptance criteria:
- Switching through multiple rounds in one room doesn’t leak state between rounds.

### Phase 5: Skribble-style drawing (Canvas + realtime)

Goal: drawings sync reliably and guesses are validated server-side.
Deliverables (server):

- Events (names may vary, but keep contract in `shared/`):
  - `draw:strokeBatch` (client -> server, throttled/batched)
  - `draw:requestSync` (client -> server, for joiners)
  - `draw:sync` (server -> client, canvas snapshot or stroke history)
  - `draw:guess` (client -> server, validated)
  - `draw:roundStarted` / `draw:roundEnded`
    Deliverables (client):
- Canvas drawing with:
  - DPR-aware scaling
  - stroke batching (ex: every 30–60ms)
  - local immediate rendering + remote stroke rendering
    Throttling rules:
- Per-user max stroke batches per second.
- Clamp stroke coordinates to canvas bounds.
  Acceptance criteria:
- A new joiner receives a consistent canvas state quickly (within ~1–2s).

### Phase 6: Trivia realtime quiz

Goal: all players share the same question + timer; scoring is consistent.
Deliverables (server):

- `trivia:startRound` includes:
  - `roundId`, `question`, `answers[]`, `correctAnswerId` (or store server-side and don’t broadcast)
  - `roundEndsAt` (timestamp)
- `trivia:answer` counts only once per player per round.
- `trivia:roundEnded` includes correct answer + per-player scoring deltas.
  Deliverables (client):
- Countdown based on `roundEndsAt` (avoid spam ticking)
- Lock answer after submit
  Acceptance criteria:
- Late answers after timer end do not score.

### Phase 7: Wordel + Flagel (server-validated guess games)

Goal: minimal realtime where it matters; still fair and persistent.
Deliverables (shared pattern):

- Server sends `wordel:roundStarted` / `flagel:roundStarted`.
- Client submits guesses (`*:submitGuess`).
- Server sends `*:guessResult` only to the submitting player (or broadcast feedback if you want shared competition).
- Server sends `*:roundEnded` and persists `GameResult`.
  Flagel MVP decision (important):
- Use `Unicode flag emojis` for the first MVP (no external asset licensing).
  Acceptance criteria:
- Guess outcomes are determined by the server and correctly persisted.

### Phase 8: UI arcade shell + room UX

Goal: a clear user journey.
Routes to implement:

- `/` landing with game cards
- `/lobby` create room + join by code
- `/rooms/[roomCode]` showing status + start button for host
- `/rooms/[roomCode]/[gameId]` game screen
  Acceptance criteria:
- Create room -> share code -> two users see the correct game screen and can play.

### Phase 9: Hardening + deployment

Deliverables:

- Validation: all Socket.IO events validate payloads with Zod.
- Rate limits: stroke batching events and answer submissions.
- Reconnect: re-join room on reconnect and re-send snapshot when needed.
- Deployment:
  - `client` on Vercel
  - `server` + WebSocket on Render/Fly/Railway
    Acceptance criteria:
- A deployed build supports room join and reconnection without breaking the round.

## MVP scope notes (important)

- Since you chose **clones**, you should ensure each game is **implemented by you** (or uses clearly permissive/open datasets like word lists).
- Avoid copying proprietary word/level logic from existing products.

## Two decisions before we start implementing

1. `Wordel` / `Flagel` multiplayer mode:

- A) each player plays their own board in parallel (simpler MVP)
- B) shared turn-based competition (more complex server state)

2. `Flagel` flag source:

- A) Unicode flag emojis (fast MVP, no external images)
- B) open-licensed flag images (more accurate visuals, but needs dataset selection)
