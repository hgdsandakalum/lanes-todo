# Lanes

A personal, gamified work tracker. Next.js 16 · SQLite (Turso) · Drizzle · Tailwind 4.

## Run it locally

```bash
npm install
cp .env.example .env.local      # then set APP_PASSWORD and AUTH_SECRET
npm run db:setup                # creates local.db and seeds workspaces, projects, routines
npm run dev                     # http://localhost:3000
```

Generate an `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build and server |
| `npm run db:push` | Apply `lib/db/schema.ts` to the database (read its warnings; never add `--force` on a database with data) |
| `npm run db:seed` | Add workspaces, projects and routines (safe to re-run) |
| `npm run db:studio` | Browse the database in Drizzle Studio |
| `npm run typecheck` / `lint` | Checks |
| `npm test` | Unit tests for the plain-TypeScript rules in `lib/domain/` and `lib/game/` |
| `npx tsx scripts/make-icons.tsx` | Re-render the app icons in `public/icons/` after a design change |
| `npm run xp:rebuild` | Recompute every XP event from tasks, picks and routine ticks (after an import or a rule change) |

## Working with tasks

- **Every task has a page** (`/t/<id>`, open it from any title): notes and technical context in Markdown, a checklist, subtasks, pull requests, issues and commits, dependencies, labels, and a timer. The edit form sits at the bottom of the page.
- **Code work comes in kinds**, each with its own icon, fields and stages (`lib/domain/stages.ts`):

  | Kind | Stages | Extra fields |
  |---|---|---|
  | Feature, Refactor | To do → In progress → In review → Dev released → (Staging) → Prod released | Acceptance criteria |
  | Bug fix | To do → Reproduced → Fixing → In review → Dev released → (Staging) → Prod released | Steps to reproduce, expected and actual behaviour, acceptance criteria |
  | Code review | To do → Reviewing → Changes requested → Reviewed | |
  | Test & deploy | To do → Testing → Deploying → Deployed | Acceptance criteria |
  | Research / tech debt | To do → Investigating → Written up | |

- **Quick add takes more shortcuts:** `@bug` (or any kind), `*high` (priority: urgent, high, medium, low or 1–4), `+label`, `~2h` (estimate).
- **Priorities** sort lists (urgent first) and show as bars. **Reminders** are stored now and arrive as phone pushes once Lanes is deployed. **Repeating tasks** (`every fri`, `weekdays`, `monthly 15`) make their next copy, with labels and an unticked checklist, when they close.
- **XP for small steps:** a finished subtask earns 3 XP and a ticked checklist item 1 XP, together capped at 30 XP a day (`SMALL_DAILY_XP` in `lib/game/xp.ts`).
- **Today's list** on Today: pick the tasks for the day, run a timer from the list, see planned against spent time. Unfinished tasks carry over to the next day's list automatically, the first time it's opened. **End of day** shows what got finished, what moved, time and XP, and closes the day with a note.
- **Templates** (`/templates`): reusable checklists. Release, PR review and Deployment come seeded; start a task from one, or add one to any task's checklist.
- **Search** (`/search`, or press `/`): titles, notes, technical fields, checklists, labels, branches, tickets, PRs and commits, projects, releases and end-of-day notes.
- **Routines** (`/routines`): the checklists on Today (Morning sweep on weekdays, Admin slot, TutorKit blocks, Weekly review). Edit their items and days, or add your own. An item can carry a live count from your tasks (code in review, not in production, due by tomorrow, to invoice) with the tasks a click away; "Pick today's deep task" ticks itself. A finished routine folds to one line.
- **Subscriptions** (`/subscriptions`): services you pay for on repeat, with price, billing cycle, next renewal, card and an optional project. Totals a month and a year per currency (no exchange rates); "Mark paid" records the payment and moves to the next renewal (undo takes back the latest). Renewals due within a week also show on Today.
- **Import & export** (`/data`): a full JSON backup, a CSV of tasks, and imports that only add (a CSV of tasks, or tasks from a Lanes backup). Imports are previewed before anything is written.

## The lanes command

Lanes in the terminal, from inside a project's repo. It sends the folder and the current git branch to the app, which works out the project and the task. Install it once from this folder with `npm link`.

```bash
lanes link ot                        # once per repo: this folder is Otasuke's
lanes                                # open tasks here; ● marks the ones on your branch
lanes add "Login page"               # files it in Otasuke, on your current branch, as a code task
lanes add 'Fix redirect !fri' -m "## Steps
- [ ] reproduce"                     # quick-add shortcuts work; -m adds a Markdown description
lanes review                         # the task on this branch → In review (+XP)
lanes released | staging | prod | start | done
lanes move "in progress" 900728      # any stage, any task by id
lanes attach 900728                  # put the current branch on an existing task
```

- **Quote with single quotes when the line has `!`.** zsh treats `!fri` inside double quotes as history.
- **Shared branches are left off.** On `main`, `master`, `develop`, `staging` and the like, `lanes add` doesn't attach the branch.
- **Settings.** Locally it needs nothing: it calls `http://localhost:3000` with `LANES_CLI_TOKEN` from `.env.local`, so the app has to be running (`npm run dev`). After a deploy, point it at the live app in `~/.config/lanes.json`: `{"url": "https://…", "token": "…"}` (or `LANES_URL` / `LANES_TOKEN`).
- **With Claude Code.** The `lanes` skill in `~/.claude/skills/lanes` lets Claude check the task for your branch, attach branches and add tasks, and it always asks before changing a task's stage.
- **How it's built.** `bin/lanes.mjs` (plain Node, no dependencies) posts to `app/api/cli/route.ts`, which checks a bearer token (`LANES_CLI_TOKEN`, 32+ characters; unset turns it off) and uses the same task writes as the app (`lib/tasks/core.ts`), so XP and stage history match. Folder and stage lookups are in `lib/domain/folders.ts`.

## Deploy (Turso + Vercel)

1. Create the database: `turso db create lanes`, then `turso db show lanes --url` and `turso db tokens create lanes`.
2. Put that URL and token in `DATABASE_URL` / `DATABASE_AUTH_TOKEN` in `.env.local`, then run `npm run db:setup` once.
   On a database that already has data, back it up first and apply the files in `drizzle/manual/` in date order (the routines file replaces three routines' items, so skip it if you've already edited them) (with `turso db shell lanes < file.sql`), then `npm run db:seed` for the starter templates, before `db:push`: drizzle-kit wants to empty a table for some column additions and only warns once.
3. Import the repo in Vercel and set the variables from `.env.example` (`LANES_CLI_TOKEN` only if you'll use the lanes command against the live app).

## How it's built

- **Every page is a partial prerender.** The shell (layout, headings) is static and instant; your data streams in inside `<Suspense>`. Data loaders live in `lib/data/` and each starts with `requireSession()`.
- **Auth is a single passcode.** `proxy.ts` does a fast cookie check on every request; `requireSession()` re-checks before any data is read. The cookie is HMAC-signed and lasts 30 days.
- **Rules are plain TypeScript.** Stages (`lib/domain/stages.ts`) and the level curve (`lib/game/levels.ts`) have no React or database code, so they're easy to test.
- **XP is never stored as a total.** It's summed from `xp_events`, so it can't drift. Each event has a unique key (`t:<task>:dev`, `r:<day>:sweep`), and every action reconciles what a task or routine day should hold against what's stored (`lib/game/engine.ts`): moving forward adds XP, moving back removes it, and nothing pays twice.
- **Game rules are plain functions with tests.** XP amounts and awards (`lib/game/xp.ts`), streaks with one rest day a week (`streaks.ts`) and achievements (`achievements.ts`). Days are always the app timezone's (`APP_TIMEZONE`), tested at the midnight and week boundaries.
- **Quick add is one line, on every page.** `#gk` project, `@code`/`@design` type, `!fri`/`!tmr`/`!2026-10-20` due date, `^feat/login` branch (repeat `^` for more than one); press `N` to jump to it. The parser (`lib/domain/quick-add.ts`) runs in the browser for the preview and again on the server, against the app timezone, before anything is saved.
- **Picks are dated.** The deep task is one row per day in `deep_tasks`, and the weekly three one row per workspace per week in `weekly_stars` (weeks start on Sunday, the review day), so history is kept for streaks. An unfinished deep task from an earlier day is offered as "Carry over".
- **Projects are managed on their workspace page.** Settings hold name, code, colour, staging, billable, production wait, repo and the folder on this computer (which gives an Open in Cursor link, also on the deep task). Archive keeps history; delete is refused once any task has finished. Reorder with the arrows.
- **Releases ship in one action.** A project page ticks its dev-released code and ships it as one named, dated release (`lib/actions/releases.ts`): every task moves to Prod released, closes on the release day and joins the release history. Moving a task back out of production takes it out of its release.
- **Tasks have Markdown descriptions.** Written in the edit panel with a Write / Preview switch, shown folded under the title ("Show notes"). Rendered by `react-markdown` with GitHub-flavoured Markdown; raw HTML is never rendered and unsafe links are dropped (`components/tasks/markdown.tsx`).
- **Branches link to the repo.** Each project can have a repo (GitHub, GitLab or Bitbucket get branch and pull request links); a code task's branches then link to it, each with its own pull request link. A task can hold up to 10 branches, stored space-separated in `tasks.branch` (a branch name can't contain a space). Every user-entered URL goes through `safeHttpUrl` before it becomes a link.

```
app/
  (app)/page.tsx               Today
  (app)/w/[workspace]/page.tsx Workspace and its projects
  (app)/w/[workspace]/[project]/page.tsx  Project: list or board, awaiting production, releases
  (app)/dashboard/page.tsx     Dashboard: score, balance, streaks, needs attention, weekly review, achievements
  login/                       Passcode sign-in
components/shell/              Nav, level bar
components/tasks/              Quick add, task rows and editor, repo field
lib/
  auth/    token (signing), session (cookies), actions (login/logout)
  db/      schema, client, seed
  data/    server-only loaders
  actions/ server actions: tasks, projects, routines
  domain/  stages, palette, dates, quick add, repo links (+ tests)
  game/    levels, XP rules, streaks, achievements, and the engine that writes XP
proxy.ts   optimistic auth check (Next 16's replacement for middleware)
```

## Progress

- [x] Day 1 — setup, schema, sign-in, workspaces/projects/routines seeded
- [x] Day 2 — project management: add, rename, recolor, archive, delete, reorder, staging, production wait, repo
- [x] Day 3 — tasks with types and stages, quick add, project repo links
- [x] Day 4 — Today: deep task, weekly three, routine check-offs, due soon, awaiting production
- [x] Day 5 — project page: list and stage board, type filter, awaiting production, bulk prod release, release history
- [x] Day 6 — game engine: XP, tracks, streaks with rest day, achievements (+ tests)
- [x] Day 7 — dashboard: weekly score, workspace balance, streaks, stuck in review, delivered not invoiced (billable projects only: the Freelance ones), the weekly review in one place
- [ ] Day 8 — PWA and offline notice, mobile polish (done); deploy (postponed). Dropped: the dark-mode toggle (the site is dark only) and importing current tasks.
