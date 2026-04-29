# Admin Implementation Roadmap

## Purpose

This file turns the gap analysis in [admin-missing-features.md](./admin-missing-features.md) into an execution plan that fits the current Arcado codebase.

It is optimized for the admin surface that already exists today:

- routes under `client/src/app/admin`
- API routes under `client/src/app/api/admin`
- shared admin UI under `client/src/components/admin`
- schema support for `AdminLog`, `GameConfig`, `SystemSetting`, `Room`, and `TriviaQuestion`

The goal is to expand the admin area without building risky half-finished controls or broad UI shells with no working workflow behind them.

---

## Current Baseline

Existing admin pages:

- `client/src/app/admin/page.tsx`
- `client/src/app/admin/users/page.tsx`
- `client/src/app/admin/users/[userId]/page.tsx`
- `client/src/app/admin/rooms/page.tsx`
- `client/src/app/admin/logs/page.tsx`
- `client/src/app/admin/settings/page.tsx`

Existing admin components:

- `client/src/components/admin/AdminDashboardClient.tsx`
- `client/src/components/admin/AdminUsersClient.tsx`
- `client/src/components/admin/AdminUserDetailClient.tsx`
- `client/src/components/admin/AdminRoomsClient.tsx`
- `client/src/components/admin/AdminLogsClient.tsx`
- `client/src/components/admin/AdminSettingsClient.tsx`
- `client/src/components/admin/AdminSidebar.tsx`
- `client/src/components/admin/AdminTopBar.tsx`

Existing admin API coverage:

- users list + detail + role/status update
- rooms list only
- logs list only
- overview metrics
- games config list + patch
- announcements CRUD

Important constraint:

- user and game mutation routes already use `createAdminLog` and `requireAdminApiSession`
- room operations, moderation workflows, analytics drilldowns, and system settings still need end-to-end workflows

---

## Planning Principles

1. Ship workflows, not placeholder pages.
2. Put safety and auditability before moderator convenience.
3. Reuse existing admin patterns before inventing new ones.
4. Add backend and UI in the same phase when a workflow must actually be usable.
5. Defer bulk actions until single-item actions are safe, logged, and understandable.

---

## Phase Summary

| Phase | Goal | Why It Comes Here |
|---|---|---|
| 1 | Safe room operations | Highest operational value and biggest current gap |
| 2 | Searchable audit trail + admin safeguards | Required before more destructive admin power |
| 3 | Moderation workflow | Uses the safety and logging foundation from phases 1-2 |
| 4 | Games and content management | Expands from moderation patterns and existing game config APIs |
| 5 | Analytics and system settings | High leverage, but less urgent than operations and moderation |
| 6 | Bulk operations and retention polish | Only worth doing once base workflows are stable |

---

## Phase 1: Safe Room Operations

### Goal

Turn the current read-only rooms area into a real incident-response workflow for admins.

### Why First

- `AdminRoomsClient` is currently browse-only
- the room API is GET-only today
- live room incidents are the most visible admin failure mode
- this creates a concrete pattern for detail pages, destructive actions, confirmations, and logging

### Scope

Add:

- `/admin/rooms/[roomId]`
- room detail API route
- admin room actions API route or action handlers for:
  - force end room
  - remove player
  - optionally transfer/remove host if the data model supports it safely
- confirmation UX for destructive actions
- required reason input for admin intervention
- `AdminLog` entries for every intervention

### Likely Files

- `client/src/app/admin/rooms/page.tsx`
- `client/src/app/admin/rooms/[roomId]/page.tsx`
- `client/src/components/admin/AdminRoomsClient.tsx`
- `client/src/components/admin/AdminRoomDetailClient.tsx`
- `client/src/app/api/admin/rooms/route.ts`
- `client/src/app/api/admin/rooms/[roomId]/route.ts`
- `client/src/app/api/admin/rooms/[roomId]/actions/route.ts`
- `client/src/lib/admin.ts`

### Minimum Acceptance Criteria

- admins can open a room detail page from the rooms list
- detail view shows room metadata, creator, players, state, and recent outcomes
- admin can force end a room
- admin can remove a disruptive player
- each destructive action requires confirmation
- each destructive action stores actor, target, reason, and timestamp in `AdminLog`
- failed actions return clear error states in the UI

### Explicit Defers

- bulk room cleanup
- reopening abandoned rooms unless the state machine already supports it clearly
- advanced live event streaming
- room timeline visualization

### Suggested PR Split

1. Room detail page and detail API
2. Force-end action with logging and confirmation
3. Remove-player action with logging and confirmation

---

## Phase 2: Searchable Audit Trail And Admin Safeguards

### Goal

Make admin actions safer and investigations practical before expanding admin power further.

### Why Second

- the log route currently returns only the latest 100 records
- user role/status changes are powerful and need stronger boundaries
- moderation should not ship before investigation and audit tooling improves

### Scope

Add:

- server-side log filtering
- server-side pagination
- filters for actor, target type, action, and date range
- log detail drawer or detail page
- server-side role hierarchy checks
- self-protection rules:
  - cannot self-ban
  - cannot self-demote
  - cannot edit peer or higher privileged users without permission
- typed confirmation for high-risk actions if the action is irreversible or highly sensitive

### Likely Files

- `client/src/components/admin/AdminLogsClient.tsx`
- `client/src/app/admin/logs/page.tsx`
- `client/src/app/api/admin/logs/route.ts`
- `client/src/components/admin/AdminUsersClient.tsx`
- `client/src/components/admin/AdminUserDetailClient.tsx`
- `client/src/app/api/admin/users/[userId]/route.ts`
- `client/src/lib/admin.ts`

### Minimum Acceptance Criteria

- admins can filter logs by action, actor, target type, and date range
- logs paginate server-side
- log UI can open a single entry and inspect details payload
- user mutation API blocks forbidden hierarchy changes server-side
- current admin cannot self-ban or self-demote
- high-risk mutations show an explicit confirmation step in the UI

### Explicit Defers

- CSV export if it complicates filter and pagination delivery
- log retention automation
- bulk user actions

### Suggested PR Split

1. Logs API filters + pagination
2. Logs UI filter state + detail view
3. User mutation guardrails and confirmations

---

## Phase 3: Moderation Workflow

### Goal

Create the first real moderation queue instead of scattered admin controls.

### Why Third

- the schema already hints at moderation via `TriviaQuestion.status` and `reportCount`
- moderation benefits directly from room controls and stronger audit/safety rules
- this is the first phase that introduces a new admin area rather than deepening an existing one

### Scope

Add:

- `/admin/moderation`
- moderation queue API
- filters for status, report count, and content type
- actions for:
  - approve
  - reject
  - hide
  - escalate
  - mark reviewed
- moderation reason codes
- review history visible on the item

Start with trivia content first unless the repo already has a robust flagged-room or flagged-user model.

### Likely Files

- `client/src/app/admin/moderation/page.tsx`
- `client/src/components/admin/AdminModerationClient.tsx`
- `client/src/app/api/admin/moderation/route.ts`
- `client/src/app/api/admin/moderation/[itemId]/route.ts`
- `client/src/components/admin/AdminSidebar.tsx`
- `client/src/lib/admin.ts`
- `db/prisma/schema.prisma`

### Minimum Acceptance Criteria

- moderation page shows a review queue with meaningful defaults
- admins can filter and sort queue items
- admins can approve, reject, hide, escalate, and mark reviewed
- each moderation action requires a reason code or note
- moderation actions write to `AdminLog`
- each item shows current status and prior review actions

### Explicit Defers

- appeals system
- cross-content moderation queue if the underlying report models do not exist yet
- polished dashboards for moderator throughput

### Suggested PR Split

1. Schema and API support for moderation queue data
2. Moderation list UI and filters
3. Moderation actions and history

---

## Phase 4: Games And Content Management

### Goal

Move game administration out of the generic settings page and give content its own operational home.

### Why Fourth

- games config editing already exists, so this phase can reuse current APIs
- moderation patterns from phase 3 can power trivia content review here
- this is more useful after content lifecycle states are already defined

### Scope

Add:

- `/admin/games`
- optionally `/admin/games/[gameId]`
- move or mirror `GameConfig` management into dedicated game pages
- trivia question search and filtering
- lifecycle controls for trivia content
- content health signals:
  - usage
  - report count
  - last used
  - status

### Likely Files

- `client/src/app/admin/games/page.tsx`
- `client/src/app/admin/games/[gameId]/page.tsx`
- `client/src/components/admin/AdminGamesClient.tsx`
- `client/src/components/admin/AdminGameDetailClient.tsx`
- `client/src/app/api/admin/games/route.ts`
- `client/src/app/api/admin/games/[gameId]/route.ts`
- `client/src/app/api/admin/trivia-questions/route.ts`
- `client/src/components/admin/AdminSidebar.tsx`

### Minimum Acceptance Criteria

- admins can browse all games from a dedicated admin route
- admins can edit existing game config from a game-specific page
- admins can search and filter trivia questions
- admins can change question lifecycle state without touching raw DB records
- question list shows enough metadata to support review decisions

### Explicit Defers

- full CRUD for every possible content type
- large import/export tools
- custom content editors beyond what is needed for moderation and lifecycle control

### Suggested PR Split

1. `/admin/games` route and config management UI
2. per-game detail pages
3. trivia question browser and lifecycle tools

---

## Phase 5: Analytics And System Settings

### Goal

Add higher-leverage operational tooling once the admin model is stable.

### Why Fifth

- analytics are easier to design once operational workflows are defined
- system settings are powerful and should not compete with safety work for early attention
- the current admin dashboard already provides a base summary view

### Scope

Add:

- `/admin/analytics`
- date range filters
- trend charts for users, rooms, and game activity
- game-level drilldowns where data already exists
- system settings management for `SystemSetting`
- maintenance mode and feature flags if the runtime can actually consume them
- scheduling improvements for announcements if they remain on the settings surface

### Likely Files

- `client/src/app/admin/analytics/page.tsx`
- `client/src/components/admin/AdminAnalyticsClient.tsx`
- `client/src/app/api/admin/analytics/route.ts`
- `client/src/app/admin/settings/page.tsx`
- `client/src/components/admin/AdminSettingsClient.tsx`
- `client/src/app/api/admin/settings/route.ts`
- `client/src/components/admin/AdminSidebar.tsx`
- `db/prisma/schema.prisma`

### Minimum Acceptance Criteria

- admins can open an analytics page with at least one switchable date range
- charts and metric cards update from server data
- admins can edit system settings in categorized groups
- settings changes persist and create admin logs
- maintenance or flag controls are only exposed if there is real application behavior behind them

### Explicit Defers

- custom charting polish
- CSV export if core drilldown/filtering is still weak
- speculative settings that no runtime code reads

### Suggested PR Split

1. Analytics API and date-range aware UI
2. System settings API and settings editor
3. announcement scheduling refinements if still needed

---

## Phase 6: Bulk Operations And Retention Polish

### Goal

Add efficiency features only after the base admin workflows are trustworthy.

### Why Last

- bulk actions amplify mistakes if guardrails are weak
- retention rules are less urgent than searchability and correctness
- this phase should polish stable workflows, not rescue incomplete ones

### Scope

Add:

- multi-select for users, announcements, or content where it is clearly useful
- batch action confirmations
- batch logging summaries
- retention and archive rules for `AdminLog` if scale requires it

### Minimum Acceptance Criteria

- at least one bulk workflow is faster than repeated single-item work
- batch actions have stronger confirmation than single-item changes
- logs make it clear what was changed in the batch
- retention work does not remove records needed for active investigation

### Explicit Defers

- bulk destructive controls across every admin surface
- automatic purging before retention policy is agreed

---

## Recommended First Milestone

If work starts now, the best first milestone is:

### Milestone 1: Room Detail + Force End

Deliver:

- `/admin/rooms/[roomId]`
- room detail fetch
- force-end room action
- confirmation modal
- reason capture
- `AdminLog` write

Why this is the best starting slice:

- it closes the biggest operational gap
- it is useful immediately
- it establishes the patterns later phases need
- it is smaller and safer than trying to ship all of moderation first

---

## Delivery Order Inside The Project

Use this exact order unless implementation uncovers a hidden schema limitation:

1. Room detail page
2. Force-end room
3. Remove-player flow
4. Log filters and pagination
5. Role-boundary checks and self-action safeguards
6. Moderation queue
7. Games route and config surface
8. Trivia content browser
9. Analytics route
10. System settings
11. Bulk actions
12. Retention polish

---

## Notable Risks

### Phase 1 risk

Room intervention can corrupt game flow if room state transitions are not centralized. Prefer calling shared server logic instead of hand-editing room records in admin routes.

### Phase 2 risk

UI-only safeguards are not enough. Role hierarchy and self-action rules must live server-side in admin API routes.

### Phase 3 risk

Moderation UI will feel fake if the queue is not backed by real report or status data. Start with the data model that already exists.

### Phase 5 risk

System settings become dangerous if values are editable but unused. Only expose settings with a real consumer in app code.

---

## Definition Of Success

This roadmap is successful when:

- admins can intervene safely in rooms
- every sensitive admin action is auditable and appropriately guarded
- moderation is a workflow, not just a future idea
- game and content operations live in dedicated surfaces
- analytics and settings are additive, not compensating for missing core controls

---

## Companion Files

- Research: [admin-missing-features.md](./admin-missing-features.md)
- Original broader phase brief: [PHASE_02_AUTH_ADMIN.md](../phases/PHASE_02_AUTH_ADMIN.md)
