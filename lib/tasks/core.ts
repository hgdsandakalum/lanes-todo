import "server-only";
import { and, asc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { ymd } from "@/lib/domain/dates";
import { DESCRIPTION_MAX, parseQuickAdd } from "@/lib/domain/quick-add";
import { nextDate, parseRecur } from "@/lib/domain/recur";
import { closingStage, stageDates, stagesFor, type TaskType } from "@/lib/domain/stages";
import { reconcileTask } from "@/lib/game/engine";

/**
 * Task writes shared by the server actions (signed-in browser) and the lanes command (/api/cli, token).
 * Callers check who is asking; nothing here does.
 */

export async function activeProject(where: SQL) {
  const [p] = await db
    .select()
    .from(s.projects)
    .where(and(where, eq(s.projects.status, "active")))
    .limit(1);
  return p ?? null;
}

export async function taskWithProject(taskId: string) {
  const [row] = await db
    .select({ task: s.tasks, hasStaging: s.projects.hasStaging })
    .from(s.tasks)
    .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
    .where(eq(s.tasks.id, taskId))
    .limit(1);
  return row ?? null;
}

type Added = { ok: true; id: string; project: typeof s.projects.$inferSelect; title: string; type: TaskType; branches: string[] } | { ok: false; error: string };

/** Label ids for names (lower case), creating the ones that don't exist yet. */
export async function ensureLabels(names: string[]): Promise<string[]> {
  if (names.length === 0) return [];
  await db
    .insert(s.labels)
    .values(names.map((name) => ({ id: `lb_${crypto.randomUUID()}`, name })))
    .onConflictDoNothing();
  const rows = await db.select({ id: s.labels.id }).from(s.labels).where(inArray(s.labels.name, names));
  return rows.map((r) => r.id);
}

/**
 * Adds a task from a quick-add line. The line is parsed here against the app timezone's today.
 * `fallbackProjectId` is used when the line has no #project; `branch` (the lanes command's current branch)
 * is attached when the line names none and the task can be a code task.
 */
export async function addTask(input: {
  text: string;
  fallbackProjectId?: string | null;
  branch?: string | null;
  description?: string | null;
  parentId?: string | null;
}): Promise<Added> {
  const parsed = parseQuickAdd(input.text, ymd());
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const q = parsed.value;

  const project = q.project
    ? await activeProject(sql`upper(${s.projects.code}) = ${q.project}`)
    : input.fallbackProjectId
      ? await activeProject(eq(s.projects.id, input.fallbackProjectId))
      : null;
  if (!project) return { ok: false, error: q.project ? `No active project uses #${q.project.toLowerCase()}.` : "Add a #project to say where this goes." };

  const branches = q.branches ?? (input.branch && (q.type ?? "code") === "code" ? [input.branch] : []);
  const type: TaskType = q.type ?? (branches.length ? "code" : "general");
  const description = input.description?.trim() || null;
  if (description && description.length > DESCRIPTION_MAX) return { ok: false, error: `Keep the description under ${DESCRIPTION_MAX.toLocaleString("en")} characters.` };

  const id = `t_${crypto.randomUUID()}`;
  const labelIds = await ensureLabels(q.labels ?? []);
  await db.batch([
    db.insert(s.tasks).values({
      id,
      projectId: project.id,
      parentId: input.parentId ?? null,
      title: q.title,
      description,
      type,
      kind: q.kind ?? null,
      priority: q.priority ?? null,
      estimateMin: q.estimate ?? null,
      due: q.due ?? null,
      branch: branches.join(" ") || null,
    }),
    db.insert(s.stageEvents).values({ id: `se_${crypto.randomUUID()}`, taskId: id, fromStage: null, toStage: "todo" }),
    ...(labelIds.length ? [db.insert(s.taskLabels).values(labelIds.map((labelId) => ({ taskId: id, labelId })))] : []),
  ]);
  return { ok: true, id, project, title: q.title, type, branches };
}

/** Moves a task to a stage of its type, stamping or clearing its finish dates, logging the move and settling its XP. Returns the XP change. */
export async function moveTask(taskId: string, stage: string): Promise<number> {
  const row = await taskWithProject(taskId);
  if (!row) throw new Error("That task doesn't exist.");
  const { task, hasStaging } = row;
  const type = task.type as TaskType;
  if (!stagesFor(type, hasStaging, task.kind).some((st) => st.key === stage)) throw new Error("That stage doesn't apply to this task.");
  if (stage === task.stage) return 0;

  await db.batch([
    db
      .update(s.tasks)
      // moving out of production also takes the task out of its release
      .set({ stage, ...stageDates(type, stage, task, new Date(), task.kind), ...(stage === "prod_released" ? {} : { releaseId: null }) })
      .where(eq(s.tasks.id, taskId)),
    db.insert(s.stageEvents).values({ id: `se_${crypto.randomUUID()}`, taskId, fromStage: task.stage, toStage: stage }),
  ]);
  if (stage === closingStage(type, task.kind)) await repeat(task);
  return reconcileTask(taskId);
}

/**
 * A recurring task that closes makes its next occurrence: the same task, back at To do, due on the rule's next date,
 * with its labels and an unticked copy of its checklist. The rule moves to the new task, so closing twice can't repeat twice.
 */
async function repeat(task: typeof s.tasks.$inferSelect) {
  const rule = parseRecur(task.recur);
  if (!rule) return;
  const id = `t_${crypto.randomUUID()}`;
  const due = nextDate(rule, task.due && task.due > ymd() ? task.due : ymd());
  const [labels, items] = await Promise.all([
    db.select({ labelId: s.taskLabels.labelId }).from(s.taskLabels).where(eq(s.taskLabels.taskId, task.id)),
    db.select().from(s.checklistItems).where(eq(s.checklistItems.taskId, task.id)).orderBy(asc(s.checklistItems.sort)),
  ]);
  const { title, description, type, kind, priority, estimateMin, recur, acceptance, ticket, link, projectId, parentId, sort } = task;
  await db.batch([
    db.update(s.tasks).set({ recur: null }).where(eq(s.tasks.id, task.id)),
    db.insert(s.tasks).values({ id, projectId, parentId, title, description, type, kind, priority, estimateMin, recur, acceptance, ticket, link, sort, due }),
    db.insert(s.stageEvents).values({ id: `se_${crypto.randomUUID()}`, taskId: id, fromStage: null, toStage: "todo" }),
    ...(labels.length ? [db.insert(s.taskLabels).values(labels.map((l) => ({ taskId: id, labelId: l.labelId })))] : []),
    ...(items.length ? [db.insert(s.checklistItems).values(items.map((i) => ({ id: `ci_${crypto.randomUUID()}`, taskId: id, text: i.text, sort: i.sort })))] : []),
  ]);
}
