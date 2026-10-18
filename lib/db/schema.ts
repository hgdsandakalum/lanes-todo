import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
import type { StoredItem } from "../domain/routines";

const now = sql`(unixepoch('subsec') * 1000)`;
const ms = (name: string) => integer(name, { mode: "timestamp_ms" });

/** SoftSora, TutorKit, Freelance, Admin & sales — each holds projects. */
export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  color: text("color").notNull(), // palette key, see lib/domain/palette.ts
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
  sort: integer("sort").notNull().default(0),
});

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
    name: text("name").notNull(),
    code: text("code").notNull(), // quick-add handle, e.g. GK → #gk
    color: text("color").notNull(),
    status: text("status", { enum: ["active", "archived"] }).notNull().default("active"),
    hasStaging: integer("has_staging", { mode: "boolean" }).notNull().default(false),
    prodWaitDays: integer("prod_wait_days").notNull().default(7),
    repo: text("repo"), // https URL of the git repo, e.g. https://github.com/softsora/gaku
    billable: integer("billable", { mode: "boolean" }).notNull().default(false), // finished work gets invoiced (Freelance)
    localPath: text("local_path"), // absolute path of the project's folder on your computer, e.g. /Users/you/Documents/otasuke
    sort: integer("sort").notNull().default(0),
    createdAt: ms("created_at").notNull().default(now),
  },
  (t) => [index("projects_workspace_idx").on(t.workspaceId)],
);

export const releases = sqliteTable("releases", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  releasedAt: ms("released_at").notNull().default(now),
});

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => projects.id),
    title: text("title").notNull(),
    description: text("description"), // Markdown
    type: text("type", { enum: ["code", "design", "general"] }).notNull().default("general"),
    kind: text("kind"), // code tasks only: feature, bug, refactor, review, ship, research (lib/domain/kinds.ts); null = feature
    priority: text("priority", { enum: ["urgent", "high", "medium", "low"] }), // null = none
    parentId: text("parent_id"), // a subtask's task (one level deep)
    estimateMin: integer("estimate_min"), // planned minutes
    remindAt: ms("remind_at"), // delivered as a phone push once deployed
    recur: text("recur"), // daily, weekdays, weekly:<0-6,…>, monthly:<1-31> (lib/domain/recur.ts)
    // technical context, shown per kind; Markdown
    acceptance: text("acceptance"),
    repro: text("repro"),
    expected: text("expected"),
    actual: text("actual"),
    blocker: text("blocker"), // what is in the way, in words; task dependencies live in task_deps
    stage: text("stage").notNull().default("todo"), // see lib/domain/stages.ts
    due: text("due"), // YYYY-MM-DD, local calendar day
    // unused: picks are dated, so they live in deep_tasks and weekly_stars; drop in a later migration
    star: integer("star", { mode: "boolean" }).notNull().default(false),
    focus: integer("focus", { mode: "boolean" }).notNull().default(false),
    // code fields
    ticket: text("ticket"),
    branch: text("branch"),
    // design fields
    assets: integer("assets"),
    revision: integer("revision"),
    // shared
    link: text("link"),
    devReleasedAt: ms("dev_released_at"), // code: your part is done
    closedAt: ms("closed_at"), // code: prod released; others: finished
    invoicedAt: ms("invoiced_at"), // billable projects: when the delivered work was invoiced
    releaseId: text("release_id").references(() => releases.id),
    sort: integer("sort").notNull().default(0),
    createdAt: ms("created_at").notNull().default(now),
  },
  (t) => [index("tasks_project_idx").on(t.projectId), index("tasks_closed_idx").on(t.closedAt), index("tasks_parent_idx").on(t.parentId)],
);

/** The day's one deep task, one row per day, kept as history for streaks. */
export const deepTasks = sqliteTable("deep_tasks", {
  date: text("date").primaryKey(), // YYYY-MM-DD, local calendar day
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  pickedAt: ms("picked_at").notNull().default(now),
});

/** The weekly three: one starred task per workspace per week (weeks start on Sunday, the review day). */
export const weeklyStars = sqliteTable(
  "weekly_stars",
  {
    week: text("week").notNull(), // the Sunday that starts the week, YYYY-MM-DD
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
    taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.week, t.workspaceId] })],
);

/** Every stage move is logged; drives XP and "time in review" stats. */
export const stageEvents = sqliteTable("stage_events", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  fromStage: text("from_stage"),
  toStage: text("to_stage").notNull(),
  at: ms("at").notNull().default(now),
});

/** XP is never stored as a total — it is summed from these rows. */
export const xpEvents = sqliteTable(
  "xp_events",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull().unique(), // what was earned, e.g. t:<task id>:dev; one row per key, so nothing pays twice
    day: text("day").notNull(), // YYYY-MM-DD in the app timezone, for daily caps, streaks and weeks
    kind: text("kind").notNull(), // e.g. dev_released, prod_released, routine_done
    track: text("track", { enum: ["code", "design", "general"] }).notNull(),
    amount: integer("amount").notNull(),
    taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
    at: ms("at").notNull().default(now),
  },
  (t) => [index("xp_at_idx").on(t.at)],
);

export const routines = sqliteTable("routines", {
  key: text("key").primaryKey(), // sweep, admin, review, tk_sat, tk_sun
  title: text("title").notNull(),
  note: text("note"),
  weekdays: text("weekdays", { mode: "json" }).$type<number[]>().notNull(), // 0 = Sunday
  items: text("items", { mode: "json" }).$type<StoredItem[]>().notNull(), // text, or { text, signal } (lib/domain/routines.ts)
  sort: integer("sort").notNull().default(0),
});

export const routineChecks = sqliteTable(
  "routine_checks",
  {
    date: text("date").notNull(), // YYYY-MM-DD
    routineKey: text("routine_key").notNull().references(() => routines.key, { onDelete: "cascade" }),
    itemIndex: integer("item_index").notNull(),
  },
  (t) => [primaryKey({ columns: [t.date, t.routineKey, t.itemIndex] })],
);

export const achievements = sqliteTable("achievements", {
  key: text("key").primaryKey(),
  unlockedAt: ms("unlocked_at").notNull().default(now),
});

/** A task's checklist. Ticked items earn a little XP (lib/game/xp.ts). */
export const checklistItems = sqliteTable(
  "checklist_items",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    doneAt: ms("done_at"),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("checklist_task_idx").on(t.taskId)],
);

export const labels = sqliteTable("labels", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // lower case, e.g. backend
  color: text("color").notNull().default("slate"),
});

export const taskLabels = sqliteTable(
  "task_labels",
  {
    taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    labelId: text("label_id").notNull().references(() => labels.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.labelId] })],
);

/** Pull requests, issues, commits and other links on a task. */
export const taskRefs = sqliteTable(
  "task_refs",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["pr", "issue", "commit", "link"] }).notNull(),
    ref: text("ref").notNull(), // a URL, or a commit SHA / #123 when the project has a repo
    title: text("title"),
    addedAt: ms("added_at").notNull().default(now),
  },
  (t) => [index("refs_task_idx").on(t.taskId)],
);

/** task_id can't finish before depends_on_id: shown as "blocked by". */
export const taskDeps = sqliteTable(
  "task_deps",
  {
    taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    dependsOnId: text("depends_on_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.dependsOnId] })],
);

/** Time actually spent: one row per timer run; endedAt null while running. */
export const timeEntries = sqliteTable(
  "time_entries",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    startedAt: ms("started_at").notNull(),
    endedAt: ms("ended_at"),
  },
  (t) => [index("time_task_idx").on(t.taskId)],
);

/** The day's shortlist, in order. Unfinished picks carry over to the next day. */
export const dayPlans = sqliteTable(
  "day_plans",
  {
    date: text("date").notNull(), // YYYY-MM-DD
    taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    sort: integer("sort").notNull().default(0),
    carried: integer("carried", { mode: "boolean" }).notNull().default(false), // came over from an earlier day
  },
  (t) => [primaryKey({ columns: [t.date, t.taskId] })],
);

/** The end-of-day review: a note per day; accomplishments are read from the day's activity. */
export const dayReviews = sqliteTable("day_reviews", {
  date: text("date").primaryKey(),
  note: text("note"),
  closedAt: ms("closed_at").notNull().default(now),
});

/** Reusable tasks: a title, description, kind and checklist, e.g. "Release checklist". */
export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["code", "design", "general"] }).notNull().default("general"),
  kind: text("kind"),
  title: text("title").notNull(),
  description: text("description"),
  checklist: text("checklist", { mode: "json" }).$type<string[]>().notNull(),
  sort: integer("sort").notNull().default(0),
});

/** Services you pay for on repeat. Amounts are cents of `currency`; nextDue is the next renewal (YYYY-MM-DD). */
export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("other"), // lib/domain/subscriptions.ts
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  cycle: text("cycle", { enum: ["weekly", "monthly", "quarterly", "yearly"] }).notNull().default("monthly"),
  nextDue: text("next_due").notNull(),
  billingDay: integer("billing_day").notNull(), // day of month it bills on, kept through short months
  status: text("status", { enum: ["active", "paused", "cancelled"] }).notNull().default("active"),
  projectId: text("project_id").references(() => projects.id), // paid for a client or project
  url: text("url"), // where to manage or cancel it
  paymentMethod: text("payment_method"), // e.g. "Visa ending 4242"
  notes: text("notes"),
  createdAt: ms("created_at").notNull().default(now),
});

/** One row per renewal paid; dueOn is the renewal it covered, so undoing it moves nextDue back. */
export const subscriptionPayments = sqliteTable(
  "subscription_payments",
  {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
    paidOn: text("paid_on").notNull(),
    dueOn: text("due_on").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
  },
  (t) => [index("sub_payments_sub_idx").on(t.subscriptionId)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Routine = typeof routines.$inferSelect;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type Label = typeof labels.$inferSelect;
export type TaskRef = typeof taskRefs.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
