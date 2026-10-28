# Graph Report - lanes-day1  (2026-10-20)

## Corpus Check
- 188 files · ~72,550 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 1, .log 1, .ico 1)

## Summary
- 1011 nodes · 3412 edges · 33 communities (27 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ab28702c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- requireSession
- stages.ts
- actions/tasks.ts
- next
- xp.ts
- import.ts
- dashboard/page.tsx
- subscriptions.tsx
- lanes.mjs
- schema.ts
- cli/route.ts
- dates.ts
- seed.ts
- compilerOptions
- package.json
- scripts
- devDependencies
- Product
- domain/routines.ts
- search/page.tsx
- dependencies
- @playwright/test
- app/layout.tsx
- app-app-page-tsx.md
- drizzle-kit
- AGENTS.md
- CLAUDE.md
- start.sh
- backup.sh
- sections.tsx
- notes.tsx
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

## Communities (33 total, 6 thin omitted)

### Community 0 - "requireSession"
Cohesion: 0.06
Nodes (68): Board(), BoardSkeleton(), HomePage(), metadata, metadata, Routines(), RoutinesPage(), Routine (+60 more)

### Community 1 - "stages.ts"
Cohesion: 0.07
Nodes (71): TaskPage(), TaskView(), QueenMedallion(), announceXp(), Boards(), GROUPS, inGroup(), TaskEditor() (+63 more)

### Community 2 - "actions/tasks.ts"
Cohesion: 0.06
Nodes (75): metadata, Templates(), TemplatesPage(), AddProject(), ArchivedRow(), remove(), ColorField(), Field() (+67 more)

### Community 3 - "next"
Cohesion: 0.07
Nodes (42): AppLayout(), LoginForm(), LoginPage(), metadata, XpNote(), XpPulse(), SearchShortcut(), LevelBar() (+34 more)

### Community 4 - "xp.ts"
Cohesion: 0.14
Nodes (19): client, db, main(), workflow(), Award, checkAward(), finishedAt(), GENERAL_DAILY_CAP (+11 more)

### Community 5 - "import.ts"
Cohesion: 0.09
Nodes (29): GET(), DataPage(), metadata, ImportForm(), RFC-4180, dataCounts(), fromBackup(), fromCsv() (+21 more)

### Community 6 - "dashboard/page.tsx"
Cohesion: 0.06
Nodes (72): Dashboard(), DashboardPage(), metadata, Counts(), tally(), Workspace(), WorkspacePage(), ProjectPage() (+64 more)

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
Cohesion: 0.14
Nodes (34): add(), attach(), authorized(), Body, digest(), fail(), folderProject(), link() (+26 more)

### Community 11 - "dates.ts"
Cohesion: 0.06
Nodes (66): GET(), DAY_LABELS, Heatmap(), shipRelease(), enc, fromB64(), key(), secret() (+58 more)

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

### Community 17 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, drizzle-kit, eslint, eslint-config-next, @playwright/test, tailwindcss, @tailwindcss/turbopack, tsx (+4 more)

### Community 18 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 19 - "domain/routines.ts"
Cohesion: 0.47
Nodes (4): cleanRoutine(), ITEM_TEXT_MAX, SWEEP_ITEMS, TITLE_MAX

### Community 20 - "search/page.tsx"
Cohesion: 0.29
Nodes (10): metadata, Results(), SearchPage(), SearchBox(), Hit, likeI(), pattern(), search() (+2 more)

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

### Community 33 - "sections.tsx"
Cohesion: 0.12
Nodes (35): AddLine(), Checklist(), CheckRow(), Dep, Dependencies(), DepLink(), ErrorLine(), Heading() (+27 more)

### Community 34 - "notes.tsx"
Cohesion: 0.06
Nodes (70): fail(), MAGIC, POST(), metadata, Notes(), NotesPage(), Props, Chevron() (+62 more)

### Community 39 - "note-body.tsx"
Cohesion: 0.24
Nodes (8): CodePanel(), Hast, NoteBody(), textOf(), react-markdown, rehype-highlight, remark-breaks, remark-gfm

## Knowledge Gaps
- **9 isolated node(s):** `RFC-4180`, `react-dom`, `@tailwindcss/turbopack`, `@types/node`, `@types/react` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 268 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `requireSession`, `stages.ts`, `notes.tsx`, `actions/tasks.ts`, `sections.tsx`, `import.ts`, `dashboard/page.tsx`, `subscriptions.tsx`, `lanes.mjs`, `dates.ts`, `package.json`, `search/page.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **What connects `RFC-4180`, `react-dom`, `@tailwindcss/turbopack` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `requireSession` be split into smaller, more focused modules?**
  _Cohesion score 0.06327006327006326 - nodes in this community are weakly interconnected._
- **Why does `requireSession()` connect `requireSession` to `sections.tsx`, `actions/tasks.ts`, `notes.tsx`, `stages.ts`, `import.ts`, `dashboard/page.tsx`, `subscriptions.tsx`, `next`, `dates.ts`, `search/page.tsx`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `stages.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07328907048008172 - nodes in this community are weakly interconnected._
- **Why does `react` connect `actions/tasks.ts` to `requireSession`, `stages.ts`, `notes.tsx`, `next`, `sections.tsx`, `import.ts`, `dashboard/page.tsx`, `subscriptions.tsx`, `note-body.tsx`, `dates.ts`, `package.json`, `search/page.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `actions/tasks.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.057971014492753624 - nodes in this community are weakly interconnected._