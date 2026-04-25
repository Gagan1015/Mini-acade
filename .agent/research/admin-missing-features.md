# Admin Feature Gap Research

## Scope

This note reviews the current admin surface in the codebase and identifies admin-side features that appear to be missing or only partially implemented.

Primary sources reviewed:

- [client/src/app/admin/page.tsx](../client/src/app/admin/page.tsx)
- [client/src/app/admin/users/page.tsx](../client/src/app/admin/users/page.tsx)
- [client/src/app/admin/users/[userId]/page.tsx](../client/src/app/admin/users/%5BuserId%5D/page.tsx)
- [client/src/app/admin/rooms/page.tsx](../client/src/app/admin/rooms/page.tsx)
- [client/src/app/admin/logs/page.tsx](../client/src/app/admin/logs/page.tsx)
- [client/src/app/admin/settings/page.tsx](../client/src/app/admin/settings/page.tsx)
- [client/src/components/admin/AdminSidebar.tsx](../client/src/components/admin/AdminSidebar.tsx)
- [client/src/components/admin/AdminUsersClient.tsx](../client/src/components/admin/AdminUsersClient.tsx)
- [client/src/components/admin/AdminRoomsClient.tsx](../client/src/components/admin/AdminRoomsClient.tsx)
- [client/src/components/admin/AdminLogsClient.tsx](../client/src/components/admin/AdminLogsClient.tsx)
- [client/src/components/admin/AdminSettingsClient.tsx](../client/src/components/admin/AdminSettingsClient.tsx)
- [client/src/app/api/admin/\*\*](../client/src/app/api/admin)
- [db/prisma/schema.prisma](../db/prisma/schema.prisma)
- [\.agent/phases/PHASE_02_AUTH_ADMIN.md](../.agent/phases/PHASE_02_AUTH_ADMIN.md)

## Quick Verdict

The admin area is functional, but it is not a full operational console yet. It currently supports:

- user role/status changes
- room browsing
- admin audit log browsing
- game config editing
- announcement creation and toggling

It does not yet cover several admin capabilities that the repo’s own phase brief describes, especially:

- dedicated game/content management
- moderation workflows
- operational room control
- richer analytics and reporting
- global system settings management
- export/search/pagination tools for large datasets

## Evidence From The Codebase

Current admin routes only include:

- `/admin`
- `/admin/users`
- `/admin/users/[userId]`
- `/admin/rooms`
- `/admin/logs`
- `/admin/settings`

The sidebar mirrors that limited set in [AdminSidebar.tsx](../client/src/components/admin/AdminSidebar.tsx).

The admin API surface is similarly narrow:

- user GET/PATCH
- rooms GET only
- logs GET only
- overview GET only
- game config GET/PATCH
- announcements GET/POST/PATCH/DELETE

There are no admin routes for:

- trivia question moderation
- content review queues
- room intervention actions
- export endpoints
- bulk moderation actions
- system settings management
- admin analytics dashboards beyond the overview cards

The schema also hints at broader admin needs that are not exposed in the UI yet:

- [TriviaQuestion](../db/prisma/schema.prisma) exists with `status`, `reportCount`, and moderation-style fields
- [SystemSetting](../db/prisma/schema.prisma) exists but has no admin page or API surface
- [AdminLog](../db/prisma/schema.prisma) exists, but there is no filtering, export, or retention tooling

The original phase brief explicitly called for:

- full CRUD operations
- admin analytics and monitoring
- moderation
- managing games, rooms, and settings
- logging all admin actions
  See [PHASE_02_AUTH_ADMIN.md](../.agent/phases/PHASE_02_AUTH_ADMIN.md)

## Missing Features, Prioritized

### 1. Dedicated moderation center

High priority.

What appears missing:

- a queue for reported or flagged content
- approval/rejection workflows for trivia questions
- moderation history per item
- reason codes for bans/suspensions
- appeals or review state for moderated users

Why it matters:

- the schema already contains moderation-relevant data (`TriviaQuestion.status`, `reportCount`)
- the current admin UI can only change user status, not review content or reports
- this leaves the platform without a content safety workflow

Suggested direction:

- add `/admin/moderation`
- expose reported trivia questions, suspicious users, and flagged rooms
- add action buttons for approve, reject, hide, unhide, escalate, and mark reviewed

### 2. Room intervention tools

High priority.

What appears missing:

- force-end room
- kick player / remove host
- reopen abandoned room
- inspect room state in detail
- view room history, players, and results in one place

Why it matters:

- [AdminRoomsClient.tsx](../client/src/components/admin/AdminRoomsClient.tsx) is read-only
- admins can see room counts, but cannot respond to live incidents or disruptive rooms
- room status already exists in the schema, so intervention controls are a natural fit

Suggested direction:

- add room detail page with controls
- allow admin override actions with confirmation and audit logging
- show current room metadata, players, game state, and recent events

### 3. Game/content management beyond config toggles

High priority.

What appears missing:

- dedicated games page in the sidebar and routing
- CRUD for game-specific settings rather than only patching a small config subset
- management of trivia questions / question bank / content pools
- lifecycle controls for game content approval or deprecation

Why it matters:

- the phase brief mentions managing all games, but the current sidebar has no `/admin/games`
- the database contains [TriviaQuestion](../db/prisma/schema.prisma), but there is no admin UI for it
- the current `settings` page only edits a few fields on `GameConfig`

Suggested direction:

- add `/admin/games` and possibly `/admin/games/[gameId]`
- add trivia question review tools and search
- expose content health metrics like usage, reports, and last used time

### 4. Dedicated analytics and monitoring

Medium to high priority.

What appears missing:

- a proper analytics page with longer date ranges
- retention / activity trends
- game-by-game performance over time
- growth and churn metrics
- filters by role, room status, game, or region
- exportable charts or CSV downloads

Why it matters:

- the dashboard has a few useful charts, but it is still a summary view
- the phase brief explicitly calls for analytics and monitoring
- admin decision-making will be constrained without trend and drilldown views

Suggested direction:

- add `/admin/analytics`
- show time-series charts for users, rooms, active sessions, and game results
- add date range filtering and CSV export

### 5. System settings management

Medium priority.

What appears missing:

- editing `SystemSetting` entries
- feature flags or maintenance mode controls
- announcement scheduling UI with start/end controls
- environment-style platform settings grouped by category

Why it matters:

- [SystemSetting](../db/prisma/schema.prisma) exists in the schema but is unused by the admin UI
- the current settings page is limited to game configs and announcements
- admins need a single place to manage platform-wide behavior, not just game tuning

Suggested direction:

- add a System Settings tab or page
- group settings by category
- include maintenance mode, feature toggles, and default platform messaging

### 6. Better audit-log operations

Medium priority.

What appears missing:

- filtering by actor, target type, action, and date range
- log export/download
- log detail drilldown
- retention or pagination beyond the most recent 100 entries

Why it matters:

- logs are valuable only if they are searchable at scale
- the current log screens are browse-only and can become noisy quickly
- without filters, it is hard to investigate incidents

Suggested direction:

- add query filters and server-side pagination
- add a log detail drawer or page
- support CSV export for compliance and investigations

### 7. Bulk admin operations

Medium priority.

What appears missing:

- bulk user status changes
- bulk role changes
- bulk announcement activation/deactivation
- bulk deletion / archive workflows for rooms or content

Why it matters:

- current admin actions are strictly one item at a time
- this becomes inefficient for incidents or data cleanup
- bulk actions reduce repetitive, error-prone work

Suggested direction:

- add multi-select tables
- require a confirmation step for destructive operations
- log the batch summary, not just each item

### 8. Operational safeguards and role boundaries

Medium priority.

What appears missing:

- stronger separation between ADMIN and SUPER_ADMIN capabilities
- self-demotion / self-ban safeguards
- confirmation flows for destructive actions
- guardrails for accidental promotion of the wrong account

Why it matters:

- the current user action menus expose role changes and bans with little additional protection
- admin systems are high-risk by nature, so guardrails matter even when the UI is working

Suggested direction:

- prevent acting on the current session user for destructive operations
- require typed confirmation for high-risk actions
- enforce role hierarchy checks server-side, not only in the UI

## What Is Already Good

- The current admin area is coherent and easy to navigate.
- Core user controls exist: view details, change roles, suspend, and ban.
- Game config edits are already wired to an API and logged.
- Announcements can be created, activated, deactivated, and deleted.
- Audit logs exist and are attached to admin actions, which is a solid foundation.
- The code already distinguishes between overview, list views, and detail views, which makes future expansion straightforward.

## Deep Dive: How To Improve This Plan

The current plan is directionally correct, but it is still too broad to execute cleanly. It will improve if it does three things better:

1. Turn feature names into workflow names.
2. Order work by dependency, not by how visible the missing feature feels.
3. Define what "done" means for each admin area.

### What Is Weak In The Current Plan

- It lists missing surfaces, but does not distinguish between UI gaps and backend gaps.
- It treats every missing feature as roughly the same size.
- It does not say which gaps unlock other gaps.
- It does not define minimum acceptance criteria for each feature.
- It does not call out which items are operationally dangerous if shipped half-finished.

### Better Execution Order

#### Phase 1: Close the safety and operations gaps first

Do these first because they reduce risk and unblock other work:

- room intervention tools
- stronger role boundaries and destructive-action safeguards
- audit-log filtering and pagination

Why this comes first:

- these are the highest-risk admin actions
- they are useful immediately even before new dashboards exist
- they create the audit trail and guardrails needed by later moderation features

#### Phase 2: Add moderation as a real workflow

Next, build the moderation center and make it operate on real queues:

- reported trivia questions
- flagged rooms or users
- review state, reason codes, and resolution history

Why this comes next:

- the schema already contains moderation-relevant fields
- moderation needs the safety/logging work from Phase 1
- content review is more valuable once admins can safely act on incidents

#### Phase 3: Expand game/content management

After moderation, fill in the content-management hole:

- `/admin/games` and per-game detail pages
- trivia question review and search
- richer game-config controls

Why this is third:

- it reuses the moderation workflow patterns
- it needs clearer policy decisions around approved/rejected content
- it is easier to scope once the first two phases establish navigation and patterns

#### Phase 4: Add analytics and system settings

Finish with higher-leverage operational tooling:

- analytics dashboards with filters and exports
- system settings management
- retention and reporting utilities

Why this is last:

- these tools are powerful but not urgent compared with moderation and safety
- they are easiest to design well once the core admin model is stable

### Minimum Acceptance Criteria By Area

#### Moderation center

- admins can see a queue of items that need review
- admins can approve, reject, hide, or escalate an item
- every action is written to `AdminLog`
- each item has a visible status and a review history

#### Room intervention tools

- admins can inspect a room detail page
- admins can force end a room or remove a disruptive player
- every destructive action has a confirmation step
- actions are logged with target metadata

#### Game/content management

- admins can browse game configs from a dedicated page
- admins can search and filter trivia questions
- admins can see usage, report, and recency signals
- admins can change lifecycle state without editing raw database records

#### Analytics and settings

- admins can switch date ranges on charts
- admins can export data where appropriate
- admins can edit system-level settings in one place
- changes persist and are logged

### Recommended Scope Cuts

To keep the plan realistic, do not start with these:

- full-blown custom charting before the filters exist
- bulk actions before single-item workflows are stable
- retention automation before log browsing and exports work
- fancy moderation UI before the review queue data exists

### Revised Priority List

If this note is used as an implementation roadmap, I would compress it to this order:

1. room intervention tools
2. audit-log filters and pagination
3. destructive-action safeguards and role boundaries
4. moderation queue
5. trivia/content review tools
6. analytics dashboard
7. system settings
8. bulk operations and retention polish

That is a better plan because it starts with the admin actions that are most dangerous if they are wrong, then fills in the review workflows, then adds reporting and convenience features.

## Recommendation

If the next goal is to make the admin side feel complete, the highest-value additions are still:

1. room intervention tools
2. audit-log filters and pagination
3. moderation center
4. dedicated games/content management
5. analytics and system settings

The important improvement is the order. The plan should be driven by operational risk and dependencies, not just by how visible the missing feature is in the sidebar.

## Suggested Follow-Up File

If this research is meant to drive implementation, the next useful companion note should be a sprint roadmap with these columns:

- feature
- dependency
- estimated effort
- acceptance criteria
- dependency / risk

That would make it easier to turn this research into a real implementation plan instead of a feature wishlist.
