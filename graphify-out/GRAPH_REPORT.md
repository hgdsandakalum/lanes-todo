# Graph Report - lanes-day1  (2026-10-18)

## Corpus Check
- 165 files · ~61,077 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 1, .log 1, .ico 1)

## Summary
- 868 nodes · 2922 edges · 30 communities (25 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `54c12ad9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ymd
- requireSession
- actions/tasks.ts
- next
- editor.tsx
- [workspace]/page.tsx
- colorVar
- subscriptions.tsx
- lanes.mjs
- schema.ts
- cli/route.ts
- xp.ts
- export/route.ts
- compilerOptions
- package.json
- scripts
- routine-editor.tsx
- devDependencies
- Product
- routines/page.tsx
- seed.ts
- dependencies
- @playwright/test
- app/layout.tsx
- app-app-page-tsx.md
- drizzle-kit
- AGENTS.md
- CLAUDE.md
- start.sh
- backup.sh

## God Nodes (most connected - your core abstractions)
1. `requireSession()` - 93 edges
2. `ymd()` - 66 edges
3. `next` - 47 edges
4. `addDays()` - 40 edges
5. `react` - 35 edges
6. `drizzle-orm` - 32 edges
7. `formatShort()` - 29 edges
8. `db` - 28 edges
9. `Dashboard()` - 27 edges
10. `TaskType` - 27 edges

## Surprising Connections (you probably didn't know these)
- `How it's built` --references--> `requireSession()`  [INFERRED]
  README.md → lib/auth/session.ts
- `Working with tasks` --references--> `weekdays()`  [INFERRED]
  README.md → lib/game/streaks.test.ts
- `How it's built` --references--> `safeHttpUrl()`  [INFERRED]
  README.md → lib/domain/repo.ts
- `save()` --calls--> `saveRoutine()`  [EXTRACTED]
  components/routines/routine-editor.tsx → lib/actions/routines.ts
- `TaskEditor()` --indirect_call--> `updateTask()`  [INFERRED]
  components/task/editor.tsx → lib/actions/tasks.ts

## Import Cycles
- None detected.

## Communities (30 total, 5 thin omitted)

### Community 0 - "ymd"
Cohesion: 0.06
Nodes (90): Dashboard(), DashboardPage(), metadata, Board(), BoardSkeleton(), HomePage(), metadata, DAY_LABELS (+82 more)

### Community 1 - "requireSession"
Cohesion: 0.06
Nodes (89): TaskPage(), TaskView(), announceXp(), Boards(), GROUPS, inGroup(), AddLine(), Checklist() (+81 more)

### Community 2 - "actions/tasks.ts"
Cohesion: 0.05
Nodes (78): DataPage(), metadata, ImportForm(), Kbd(), QuickAdd(), QuickAddProject, typing(), shortUrl() (+70 more)

### Community 3 - "next"
Cohesion: 0.06
Nodes (43): AppLayout(), LoginForm(), LoginPage(), metadata, oct(), QueenMedallion(), XpNote(), XpPulse() (+35 more)

### Community 4 - "editor.tsx"
Cohesion: 0.10
Nodes (45): metadata, Templates(), TemplatesPage(), AddProject(), ArchivedRow(), remove(), ColorField(), Field() (+37 more)

### Community 5 - "[workspace]/page.tsx"
Cohesion: 0.09
Nodes (32): Counts(), tally(), Workspace(), WorkspacePage(), ProjectPage(), ProjectView(), Props, Area() (+24 more)

### Community 6 - "colorVar"
Cohesion: 0.11
Nodes (36): metadata, Results(), SearchPage(), Routine, RoutineChecklist(), toggle(), SignalLine(), List() (+28 more)

### Community 7 - "subscriptions.tsx"
Cohesion: 0.11
Nodes (38): metadata, Subscriptions(), SubscriptionsPage(), DeleteButton(), PaymentHistory(), PER, ProjectOption, Row() (+30 more)

### Community 8 - "lanes.mjs"
Cohesion: 0.11
Nodes (23): bold(), call(), die(), dim(), git(), localToken(), main(), readJson() (+15 more)

### Community 9 - "schema.ts"
Cohesion: 0.06
Nodes (31): achievements, ChecklistItem, checklistItems, dayPlans, dayReviews, deepTasks, Label, labels (+23 more)

### Community 10 - "cli/route.ts"
Cohesion: 0.20
Nodes (25): add(), attach(), authorized(), Body, digest(), fail(), folderProject(), link() (+17 more)

### Community 11 - "xp.ts"
Cohesion: 0.14
Nodes (19): client, db, main(), workflow(), Award, checkAward(), finishedAt(), GENERAL_DAILY_CAP (+11 more)

### Community 12 - "export/route.ts"
Cohesion: 0.18
Nodes (16): GET(), RFC-4180, enc, fromB64(), key(), secret(), SESSION_COOKIE, SESSION_DAYS (+8 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 14 - "package.json"
Cohesion: 0.12
Nodes (16): eslintConfig, bin, lanes, name, private, version, eslint, eslint-config-next (+8 more)

### Community 15 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:backup, db:push, db:seed, db:setup, db:studio, dev (+7 more)

### Community 16 - "routine-editor.tsx"
Cohesion: 0.20
Nodes (12): DAYS, daysLabel(), FIXED, Routine, ITEM_MAX, ITEM_TEXT_MAX, RoutineItem, Signal (+4 more)

### Community 17 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, drizzle-kit, eslint, eslint-config-next, @playwright/test, tailwindcss, @tailwindcss/turbopack, tsx (+4 more)

### Community 18 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 19 - "routines/page.tsx"
Cohesion: 0.31
Nodes (9): metadata, Routines(), RoutinesPage(), NewRoutine(), RoutineCard(), RoutineForm(), save(), deleteRoutine() (+1 more)

### Community 20 - "seed.ts"
Cohesion: 0.22
Nodes (7): client, db, PROJECTS, ROUTINES, WORKSPACES, StoredItem, STARTER_TEMPLATES

### Community 21 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, drizzle-orm, @fontsource-variable/archivo, @libsql/client, next, react, react-dom, react-markdown (+2 more)

### Community 22 - "@playwright/test"
Cohesion: 0.22
Nodes (3): tag, PAGES, @playwright/test

### Community 23 - "app/layout.tsx"
Cohesion: 0.33
Nodes (3): metadata, viewport, @fontsource-variable/archivo

### Community 24 - "app-app-page-tsx.md"
Cohesion: 0.50
Nodes (3): Direction contract, Open decisions, Scope

## Knowledge Gaps
- **9 isolated node(s):** `RFC-4180`, `react-dom`, `@tailwindcss/turbopack`, `@types/node`, `@types/react` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 238 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `ymd`, `requireSession`, `actions/tasks.ts`, `editor.tsx`, `[workspace]/page.tsx`, `colorVar`, `subscriptions.tsx`, `lanes.mjs`, `export/route.ts`, `package.json`, `routines/page.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **What connects `RFC-4180`, `react-dom`, `@tailwindcss/turbopack` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ymd` be split into smaller, more focused modules?**
  _Cohesion score 0.056840551181102365 - nodes in this community are weakly interconnected._
- **Why does `requireSession()` connect `requireSession` to `ymd`, `actions/tasks.ts`, `next`, `editor.tsx`, `[workspace]/page.tsx`, `colorVar`, `subscriptions.tsx`, `export/route.ts`, `routines/page.tsx`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `requireSession` be split into smaller, more focused modules?**
  _Cohesion score 0.059775366457262516 - nodes in this community are weakly interconnected._
- **Why does `react` connect `editor.tsx` to `ymd`, `requireSession`, `actions/tasks.ts`, `next`, `[workspace]/page.tsx`, `colorVar`, `subscriptions.tsx`, `package.json`, `routine-editor.tsx`, `routines/page.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `actions/tasks.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05193319606497369 - nodes in this community are weakly interconnected._