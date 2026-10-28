# Graph Report - lanes-day1  (2026-10-27)

## Corpus Check
- 190 files · ~74,280 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 1, .log 1, .ico 1)

## Summary
- 1031 nodes · 3501 edges · 35 communities (29 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b2b6f51a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- routine-editor.tsx
- stages.ts
- react
- colorVar
- engine.ts
- actions/tasks.ts
- ymd
- subscriptions.tsx
- lanes.mjs
- schema.ts
- cli/route.ts
- next
- seed.ts
- compilerOptions
- package.json
- scripts
- ref_node_assert
- devDependencies
- Product
- domain/routines.ts
- Lanes
- dependencies
- @playwright/test
- app/layout.tsx
- app-app-page-tsx.md
- drizzle-kit
- AGENTS.md
- CLAUDE.md
- start.sh
- backup.sh
- actions/routines.ts
- requireSession
- notes.tsx
- vercel.json
- note-body.tsx

## God Nodes (most connected - your core abstractions)
1. `requireSession()` - 103 edges
2. `ymd()` - 76 edges
3. `next` - 53 edges
4. `addDays()` - 45 edges
5. `react` - 38 edges
6. `drizzle-orm` - 37 edges
7. `db` - 33 edges
8. `TaskView()` - 30 edges
9. `Dashboard()` - 28 edges
10. `formatShort()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `How it's built` --references--> `requireSession()`  [INFERRED]
  README.md → lib/auth/session.ts
- `How it's built` --references--> `safeHttpUrl()`  [INFERRED]
  README.md → lib/domain/repo.ts
- `Working with tasks` --references--> `weekdays()`  [INFERRED]
  README.md → lib/game/streaks.test.ts
- `save()` --calls--> `saveRoutine()`  [EXTRACTED]
  components/routines/routine-editor.tsx → lib/actions/routines.ts
- `Dashboard()` --calls--> `getXpSummary`  [EXTRACTED]
  app/(app)/dashboard/page.tsx → lib/data/shell.ts

## Import Cycles
- None detected.

## Communities (35 total, 6 thin omitted)

### Community 0 - "routine-editor.tsx"
Cohesion: 0.23
Nodes (13): metadata, Routines(), RoutinesPage(), DAYS, daysLabel(), FIXED, NewRoutine(), Routine (+5 more)

### Community 1 - "stages.ts"
Cohesion: 0.06
Nodes (87): TaskPage(), TaskView(), QueenMedallion(), announceXp(), Boards(), GROUPS, inGroup(), PLACEHOLDER (+79 more)

### Community 2 - "react"
Cohesion: 0.08
Nodes (50): metadata, Templates(), TemplatesPage(), Counts(), tally(), Workspace(), WorkspacePage(), AddProject() (+42 more)

### Community 3 - "colorVar"
Cohesion: 0.13
Nodes (28): AppLayout(), XpNote(), XpPulse(), SearchShortcut(), LevelBar(), LevelBarSkeleton(), LevelBarView(), BottomNav() (+20 more)

### Community 4 - "engine.ts"
Cohesion: 0.10
Nodes (30): client, db, main(), AchievementKey, ACHIEVEMENTS, balancedWeek(), fullStackWeek(), inboxZero() (+22 more)

### Community 5 - "actions/tasks.ts"
Cohesion: 0.06
Nodes (74): DataPage(), metadata, ImportForm(), ShipRelease(), Waiting, Kbd(), QuickAdd(), QuickAddProject (+66 more)

### Community 6 - "ymd"
Cohesion: 0.06
Nodes (92): Dashboard(), DashboardPage(), metadata, Board(), BoardSkeleton(), HomePage(), metadata, ProjectPage() (+84 more)

### Community 7 - "subscriptions.tsx"
Cohesion: 0.11
Nodes (39): metadata, Subscriptions(), SubscriptionsPage(), DeleteButton(), PaymentHistory(), PER, ProjectOption, Row() (+31 more)

### Community 8 - "lanes.mjs"
Cohesion: 0.11
Nodes (23): bold(), call(), die(), dim(), git(), localToken(), main(), readJson() (+15 more)

### Community 9 - "schema.ts"
Cohesion: 0.05
Nodes (35): achievements, ChecklistItem, checklistItems, dayPlans, dayReviews, deepTasks, Label, labels (+27 more)

### Community 10 - "cli/route.ts"
Cohesion: 0.15
Nodes (35): access(), add(), attach(), Body, brief(), brieft(), detail(), digest() (+27 more)

### Community 11 - "next"
Cohesion: 0.05
Nodes (61): GET(), GET(), fail(), MAGIC, POST(), metadata, Results(), SearchPage() (+53 more)

### Community 12 - "seed.ts"
Cohesion: 0.20
Nodes (8): client, db, PROJECTS, ROUTINES, WORKSPACES, StoredItem, SWEEP_ITEMS, STARTER_TEMPLATES

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 14 - "package.json"
Cohesion: 0.11
Nodes (17): eslintConfig, bin, lanes, name, private, version, eslint, eslint-config-next (+9 more)

### Community 15 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:backup, db:push, db:seed, db:setup, db:studio, dev (+7 more)

### Community 16 - "ref_node_assert"
Cohesion: 0.09
Nodes (23): LoginForm(), LoginPage(), metadata, RFC-4180, clientIp(), digest(), login(), LoginState (+15 more)

### Community 17 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, drizzle-kit, eslint, eslint-config-next, @playwright/test, tailwindcss, @tailwindcss/turbopack, tsx (+4 more)

### Community 18 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 19 - "domain/routines.ts"
Cohesion: 0.25
Nodes (7): ITEM_MAX, ITEM_TEXT_MAX, RoutineItem, Signal, SIGNAL_LABEL, SIGNALS, TITLE_MAX

### Community 20 - "Lanes"
Cohesion: 0.18
Nodes (10): Backups, Browser tests, Deploy (Turso + Vercel), How it's built, Lanes, Progress, Run it locally, Scripts (+2 more)

### Community 21 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, drizzle-orm, @fontsource-variable/archivo, @libsql/client, next, react, react-dom, react-markdown (+5 more)

### Community 22 - "@playwright/test"
Cohesion: 0.20
Nodes (3): tag, PAGES, @playwright/test

### Community 23 - "app/layout.tsx"
Cohesion: 0.33
Nodes (3): metadata, viewport, @fontsource-variable/archivo

### Community 24 - "app-app-page-tsx.md"
Cohesion: 0.50
Nodes (3): Direction contract, Open decisions, Scope

### Community 30 - "actions/routines.ts"
Cohesion: 0.47
Nodes (7): toggle(), saveRoutine(), setRoutineItem(), syncDeepItems(), cleanRoutine(), toItems(), reconcileRoutine()

### Community 33 - "requireSession"
Cohesion: 0.15
Nodes (35): AddLine(), Checklist(), CheckRow(), Dep, Dependencies(), DepLink(), ErrorLine(), Heading() (+27 more)

### Community 34 - "notes.tsx"
Cohesion: 0.07
Nodes (61): metadata, Notes(), NotesPage(), Props, NoteBody(), Chevron(), CodeIcon(), ComposeIcon() (+53 more)

### Community 39 - "note-body.tsx"
Cohesion: 0.25
Nodes (7): CodePanel(), Hast, textOf(), react-markdown, rehype-highlight, remark-breaks, remark-gfm

## Knowledge Gaps
- **9 isolated node(s):** `RFC-4180`, `react-dom`, `@tailwindcss/turbopack`, `@types/node`, `@types/react` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 273 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `routine-editor.tsx`, `stages.ts`, `notes.tsx`, `colorVar`, `react`, `actions/tasks.ts`, `ymd`, `subscriptions.tsx`, `requireSession`, `lanes.mjs`, `package.json`, `ref_node_assert`, `app/layout.tsx`, `actions/routines.ts`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **What connects `RFC-4180`, `react-dom`, `@tailwindcss/turbopack` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `stages.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06154117439605008 - nodes in this community are weakly interconnected._
- **Why does `requireSession()` connect `requireSession` to `routine-editor.tsx`, `stages.ts`, `notes.tsx`, `react`, `colorVar`, `actions/tasks.ts`, `ymd`, `subscriptions.tsx`, `next`, `Lanes`, `actions/routines.ts`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.08448540706605223 - nodes in this community are weakly interconnected._
- **Why does `ymd()` connect `ymd` to `stages.ts`, `react`, `colorVar`, `notes.tsx`, `actions/tasks.ts`, `engine.ts`, `subscriptions.tsx`, `lanes.mjs`, `cli/route.ts`, `next`, `actions/routines.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Should `colorVar` be split into smaller, more focused modules?**
  _Cohesion score 0.13015873015873017 - nodes in this community are weakly interconnected._