# Game Implementation: AI-Powered Trivia (Gemini 2.5 Flash)

## Overview

Upgrade Trivia from static fallback questions to dynamic AI-generated rounds powered by Gemini 2.5 Flash.

This plan is aligned with the current codebase where Trivia already runs in real-time via:

- `server/src/games/trivia/TriviaRuntime.ts`
- `server/src/games/trivia/questionService.ts`
- shared socket contracts in `shared/src/socketEvents.ts`, `shared/src/schemas.ts`, and `shared/src/types.ts`

## Goals

- Generate high-quality multiple-choice questions at runtime.
- Make Trivia feel broad, replayable, and approachable through popular categories and interest presets.
- Let hosts choose the kind of quiz they want without adding setup friction.
- Build a growing database-backed question pool so generated questions improve the product over time.
- Keep server-authoritative scoring and timing unchanged.
- Guarantee safe/valid question payloads through strict schema validation.
- Add resilient fallback behavior when AI generation fails.
- Control cost and latency for multiplayer rooms.

## Non-Goals (Phase 1)

- No client-side Gemini calls.
- No free-form AI chat in game rooms.
- No removal of existing fallback questions.
- No fully custom user-written prompts in public rooms until moderation and abuse controls exist.

---

## Product Direction: Polished Trivia Experience

Trivia should feel like a fast party quiz, not a generic question feed. The standout feature is a broad "interests" system: players can jump into a quick mixed match, or hosts can steer the room toward familiar, popular categories.

### Category and interest model

Use a small set of polished top-level categories first, then map them to many tags internally.

Recommended launch categories:

- `Mixed`: balanced blend across all safe topics.
- `Movies & TV`: actors, plots, streaming hits, classics, animation.
- `Music`: artists, albums, lyrics trivia without quoting long lyrics, concerts, genres.
- `Sports`: cricket, football/soccer, NBA, tennis, Olympics, esports.
- `Gaming`: popular games, characters, studios, esports, gaming history.
- `Science & Nature`: space, animals, physics, biology, environment.
- `History & Culture`: world history, monuments, festivals, inventions, mythology.
- `Geography & Travel`: countries, capitals, landmarks, flags, food, languages.
- `Internet & Tech`: apps, gadgets, startups, memes, AI, web culture.
- `Food & Lifestyle`: cuisine, brands, health basics, everyday culture.

Internal tag examples:

- `marvel`, `bollywood`, `k-pop`, `cricket`, `premier-league`, `minecraft`, `space`, `ancient-history`, `world-capitals`, `internet-culture`

Rules:

- Keep categories stable for UI and analytics.
- Let AI use tags for variety, but persist both category and tags.
- Default to `Mixed` so creating a room remains one click.
- Avoid categories that are too narrow for multiplayer unless they are tags inside a broader category.

### Host controls

Add lightweight room settings for Trivia:

- Category: segmented/category grid with `Mixed` selected by default.
- Difficulty: `Chill`, `Classic`, `Expert`, mapped internally to `easy | medium | hard`.
- Question style: `Balanced`, `Fast facts`, `Pop culture`, `Brainy` as optional presets after the core flow works.

Avoid long setup forms. The lobby should show compact chips like:

- `Mixed`
- `Classic`
- `8 rounds`
- `20 sec`

### In-game polish

Trivia should visually communicate momentum:

- Show category and difficulty as small chips above the question.
- Add a round progress indicator: `Round 3 / 8`.
- Animate answer lock-in with a subtle pressed state.
- During reveal, color correct answer green and incorrect selected answer red.
- Show a short explanation after reveal when available.
- Show fastest correct player for the round.
- Add streak feedback: `3 correct streak`.
- Use a scoreboard that updates after each reveal, not only at game end.

The UI should stay readable and competitive. No long paragraphs during the timed answer phase.

### What makes it stand out

- Fresh questions are generated and then curated into the app's own pool.
- Popular interests keep rounds culturally relevant.
- Cached DB questions make games instant after warm-up.
- Explanations make wrong answers feel useful instead of punishing.
- Room-level category choice makes it social: players can create "Gaming night", "Cricket quiz", or "Movie battle" rooms.

---

## Target Architecture

### Current baseline

- `TriviaRuntime` asks `QuestionService` for the next question.
- `QuestionService` currently returns from static `FALLBACK_QUESTIONS`.

### Proposed flow

1. Host creates a Trivia room with category and difficulty settings, defaulting to `Mixed` and `Classic`.
2. `TriviaRuntime.startNextRound()` requests one question from `QuestionService` with room settings and recently used fingerprints.
3. `QuestionService` first checks the database for an approved, unused question matching category/difficulty.
4. If the pool is low or stale, `QuestionService` attempts AI generation via a new `GeminiTriviaProvider`.
5. Provider returns strict JSON matching shared Trivia shape plus `correctId`, category, difficulty, tags, and explanation.
6. Service validates, normalizes, hashes, and stores accepted AI questions.
7. On any failure, service falls back to approved DB questions, then existing local questions.

Preferred strategy:

```text
approved DB question -> AI generate and save -> static fallback
```

This makes runtime fast, lowers cost, and slowly turns AI output into a durable product asset.

---

## Environment and Secrets

Add to server environment:

- `GEMINI_API_KEY=`
- `GEMINI_MODEL=gemini-2.5-flash`
- `TRIVIA_AI_ENABLED=true`
- `TRIVIA_AI_TIMEOUT_MS=3500`
- `TRIVIA_AI_MAX_RETRIES=1`

Rules:

- API key is server-only and never exposed to client bundles.
- Startup warning if AI is enabled but key is missing.

---

## Data Contract for AI Questions

### Internal provider response contract

```ts
type AIGeneratedTriviaQuestion = {
  question: string
  answers: Array<{ id: 'a' | 'b' | 'c' | 'd'; text: string }>
  correctId: 'a' | 'b' | 'c' | 'd'
  category:
    | 'Mixed'
    | 'Movies & TV'
    | 'Music'
    | 'Sports'
    | 'Gaming'
    | 'Science & Nature'
    | 'History & Culture'
    | 'Geography & Travel'
    | 'Internet & Tech'
    | 'Food & Lifestyle'
  difficulty: 'easy' | 'medium' | 'hard'
  explanation: string
  tags?: string[]
}
```

### Validation requirements

- Exactly 4 unique answers.
- `correctId` must reference one of the returned answer ids.
- No empty/duplicate answer text.
- Question length and answer length bounded (anti-abuse, anti-token bloat).
- Optional profanity/safety filter before accepting question.
- Category must be from the allowlist.
- Explanation should be one sentence, max 180 characters.
- Tags are lowercase slugs and capped at 8.
- Question must be factual and answerable without "current today" ambiguity unless the source date is included.

---

## Updated Implementation Plan

### Step 1: Shared schema hardening

Files:

- `shared/src/schemas.ts`
- `shared/src/types.ts`

Tasks:

- Add/confirm stricter Trivia validators for category/difficulty/answer structure.
- Add `TriviaDifficulty` enum-like schema if not present.
- Add `TriviaCategory` enum-like schema.
- Add optional `explanation` and `tags` to the shared question shape.
- Ensure runtime can reject malformed AI payloads before broadcast.

Acceptance:

- Invalid AI JSON fails fast and cannot reach clients.

### Step 2: Gemini provider in server

Files:

- `server/src/lib/gemini.ts` (new)
- `server/src/games/trivia/providers/GeminiTriviaProvider.ts` (new)

Tasks:

- Add a small Gemini client wrapper using `gemini-2.5-flash`.
- Implement `generateQuestion(options)` with timeout + abort support.
- Force JSON-only output in prompt and parse defensively.
- Add single retry with tighter prompt if first parse fails.

Acceptance:

- Provider returns valid question object or a typed error.

### Step 3: Integrate provider into question service

Files:

- `server/src/games/trivia/questionService.ts`

Tasks:

- Keep existing fallback question bank.
- Add generation strategy:
  1. approved DB candidate matching category/difficulty
  2. AI candidate if DB has no good match or needs replenishment
  3. validate + normalize
  4. dedupe against used question fingerprints
  5. save accepted candidate
  6. fallback local question on failure
- Add in-memory per-room dedupe to avoid repeated question stems.

Acceptance:

- Trivia still works if Gemini is down or disabled.
- Category and difficulty settings influence selected questions.
- A room never repeats a question unless the pool is exhausted.

### Step 4: Runtime controls and metadata

Files:

- `server/src/games/trivia/TriviaRuntime.ts`
- `shared/src/gameRuntime.ts`
- room creation route/client form files

Tasks:

- Pass generation hints from room settings (category, difficulty, theme).
- Store source metadata (`ai` or `fallback`) for logging/analytics only.
- Keep existing answer timing and scoring logic unchanged.
- Include explanation in round reveal, never before answers are locked.
- Track streaks and fastest correct answer as optional round metadata.

Acceptance:

- No gameplay regression in timer, answer locking, and scoring.

### Step 5: Persistence and question pool

Files:

- `db/prisma/schema.prisma`
- `server/src/games/trivia/questionService.ts`

Tasks:

- Add `TriviaQuestion` table for storing validated AI questions.
- Save accepted AI questions with hash and usage count.
- Reuse cached questions before generating new ones.
- Store moderation and quality fields so weak questions can be retired.

Acceptance:

- Reduced generation cost and lower latency after warm-up.
- New high-quality questions become reusable app content.

Recommended Prisma model:

```prisma
model TriviaQuestion {
  id            String   @id @default(cuid())
  hash          String   @unique
  question      String
  answers       Json
  correctId     String
  explanation   String?
  category      String
  difficulty    String
  tags          String[]
  source        String   @default("ai")
  status        String   @default("approved")
  usageCount    Int      @default(0)
  correctCount  Int      @default(0)
  reportCount   Int      @default(0)
  lastUsedAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([category, difficulty, status])
  @@index([lastUsedAt])
  @@index([usageCount])
}
```

Question lifecycle:

- `generated`: created by AI but not trusted yet if stricter moderation is added later.
- `approved`: safe for normal games.
- `reported`: temporarily avoided after player reports.
- `retired`: kept for audit/history but never selected.

Selection policy:

- Prefer `approved` questions with low `usageCount` and no recent use.
- Blend category matches with occasional adjacent tags in `Mixed`.
- Replenish in the background when a category/difficulty pool drops below a threshold.
- Do not block round start on generation if an approved DB question exists.

### Step 6: Observability and safety

Files:

- `server/src/games/trivia/questionService.ts`
- `server/src/index.ts` or logging utility file

Tasks:

- Log metrics: generation latency, fail rate, fallback rate, cache hit rate.
- Add basic content safety checks (block slurs/unsafe prompts/content categories).
- Add circuit-breaker behavior if consecutive AI failures exceed threshold.
- Add player report action after reveal: `Bad question`.
- Track report reasons: `wrong answer`, `unclear`, `offensive`, `too hard`, `duplicate`.

Acceptance:

- We can monitor production quality and automatically degrade safely.
- Reported questions are avoided until reviewed.

### Step 7: Testing

Files:

- `server/src/games/trivia/__tests__/questionService.test.ts` (new)
- `server/src/games/trivia/__tests__/TriviaRuntime.test.ts` (new/updated)

Test cases:

- AI returns valid payload -> used in round.
- AI returns malformed JSON -> fallback question used.
- AI timeout -> fallback question used within deadline.
- Duplicate question generated -> regenerated or fallback selected.
- Correct answer index always maps to an existing option.
- Category and difficulty filters select matching questions.
- Reported/retired questions are not selected.
- Explanation is only sent after round end/reveal.

Acceptance:

- Deterministic tests cover success and failure paths.

---

## Prompt Strategy (Gemini)

Use a strict system-style instruction in provider:

- Return only JSON (no markdown).
- Exactly 1 trivia question.
- 4 options labeled `a|b|c|d`.
- Single correct answer.
- No controversial/harmful content.
- Keep question concise and unambiguous.

Request context inputs:

- `difficulty`
- `category`
- `allowedTags`
- `locale` (future-ready)
- `excludeTopics` or recent question summary for dedupe

Generation guidance:

- For `Mixed`, rotate across the launch categories instead of asking generic general knowledge every time.
- For popular culture categories, prefer durable facts over breaking-news questions.
- Avoid trick questions unless difficulty is `hard`.
- Include a concise explanation that teaches the answer.
- Keep answer choices plausible but clearly distinct.

Example provider prompt inputs:

```json
{
  "category": "Gaming",
  "difficulty": "medium",
  "allowedTags": ["minecraft", "nintendo", "playstation", "esports", "gaming-history"],
  "recentFingerprints": ["..."]
}
```

---

## Frontend UX Amendments

### Room creation

Files:

- `client/src/app/lobby/page.tsx`
- `client/src/components/room/RoomActionsPanel.tsx`
- `client/src/lib/rooms.ts`
- `client/src/app/api/rooms/route.ts`

Tasks:

- When Trivia is selected, show category chips and difficulty chips below the player count.
- Persist selected settings into the room record or a room settings JSON field.
- Keep defaults invisible enough that a user can still create a room quickly.

### Gameplay

Files:

- `client/src/components/room/TriviaPlayArea.tsx`
- `client/src/hooks/useRoom.ts`
- `shared/src/socketEvents.ts`
- `shared/src/schemas.ts`

Tasks:

- Render category/difficulty chips near the question.
- Add reveal explanation text after `ROUND_ENDED`.
- Show answer percentages if enough players answered.
- Show fastest correct player.
- Add `Report question` in reveal state for signed-in users.

### Admin quality tools

Files:

- `client/src/components/admin/*`
- `client/src/app/api/admin/*`

Tasks:

- Add a simple Trivia Questions admin page later:
  - filter by category, difficulty, status, report count
  - retire question
  - approve reported question
  - view answer correctness rate

---

## Rollout Plan

### Phase A (safe launch)

- `TRIVIA_AI_ENABLED=false` in production.
- Deploy DB schema, provider, fallback path, category settings, and tests.
- Seed at least 20 approved questions per launch category so the first experience is instant.

### Phase B (canary)

- Enable AI for admin-created rooms only or 5% of rooms.
- Monitor fallback rate and bad question reports.
- Enable background replenishment for low-stock categories.

### Phase C (general availability)

- Enable for all Trivia rooms.
- Tune cache policy and generation timeout/cost caps.
- Add admin review tools once reports and generated volume justify it.

---

## Risks and Mitigations

- Risk: malformed model output
  - Mitigation: strict Zod validation + retry + fallback.

- Risk: latency spikes impact round start
  - Mitigation: timeout + prefetch next question during active round.

- Risk: repeated or low-quality questions
  - Mitigation: fingerprint dedupe + cached pool + user report flag.

- Risk: unsafe content
  - Mitigation: prompt constraints + allowlist categories + output filtering.

- Risk: unexpected API cost
  - Mitigation: cache-first strategy + token bounds + per-room generation cap.

---

## Definition of Done

- AI generation works with Gemini 2.5 Flash on server-only key.
- Trivia room creation supports category and difficulty with good defaults.
- Approved questions are stored in the database and reused before generation.
- Trivia rounds remain stable with same realtime behavior.
- Any AI failure gracefully falls back with no match interruption.
- Question reveal includes correct answer, selected answers, and a concise explanation.
- Reported/retired questions are not used in normal games.
- Tests cover parsing, validation, fallback, and dedupe.
- Metrics show generation health in logs/dashboard.

---

## Suggested Work Breakdown (1 week)

- Day 1: category/difficulty shared schemas + room settings data path.
- Day 2: Prisma `TriviaQuestion` model + seed/import script + DB-first question service.
- Day 3: provider wrapper + validation + save accepted AI questions.
- Day 4: gameplay UI polish: chips, reveal explanation, streak/fastest correct.
- Day 5: tests + canary rollout + tuning.
