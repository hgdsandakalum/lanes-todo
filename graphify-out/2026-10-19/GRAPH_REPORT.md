# Graph Report - lanes-day1  (2026-10-19)

## Corpus Check
- 188 files · ~72,086 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 1, .log 1, .ico 1)

## Summary
- 1007 nodes · 3402 edges · 39 communities (33 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bd6d9e9b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- day-plan.tsx
- stages.ts
- react
- next
- dates.ts
- import.ts
- ymd
- subscriptions.tsx
- lanes.mjs
- schema.ts
- cli/route.ts
- xp.ts
- seed.ts
- compilerOptions
- package.json
- scripts
- actions.ts
- devDependencies
- Product
- actions/routines.ts
- routine.tsx
- dependencies
- @playwright/test
- app/layout.tsx
- app-app-page-tsx.md
- drizzle-kit
- AGENTS.md
- CLAUDE.md
- start.sh
- backup.sh
- dashboard/page.tsx
- engine.ts
- data/routines.ts
- requireSession
- notes.tsx
- ref_node_assert
- actions/tasks.ts
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
- `How it's built` --references--> `requireSession()`  [INFERRED]
  README.md → lib/auth/session.ts
- `Working with tasks` --references--> `weekdays()`  [INFERRED]
  README.md → lib/game/streaks.test.ts
- `How it's built` --references--> `safeHttpUrl()`  [INFERRED]
  README.md → lib/domain/repo.ts
- `Dashboard()` --calls--> `Heatmap()`  [EXTRACTED]
  app/(app)/dashboard/page.tsx → components/board/progress.tsx
- `Dashboard()` --calls--> `RoutineChecklist()`  [EXTRACTED]
  app/(app)/dashboard/page.tsx → components/board/routine.tsx

## Import Cycles
- None detected.

## Communities (39 total, 6 thin omitted)

### Community 0 - "day-plan.tsx"
Cohesion: 0.08
Nodes (54): Board(), BoardSkeleton(), HomePage(), metadata, List(), Overdue(), Place, StuckInReview() (+46 more)

### Community 1 - "stages.ts"
Cohesion: 0.08
Nodes (68): TaskPage(), TaskView(), QueenMedallion(), Boards(), GROUPS, inGroup(), PLACEHOLDER, TaskEditor() (+60 more)

### Community 2 - "react"
Cohesion: 0.08
Nodes (55): metadata, Routines(), RoutinesPage(), Counts(), tally(), Workspace(), WorkspacePage(), Row (+47 more)

### Community 3 - "next"
Cohesion: 0.07
Nodes (43): AppLayout(), metadata, Results(), SearchPage(), XpNote(), XpPulse(), SearchBox(), SearchShortcut() (+35 more)

### Community 4 - "dates.ts"
Cohesion: 0.19
Nodes (18): DAY_LABELS, Heatmap(), getGameSummary(), finishedForMe(), getToday(), tasksQuery(), addDays(), formatLong() (+10 more)

### Community 5 - "import.ts"
Cohesion: 0.07
Nodes (44): GET(), DataPage(), metadata, ImportForm(), RFC-4180, dataCounts(), fromBackup(), fromCsv() (+36 more)

### Community 6 - "ymd"
Cohesion: 0.13
Nodes (26): ProjectPage(), ProjectView(), Props, Area(), Panel(), Stat(), Release, ReleaseHistory() (+18 more)

### Community 7 - "subscriptions.tsx"
Cohesion: 0.11
Nodes (39): metadata, Subscriptions(), SubscriptionsPage(), DeleteButton(), PaymentHistory(), PER, ProjectOption, Row() (+31 more)

### Community 8 - "lanes.mjs"
Cohesion: 0.11
Nodes (23): bold(), call(), die(), dim(), git(), localToken(), main(), readJson() (+15 more)

### Community 9 - "schema.ts"
Cohesion: 0.06
Nodes (34): achievements, ChecklistItem, checklistItems, dayPlans, dayReviews, deepTasks, Label, labels (+26 more)

### Community 10 - "cli/route.ts"
Cohesion: 0.20
Nodes (25): add(), attach(), authorized(), Body, digest(), fail(), folderProject(), link() (+17 more)

### Community 11 - "xp.ts"
Cohesion: 0.14
Nodes (18): client, db, main(), Award, checkAward(), finishedAt(), GENERAL_DAILY_CAP, reached() (+10 more)

### Community 12 - "seed.ts"
Cohesion: 0.22
Nodes (7): client, db, PROJECTS, ROUTINES, WORKSPACES, StoredItem, STARTER_TEMPLATES

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 14 - "package.json"
Cohesion: 0.11
Nodes (17): eslintConfig, bin, lanes, name, private, version, eslint, eslint-config-next (+9 more)

### Community 15 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:backup, db:push, db:seed, db:setup, db:studio, dev (+7 more)

### Community 16 - "actions.ts"
Cohesion: 0.16
Nodes (15): LoginForm(), LoginPage(), metadata, clientIp(), digest(), login(), LoginState, logout() (+7 more)

### Community 17 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, drizzle-kit, eslint, eslint-config-next, @playwright/test, tailwindcss, @tailwindcss/turbopack, tsx (+4 more)

### Community 18 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 19 - "actions/routines.ts"
Cohesion: 0.23
Nodes (13): save(), saveRoutine(), syncDeepItems(), cleanRoutine(), ITEM_MAX, ITEM_TEXT_MAX, RoutineItem, SIGNAL_LABEL (+5 more)

### Community 20 - "routine.tsx"
Cohesion: 0.31
Nodes (9): Routine, RoutineChecklist(), toggle(), SignalLine(), announceXp(), move(), setRoutineItem(), SignalState (+1 more)

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

### Community 30 - "dashboard/page.tsx"
Cohesion: 0.19
Nodes (15): Dashboard(), DashboardPage(), metadata, SkillTracks(), Achievement, Achievements(), Badge(), getActivity() (+7 more)

### Community 31 - "engine.ts"
Cohesion: 0.30
Nodes (12): AchievementKey, ACHIEVEMENTS, balancedWeek(), fullStackWeek(), inboxZero(), paidOnTime(), tutorkitSteady(), checkAchievements() (+4 more)

### Community 32 - "data/routines.ts"
Cohesion: 0.27
Nodes (9): getDashboard(), taskWithPlace, getSignals(), n(), pick(), SignalTask, REVIEW_STAGE, STUCK_DAYS (+1 more)

### Community 33 - "requireSession"
Cohesion: 0.09
Nodes (51): metadata, Templates(), TemplatesPage(), AddLine(), Checklist(), CheckRow(), Dep, Dependencies() (+43 more)

### Community 34 - "notes.tsx"
Cohesion: 0.07
Nodes (60): metadata, Notes(), NotesPage(), Props, Chevron(), CodeIcon(), ComposeIcon(), Data (+52 more)

### Community 35 - "ref_node_assert"
Cohesion: 0.31
Nodes (3): earlier, none, now

### Community 36 - "actions/tasks.ts"
Cohesion: 0.07
Nodes (54): GET(), fail(), MAGIC, POST(), ShipRelease(), Waiting, pick(), shipRelease() (+46 more)

### Community 39 - "note-body.tsx"
Cohesion: 0.24
Nodes (8): CodePanel(), Hast, NoteBody(), textOf(), react-markdown, rehype-highlight, remark-breaks, remark-gfm

## Knowledge Gaps
- **9 isolated node(s):** `RFC-4180`, `react-dom`, `@tailwindcss/turbopack`, `@types/node`, `@types/react` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 266 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `day-plan.tsx`, `stages.ts`, `notes.tsx`, `react`, `actions/tasks.ts`, `import.ts`, `requireSession`, `subscriptions.tsx`, `ymd`, `lanes.mjs`, `package.json`, `actions.ts`, `actions/routines.ts`, `routine.tsx`, `app/layout.tsx`, `dashboard/page.tsx`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **What connects `RFC-4180`, `react-dom`, `@tailwindcss/turbopack` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `day-plan.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07715260017050299 - nodes in this community are weakly interconnected._
- **Why does `requireSession()` connect `requireSession` to `day-plan.tsx`, `stages.ts`, `notes.tsx`, `react`, `actions/tasks.ts`, `import.ts`, `next`, `subscriptions.tsx`, `data/routines.ts`, `dates.ts`, `ymd`, `actions/routines.ts`, `routine.tsx`, `dashboard/page.tsx`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Should `stages.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08089500860585198 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `day-plan.tsx`, `stages.ts`, `notes.tsx`, `next`, `requireSession`, `import.ts`, `ymd`, `subscriptions.tsx`, `note-body.tsx`, `actions/tasks.ts`, `package.json`, `actions.ts`, `routine.tsx`, `dashboard/page.tsx`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07587382779198636 - nodes in this community are weakly interconnected._