# AI Agent Guidelines

## Overview
This document defines which AI models should be used for different parts of the Mini Arcade project, along with their responsibilities and collaboration protocols.

---

## Model Assignments

### Backend Development: GPT-5.4

**Primary Responsibilities:**
- Server-side logic and architecture
- Database schema design and Prisma models
- API routes and endpoints
- Socket.IO event handlers
- Game runtime logic (server-side)
- Authentication and authorization
- Rate limiting and validation
- Database queries and optimization
- Server deployment configuration

**Files & Directories:**
```
server/
├── src/
│   ├── games/           ✅ GPT-5.4
│   ├── lib/             ✅ GPT-5.4
│   ├── middleware/      ✅ GPT-5.4
│   ├── routes/          ✅ GPT-5.4
│   ├── services/        ✅ GPT-5.4
│   ├── socket/          ✅ GPT-5.4
│   └── index.ts         ✅ GPT-5.4
├── prisma/
│   └── schema.prisma    ✅ GPT-5.4
└── Dockerfile           ✅ GPT-5.4

shared/
├── src/
│   ├── schemas.ts       ✅ GPT-5.4
│   ├── types.ts         ✅ GPT-5.4
│   ├── constants.ts     ✅ GPT-5.4
│   └── validation.ts    ✅ GPT-5.4
```

---

### Frontend Development: Opus 4.6

**Primary Responsibilities:**
- UI/UX design and implementation
- React components
- Page layouts and routing
- Styling with Tailwind CSS
- Animations with Motion (Framer Motion)
- SVG animations and micro-interactions
- Responsive design
- Client-side state management
- Design system implementation
- Accessibility (a11y)

**Files & Directories:**
```
client/
├── src/
│   ├── app/             ✅ Opus 4.6
│   ├── components/      ✅ Opus 4.6
│   ├── hooks/           ✅ Opus 4.6 (UI hooks) / GPT-5.4 (socket hooks)
│   ├── lib/             ✅ Opus 4.6
│   └── styles/          ✅ Opus 4.6
├── public/              ✅ Opus 4.6
└── tailwind.config.js   ✅ Opus 4.6
```

---

## Collaboration Rules

### Rule 1: GPT-5.4 Must Not Do Major UI/UX Work

GPT-5.4 should **NOT** work on:
- React component styling
- CSS/Tailwind classes
- Layout design
- Animation implementation
- Visual design decisions
- Color choices
- Typography styling
- Responsive breakpoints
- UI micro-interactions

**When GPT-5.4 encounters UI work, it MUST:**
1. Stop and acknowledge the UI requirement
2. Request the user to switch to Opus 4.6
3. Provide context about what backend work was completed
4. List the UI requirements that need to be addressed

**Example response from GPT-5.4:**
```
I've completed the backend API endpoint for fetching user stats.

However, I notice this task requires UI implementation:
- Displaying the stats in a dashboard card
- Adding animations for score updates
- Styling the leaderboard component

Please use Opus 4.6 for this UI work. Here's the context:
- API endpoint: GET /api/users/:id/stats
- Response shape: { gamesPlayed, gamesWon, totalScore, highScores }
- The component should be placed in: client/src/components/stats/
```

---

### Rule 2: Opus 4.6 Handles All Visual Work

Opus 4.6 is responsible for:
- Implementing the design system (see `DESIGN_SYSTEM.md`)
- Creating visually polished components
- Ensuring consistent spacing and typography
- Implementing Motion animations
- Creating SVG path animations
- Making the UI responsive
- Handling dark/light theme styling

---

### Rule 3: Use Skills When Needed

Both agents should use available skills for specialized tasks:

**Frontend Skills (Opus 4.6 should use):**
| Skill | When to Use |
|-------|-------------|
| `frontend-design` | Building new UI components, pages, or features |
| `animate` | Adding Motion animations and micro-interactions |
| `polish` | Final quality pass for alignment, spacing, consistency |
| `typeset` | Typography fixes and improvements |
| `colorize` | Adding strategic color to monochromatic features |
| `arrange` | Improving layout and visual hierarchy |
| `adapt` | Making designs responsive across devices |
| `audit` | Comprehensive UI quality audit |
| `critique` | Evaluating design effectiveness |
| `harden` | Error handling, i18n, edge cases in UI |

**Backend Skills (GPT-5.4 should use):**
| Skill | When to Use |
|-------|-------------|
| `optimize` | Performance improvements (if applicable to backend) |
| `harden` | Security hardening, input validation, error handling |

**Skill Invocation:**
```
When a task matches a skill's description, invoke it:

/skill frontend-design   # For building new UI
/skill animate           # For adding animations
/skill polish            # For final quality pass
```

---

## Handoff Protocol

### Backend → Frontend Handoff

When GPT-5.4 completes backend work that needs UI:

1. **Document the API/Data Shape:**
```typescript
// Example: Stats API Response
interface UserStats {
  gamesPlayed: number
  gamesWon: number
  totalScore: number
  winRate: number
  recentGames: GameResult[]
}
```

2. **Specify Socket Events (if applicable):**
```typescript
// Events that frontend needs to handle
socket.on('game:scoreUpdate', { playerId, newScore, delta })
socket.on('game:roundEnd', { results, nextRoundIn })
```

3. **Note Any Constraints:**
```
- Data refreshes every 5 seconds
- Maximum 10 recent games returned
- Scores are integers (no decimals)
```

4. **Request Opus 4.6:**
```
Please switch to Opus 4.6 to implement the UI for this feature.
Reference: DESIGN_SYSTEM.md for styling guidelines.
Use the `frontend-design` skill for component creation.
```

---

### Frontend → Backend Handoff

When Opus 4.6 needs backend functionality:

1. **Specify the Required Endpoint/Event:**
```
Need: POST /api/rooms/:roomCode/kick
Body: { playerId: string }
Response: { success: boolean }
```

2. **Describe the Use Case:**
```
The host clicks "Kick" button on a player card.
UI shows confirmation modal, then calls this endpoint.
On success, player is removed from the room.
```

3. **Request GPT-5.4:**
```
Please switch to GPT-5.4 to implement this backend endpoint.
The UI is ready and waiting for this functionality.
```

---

## Shared Responsibilities

Some areas require coordination:

| Area | GPT-5.4 | Opus 4.6 |
|------|---------|----------|
| Socket hooks | Event handling logic | Hook API design, usage in components |
| API types | Define response shapes | Use types in components |
| Validation schemas | Define Zod schemas | Use for client-side validation |
| Error handling | Return proper error codes | Display user-friendly messages |
| Game state | Manage authoritative state | Render state visually |

---

## File Ownership Summary

```
┌─────────────────────────────────────────────────────────────┐
│                      GPT-5.4 DOMAIN                         │
├─────────────────────────────────────────────────────────────┤
│  server/          - All server code                         │
│  shared/          - Types, schemas, validation              │
│  prisma/          - Database schema                         │
│  scripts/         - Build/deploy scripts                    │
│  *.config.js      - Server configs                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      OPUS 4.6 DOMAIN                        │
├─────────────────────────────────────────────────────────────┤
│  client/src/app/        - Pages and routing                 │
│  client/src/components/ - React components                  │
│  client/src/styles/     - Global styles                     │
│  client/public/         - Static assets                     │
│  tailwind.config.js     - Tailwind configuration            │
│  DESIGN_SYSTEM.md       - Design guidelines                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SHARED / EITHER                          │
├─────────────────────────────────────────────────────────────┤
│  client/src/hooks/      - GPT-5.4 for logic, Opus for UI    │
│  client/src/lib/        - Depends on content                │
│  README.md              - Either                            │
│  .env files             - Either                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Card

### For GPT-5.4:
```
✅ DO:
- Write server logic
- Design database schemas
- Implement API routes
- Handle socket events
- Write validation logic
- Optimize queries

❌ DON'T:
- Style React components
- Choose colors/fonts
- Implement animations
- Design layouts
- Make visual decisions

🔄 HANDOFF:
"This requires UI work. Please use Opus 4.6 with the 
frontend-design skill. Here's the data shape: {...}"
```

### For Opus 4.6:
```
✅ DO:
- Build React components
- Style with Tailwind
- Implement animations
- Create responsive layouts
- Follow DESIGN_SYSTEM.md
- Use Motion for interactions

❌ DON'T:
- Write server logic
- Design database schemas
- Implement API routes

🔄 HANDOFF:
"This requires backend work. Please use GPT-5.4.
I need this endpoint: POST /api/... with this shape: {...}"
```

---

## Skill Usage Reminders

**Before starting UI work, Opus 4.6 should consider:**
```
- Am I building a new component? → /skill frontend-design
- Am I adding animations? → /skill animate  
- Am I doing a final polish? → /skill polish
- Am I fixing typography? → /skill typeset
- Am I improving layout? → /skill arrange
```

**Before starting backend work, GPT-5.4 should consider:**
```
- Am I adding security measures? → /skill harden
- Am I optimizing performance? → /skill optimize
```

---

## Example Workflow

### Task: "Add a leaderboard to the game screen"

**Step 1: GPT-5.4 creates the backend**
```
1. Create GET /api/rooms/:roomCode/leaderboard endpoint
2. Add socket event 'game:leaderboardUpdate'
3. Define LeaderboardEntry type in shared/
4. Handoff to Opus 4.6 for UI
```

**Step 2: Opus 4.6 creates the frontend**
```
1. Load skill: /skill frontend-design
2. Create Leaderboard component following DESIGN_SYSTEM.md
3. Add Motion animations for rank changes
4. Use SVG for rank badges
5. Load skill: /skill polish for final pass
```

---

## Summary

| Model | Domain | Key Rule |
|-------|--------|----------|
| **GPT-5.4** | Backend | Must NOT do UI work. Handoff to Opus 4.6. |
| **Opus 4.6** | Frontend | Use skills. Follow DESIGN_SYSTEM.md. |

Both models should use skills when tasks match skill descriptions for better, more specialized output.
