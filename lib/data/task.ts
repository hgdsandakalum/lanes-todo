import "server-only";
import { and, asc, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";

/** One task's page: the task, its project and workspace, and everything hung on it. */
export async function getTaskPage(taskId: string) {
  await requireSession();
  const [row] = await db
    .select({ task: s.tasks, project: s.projects, workspace: s.workspaces })
    .from(s.tasks)
    .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
    .innerJoin(s.workspaces, eq(s.projects.workspaceId, s.workspaces.id))
    .where(eq(s.tasks.id, taskId))
    .limit(1);
  if (!row) return null;
  const id = row.task.id;

  const [checklist, subtasks, labels, allLabels, refs, blockedBy, blocks, time, parent] = await Promise.all([
    db.select().from(s.checklistItems).where(eq(s.checklistItems.taskId, id)).orderBy(asc(s.checklistItems.sort)),
    db.select().from(s.tasks).where(eq(s.tasks.parentId, id)).orderBy(asc(s.tasks.sort), asc(s.tasks.createdAt)),
    db
      .select({ id: s.labels.id, name: s.labels.name, color: s.labels.color })
      .from(s.taskLabels)
      .innerJoin(s.labels, eq(s.taskLabels.labelId, s.labels.id))
      .where(eq(s.taskLabels.taskId, id))
      .orderBy(asc(s.labels.name)),
    db.select().from(s.labels).orderBy(asc(s.labels.name)),
    db.select().from(s.taskRefs).where(eq(s.taskRefs.taskId, id)).orderBy(asc(s.taskRefs.addedAt)),
    db
      .select({ id: s.tasks.id, title: s.tasks.title, stage: s.tasks.stage, type: s.tasks.type, kind: s.tasks.kind, closedAt: s.tasks.closedAt, devReleasedAt: s.tasks.devReleasedAt })
      .from(s.taskDeps)
      .innerJoin(s.tasks, eq(s.taskDeps.dependsOnId, s.tasks.id))
      .where(eq(s.taskDeps.taskId, id)),
    db
      .select({ id: s.tasks.id, title: s.tasks.title, stage: s.tasks.stage, type: s.tasks.type, kind: s.tasks.kind })
      .from(s.taskDeps)
      .innerJoin(s.tasks, eq(s.taskDeps.taskId, s.tasks.id))
      .where(eq(s.taskDeps.dependsOnId, id)),
    db.select().from(s.timeEntries).where(eq(s.timeEntries.taskId, id)).orderBy(asc(s.timeEntries.startedAt)),
    row.task.parentId ? db.select({ id: s.tasks.id, title: s.tasks.title }).from(s.tasks).where(eq(s.tasks.id, row.task.parentId)).limit(1) : Promise.resolve([]),
  ]);

  // tasks this one could wait on: open tasks in the same workspace, not itself or its subtasks
  const candidates = await db
    .select({ id: s.tasks.id, title: s.tasks.title, projectCode: s.projects.code })
    .from(s.tasks)
    .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
    .where(
      and(
        eq(s.projects.workspaceId, row.workspace.id),
        isNull(s.tasks.closedAt),
        ne(s.tasks.id, id),
        or(isNull(s.tasks.parentId), ne(s.tasks.parentId, id)),
        blockedBy.length ? and(...blockedBy.map((b) => ne(s.tasks.id, b.id))) : undefined,
      ),
    )
    .orderBy(asc(s.projects.sort), asc(s.tasks.createdAt))
    .limit(200);

  const templates = await db.select().from(s.templates).orderBy(asc(s.templates.sort), asc(s.templates.name));
  return { ...row, checklist, subtasks, labels, allLabels, refs, blockedBy, blocks, time, parent: parent[0] ?? null, candidates, templates };
}

export type TaskPage = NonNullable<Awaited<ReturnType<typeof getTaskPage>>>;

/** Labels per task for a list of tasks, for rows. */
export async function labelsFor(taskIds: string[]) {
  if (taskIds.length === 0) return {} as Record<string, { name: string; color: string }[]>;
  const rows = await db
    .select({ taskId: s.taskLabels.taskId, name: s.labels.name, color: s.labels.color })
    .from(s.taskLabels)
    .innerJoin(s.labels, eq(s.taskLabels.labelId, s.labels.id))
    .where(inArray(s.taskLabels.taskId, taskIds))
    .orderBy(asc(s.labels.name));
  const out: Record<string, { name: string; color: string }[]> = {};
  for (const r of rows) (out[r.taskId] ??= []).push({ name: r.name, color: r.color });
  return out;
}

/** Subtask and checklist progress per task, for rows: done / total. */
export async function progressFor(taskIds: string[]) {
  if (taskIds.length === 0) return {} as Record<string, { done: number; total: number }>;
  const [subs, items] = await Promise.all([
    db.select({ parentId: s.tasks.parentId, closedAt: s.tasks.closedAt, devReleasedAt: s.tasks.devReleasedAt }).from(s.tasks).where(inArray(s.tasks.parentId, taskIds)),
    db.select({ taskId: s.checklistItems.taskId, doneAt: s.checklistItems.doneAt }).from(s.checklistItems).where(inArray(s.checklistItems.taskId, taskIds)),
  ]);
  const out: Record<string, { done: number; total: number }> = {};
  const bump = (id: string, done: boolean) => {
    const p = (out[id] ??= { done: 0, total: 0 });
    p.total++;
    if (done) p.done++;
  };
  for (const t of subs) bump(t.parentId!, t.closedAt != null || t.devReleasedAt != null);
  for (const i of items) bump(i.taskId, i.doneAt != null);
  return out;
}

/** Labels, progress and blocked state for rows. */
export async function rowExtras(taskIds: string[]) {
  const [labels, progress, waits] = await Promise.all([
    labelsFor(taskIds),
    progressFor(taskIds),
    taskIds.length
      ? db
          .select({ taskId: s.taskDeps.taskId })
          .from(s.taskDeps)
          .innerJoin(s.tasks, eq(s.taskDeps.dependsOnId, s.tasks.id))
          .where(and(inArray(s.taskDeps.taskId, taskIds), isNull(s.tasks.closedAt), isNull(s.tasks.devReleasedAt)))
      : Promise.resolve([]),
  ]);
  const blocked = new Set(waits.map((w) => w.taskId));
  return Object.fromEntries(taskIds.map((id) => [id, { labels: labels[id], progress: progress[id], blocked: blocked.has(id) }]));
}
