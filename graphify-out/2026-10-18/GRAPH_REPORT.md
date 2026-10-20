# Graph Report - lanes-day1  (2026-10-18)

## Corpus Check
- 173 files · ~62,693 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 1, .log 1, .ico 1)

## Summary
- 899 nodes · 2975 edges · 39 communities (33 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9973f047`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ymd
- stages.ts
- quick-add.ts
- next
- editor.tsx
- [workspace]/page.tsx
- colorVar
- subscriptions.tsx
- lanes.mjs
- schema.ts
- cli/route.ts
- engine.ts
- session.ts
- compilerOptions
- package.json
- scripts
- actions/routines.ts
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
- actions/tasks.ts
- client.ts
- requireSession
- import.ts
- notes.ts
- Lanes
- levels.ts
- eslint.config.mjs
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `requireSession()` - 93 edges
2. `ymd()` - 66 edges
3. `next` - 48 edges
4. `addDays()` - 43 edges
5. `react` - 35 edges
6. `drizzle-orm` - 33 edges
7. `db` - 29 edges
8. `formatShort()` - 29 edges
9. `Dashboard()` - 27 edges
10. `TaskType` - 27 edges

## Surprising Connections (you probably didn't know these)
- `How it's built` --references--> `requireSession()`  [INFERRED]
  README.md → lib/auth/session.ts
- `How it's built` --references--> `safeHttpUrl()`  [INFERRED]
  README.md → lib/domain/repo.ts
- `Working with tasks` --references--> `weekdays()`  [INFERRED]
  README.md → lib/game/streaks.test.ts
- `TaskEditor()` --indirect_call--> `updateTask()`  [INFERRED]
  components/task/editor.tsx → lib/actions/tasks.ts
- `TemplateCard()` --indirect_call--> `createFromTemplate()`  [INFERRED]
  components/templates/templates.tsx → lib/actions/templates.ts

## Import Cycles
- None detected.

## Communities (39 total, 6 thin omitted)

### Community 0 - "ymd"
Cohesion: 0.07
Nodes (64): Dashboard(), DashboardPage(), metadata, Board(), BoardSkeleton(), HomePage(), metadata, DAY_LABELS (+56 more)

### Community 1 - "stages.ts"
Cohesion: 0.07
Nodes (82): TaskPage(), TaskView(), oct(), QueenMedallion(), announceXp(), Boards(), GROUPS, inGroup() (+74 more)

### Community 2 - "quick-add.ts"
Cohesion: 0.13
Nodes (18): createFromTemplate(), clamp(), ESTIMATE_MAX, parseDuration(), DAYS, DESCRIPTION_MAX, dueFrom(), fail() (+10 more)

### Community 3 - "next"
Cohesion: 0.09
Nodes (31): AppLayout(), XpNote(), XpPulse(), SearchShortcut(), LevelBar(), LevelBarSkeleton(), LevelBarView(), BottomNav() (+23 more)

### Community 4 - "editor.tsx"
Cohesion: 0.09
Nodes (47): metadata, Templates(), TemplatesPage(), AddProject(), ArchivedProjects(), ArchivedRow(), remove(), ColorField() (+39 more)

### Community 5 - "[workspace]/page.tsx"
Cohesion: 0.10
Nodes (30): Counts(), tally(), Workspace(), WorkspacePage(), ProjectPage(), ProjectView(), Props, Area() (+22 more)

### Community 6 - "colorVar"
Cohesion: 0.13
Nodes (31): metadata, Results(), SearchPage(), Routine, SignalLine(), List(), Overdue(), Place (+23 more)

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
Cohesion: 0.15
Nodes (31): add(), attach(), authorized(), Body, digest(), fail(), folderProject(), link() (+23 more)

### Community 11 - "engine.ts"
Cohesion: 0.09
Nodes (35): InvoiceButton(), setInvoiced(), client, db, main(), workflow(), AchievementKey, ACHIEVEMENTS (+27 more)

### Community 12 - "session.ts"
Cohesion: 0.09
Nodes (31): GET(), LoginForm(), LoginPage(), metadata, RFC-4180, clientIp(), digest(), login() (+23 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 14 - "package.json"
Cohesion: 0.12
Nodes (15): bin, lanes, name, private, version, react-dom, react-markdown, remark-gfm (+7 more)

### Community 15 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:backup, db:push, db:seed, db:setup, db:studio, dev (+7 more)

### Community 16 - "actions/routines.ts"
Cohesion: 0.17
Nodes (18): DAYS, daysLabel(), FIXED, Routine, RoutineForm(), save(), deleteRoutine(), saveRoutine() (+10 more)

### Community 17 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, drizzle-kit, eslint, eslint-config-next, @playwright/test, tailwindcss, @tailwindcss/turbopack, tsx (+4 more)

### Community 18 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 19 - "routines/page.tsx"
Cohesion: 0.48
Nodes (6): metadata, Routines(), RoutinesPage(), NewRoutine(), RoutineCard(), listRoutines()

### Community 20 - "seed.ts"
Cohesion: 0.22
Nodes (7): client, db, PROJECTS, ROUTINES, WORKSPACES, StoredItem, STARTER_TEMPLATES

### Community 21 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, drizzle-orm, @fontsource-variable/archivo, @libsql/client, next, react, react-dom, react-markdown (+2 more)

### Community 22 - "@playwright/test"
Cohesion: 0.20
Nodes (3): tag, PAGES, @playwright/test

### Community 23 - "app/layout.tsx"
Cohesion: 0.33
Nodes (3): metadata, viewport, @fontsource-variable/archivo

### Community 24 - "app-app-page-tsx.md"
Cohesion: 0.50
Nodes (3): Direction contract, Open decisions, Scope

### Community 30 - "actions/tasks.ts"
Cohesion: 0.22
Nodes (18): createTask(), deleteTask(), field(), optionalInt(), updateTask(), isYmd(), zonedTime(), DAY_NAMES (+10 more)

### Community 31 - "client.ts"
Cohesion: 0.27
Nodes (10): Hit, likeI(), pattern(), search(), snippet(), TASK_FIELDS, db, g (+2 more)

### Community 32 - "requireSession"
Cohesion: 0.25
Nodes (17): addChecklistItems(), addDependency(), addRef(), addSubtask(), deleteChecklistItem(), deleteRef(), exists(), logTime() (+9 more)

### Community 33 - "import.ts"
Cohesion: 0.24
Nodes (14): DataPage(), metadata, ImportForm(), dataCounts(), fromBackup(), fromCsv(), ImportResult, previewImport() (+6 more)

### Community 34 - "notes.ts"
Cohesion: 0.20
Nodes (12): ageGroup(), ALL, DELETED, fullStamp(), lines(), listStamp(), NOTE_MAX, notePreview() (+4 more)

### Community 35 - "Lanes"
Cohesion: 0.18
Nodes (10): Backups, Browser tests, Deploy (Turso + Vercel), How it's built, Lanes, Progress, Run it locally, Scripts (+2 more)

### Community 36 - "levels.ts"
Cohesion: 0.50
Nodes (4): levelFromXp(), LevelInfo, TITLES, xpForLevel()

### Community 37 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

## Knowledge Gaps
- **9 isolated node(s):** `RFC-4180`, `react-dom`, `@tailwindcss/turbopack`, `@types/node`, `@types/react` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 253 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `ymd`, `import.ts`, `stages.ts`, `requireSession`, `editor.tsx`, `[workspace]/page.tsx`, `colorVar`, `subscriptions.tsx`, `quick-add.ts`, `lanes.mjs`, `engine.ts`, `session.ts`, `package.json`, `actions/routines.ts`, `routines/page.tsx`, `app/layout.tsx`, `actions/tasks.ts`, `client.ts`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **What connects `RFC-4180`, `react-dom`, `@tailwindcss/turbopack` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ymd` be split into smaller, more focused modules?**
  _Cohesion score 0.0673616680032077 - nodes in this community are weakly interconnected._
- **Why does `requireSession()` connect `requireSession` to `ymd`, `import.ts`, `stages.ts`, `quick-add.ts`, `editor.tsx`, `[workspace]/page.tsx`, `next`, `subscriptions.tsx`, `Lanes`, `engine.ts`, `session.ts`, `actions/routines.ts`, `routines/page.tsx`, `actions/tasks.ts`, `client.ts`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `stages.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06626262626262626 - nodes in this community are weakly interconnected._
- **Why does `drizzle-orm` connect `client.ts` to `requireSession`, `import.ts`, `stages.ts`, `quick-add.ts`, `editor.tsx`, `ymd`, `[workspace]/page.tsx`, `subscriptions.tsx`, `schema.ts`, `cli/route.ts`, `engine.ts`, `session.ts`, `package.json`, `actions/routines.ts`, `seed.ts`, `actions/tasks.ts`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Should `quick-add.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1341991341991342 - nodes in this community are weakly interconnected._