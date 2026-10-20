# Graph Report - lanes-day1  (2026-10-19)

## Corpus Check
- 188 files · ~72,490 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 1, .log 1, .ico 1)

## Summary
- 1010 nodes · 3411 edges · 38 communities (32 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ab28702c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- (app)/page.tsx
- stages.ts
- project-header.tsx
- next
- client.ts
- actions/tasks.ts
- ymd
- subscriptions.tsx
- lanes.mjs
- schema.ts
- cli/route.ts
- dates.ts
- routine-editor.tsx
- compilerOptions
- package.json
- scripts
- images/route.ts
- devDependencies
- Product
- data/routines.ts
- search.ts
- dependencies
- @playwright/test
- app/layout.tsx
- app-app-page-tsx.md
- drizzle-kit
- AGENTS.md
- CLAUDE.md
- start.sh
- backup.sh
- levels.ts
- csv.ts
- dashboard.ts
- requireSession
- notes.tsx
- export/route.ts
- vercel.json
- note-body.tsx

## God Nodes (most connected - your core abstractions)
1. `requireSession()` - 103 edges
2. `ymd()` - 73 edges
3. `next` - 53 edges
4. `addDays()` - 43 edges
5. `react` - 38 edges
6. `drizzle-orm` - 37 edges
7. `db` - 33 edges
8. `TaskView()` - 30 edges
9. `Dashboard()` - 28 edges
10. `formatShort()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `How it's built` --references--> `safeHttpUrl()`  [INFERRED]
  README.md → lib/domain/repo.ts
- `Working with tasks` --references--> `weekdays()`  [INFERRED]
  README.md → lib/game/streaks.test.ts
- `How it's built` --references--> `requireSession()`  [INFERRED]
  README.md → lib/auth/session.ts
- `save()` --calls--> `saveRoutine()`  [EXTRACTED]
  components/routines/routine-editor.tsx → lib/actions/routines.ts
- `Dashboard()` --calls--> `Heatmap()`  [EXTRACTED]
  app/(app)/dashboard/page.tsx → components/board/progress.tsx

## Import Cycles
- None detected.

## Communities (38 total, 6 thin omitted)

### Community 0 - "(app)/page.tsx"
Cohesion: 0.20
Nodes (16): Board(), BoardSkeleton(), HomePage(), metadata, RenewalsDue(), around(), carryOver(), getDayReview() (+8 more)

### Community 1 - "stages.ts"
Cohesion: 0.06
Nodes (103): metadata, Results(), SearchPage(), TaskPage(), TaskView(), QueenMedallion(), List(), Overdue() (+95 more)

### Community 2 - "project-header.tsx"
Cohesion: 0.09
Nodes (44): metadata, Templates(), TemplatesPage(), AddProject(), ArchivedProjects(), ArchivedRow(), remove(), ColorField() (+36 more)

### Community 3 - "next"
Cohesion: 0.06
Nodes (44): AppLayout(), LoginForm(), LoginPage(), metadata, XpNote(), XpPulse(), SearchShortcut(), LevelBar() (+36 more)

### Community 4 - "client.ts"
Cohesion: 0.39
Nodes (6): TaskPage, db, g, WEEKLY_THREE_SLUGS, drizzle-orm, server-only

### Community 5 - "actions/tasks.ts"
Cohesion: 0.07
Nodes (62): DataPage(), metadata, ImportForm(), Kbd(), QuickAdd(), QuickAddProject, typing(), dataCounts() (+54 more)

### Community 6 - "ymd"
Cohesion: 0.07
Nodes (63): Dashboard(), DashboardPage(), metadata, Counts(), tally(), Workspace(), WorkspacePage(), ProjectPage() (+55 more)

### Community 7 - "subscriptions.tsx"
Cohesion: 0.11
Nodes (36): metadata, Subscriptions(), SubscriptionsPage(), DeleteButton(), PaymentHistory(), PER, ProjectOption, Row() (+28 more)

### Community 8 - "lanes.mjs"
Cohesion: 0.11
Nodes (23): bold(), call(), die(), dim(), git(), localToken(), main(), readJson() (+15 more)

### Community 9 - "schema.ts"
Cohesion: 0.04
Nodes (42): achievements, ChecklistItem, checklistItems, dayPlans, dayReviews, deepTasks, Label, labels (+34 more)

### Community 10 - "cli/route.ts"
Cohesion: 0.20
Nodes (25): add(), attach(), authorized(), Body, digest(), fail(), folderProject(), link() (+17 more)

### Community 11 - "dates.ts"
Cohesion: 0.07
Nodes (51): DAY_LABELS, Heatmap(), getGameSummary(), client, db, main(), addDays(), formatLong() (+43 more)

### Community 12 - "routine-editor.tsx"
Cohesion: 0.18
Nodes (16): metadata, Routines(), RoutinesPage(), DAYS, daysLabel(), FIXED, NewRoutine(), Routine (+8 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 14 - "package.json"
Cohesion: 0.11
Nodes (17): eslintConfig, bin, lanes, name, private, version, eslint, eslint-config-next (+9 more)

### Community 15 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:backup, db:push, db:seed, db:setup, db:studio, dev (+7 more)

### Community 16 - "images/route.ts"
Cohesion: 0.36
Nodes (10): fail(), MAGIC, POST(), imagePath(), deleteImages(), onBlob(), readImage(), safe() (+2 more)

### Community 17 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, drizzle-kit, eslint, eslint-config-next, @playwright/test, tailwindcss, @tailwindcss/turbopack, tsx (+4 more)

### Community 18 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 19 - "data/routines.ts"
Cohesion: 0.19
Nodes (18): Routine, RoutineChecklist(), toggle(), SignalLine(), announceXp(), saveRoutine(), setRoutineItem(), syncDeepItems() (+10 more)

### Community 20 - "search.ts"
Cohesion: 0.43
Nodes (6): Hit, likeI(), pattern(), search(), snippet(), TASK_FIELDS

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

### Community 30 - "levels.ts"
Cohesion: 0.50
Nodes (4): levelFromXp(), LevelInfo, TITLES, xpForLevel()

### Community 31 - "csv.ts"
Cohesion: 0.60
Nodes (4): RFC-4180, csvRecords(), parseCsv(), toCsv()

### Community 32 - "dashboard.ts"
Cohesion: 0.43
Nodes (5): getDashboard(), taskWithPlace, REVIEW_STAGE, STUCK_DAYS, weeklyScore()

### Community 33 - "requireSession"
Cohesion: 0.09
Nodes (47): AddLine(), Checklist(), CheckRow(), Dep, Dependencies(), DepLink(), ErrorLine(), Heading() (+39 more)

### Community 34 - "notes.tsx"
Cohesion: 0.07
Nodes (61): metadata, Notes(), NotesPage(), Props, NoteBody(), Chevron(), CodeIcon(), ComposeIcon() (+53 more)

### Community 36 - "export/route.ts"
Cohesion: 0.23
Nodes (13): GET(), GET(), enc, fromB64(), key(), secret(), SESSION_COOKIE, SESSION_DAYS (+5 more)

### Community 39 - "note-body.tsx"
Cohesion: 0.25
Nodes (7): CodePanel(), Hast, textOf(), react-markdown, rehype-highlight, remark-breaks, remark-gfm

## Knowledge Gaps
- **9 isolated node(s):** `RFC-4180`, `react-dom`, `@tailwindcss/turbopack`, `@types/node`, `@types/react` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 267 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `(app)/page.tsx`, `stages.ts`, `notes.tsx`, `project-header.tsx`, `export/route.ts`, `actions/tasks.ts`, `ymd`, `subscriptions.tsx`, `requireSession`, `client.ts`, `lanes.mjs`, `routine-editor.tsx`, `package.json`, `images/route.ts`, `data/routines.ts`, `app/layout.tsx`?**
  _High betweenness centrality (0.201) - this node is a cross-community bridge._
- **What connects `RFC-4180`, `react-dom`, `@tailwindcss/turbopack` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `stages.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05571705426356589 - nodes in this community are weakly interconnected._
- **Why does `requireSession()` connect `requireSession` to `dashboard.ts`, `stages.ts`, `notes.tsx`, `project-header.tsx`, `client.ts`, `actions/tasks.ts`, `ymd`, `subscriptions.tsx`, `export/route.ts`, `(app)/page.tsx`, `next`, `dates.ts`, `routine-editor.tsx`, `data/routines.ts`, `search.ts`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Should `project-header.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09225589225589226 - nodes in this community are weakly interconnected._
- **Why does `react` connect `stages.ts` to `(app)/page.tsx`, `requireSession`, `notes.tsx`, `next`, `project-header.tsx`, `actions/tasks.ts`, `ymd`, `subscriptions.tsx`, `note-body.tsx`, `client.ts`, `routine-editor.tsx`, `package.json`, `data/routines.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.06346153846153846 - nodes in this community are weakly interconnected._