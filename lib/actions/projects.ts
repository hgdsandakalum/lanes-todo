"use server";
import { and, asc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { checkProject, moved, WAIT_DAYS_MAX } from "@/lib/domain/projects";
import { normalizeFolder } from "@/lib/domain/folders";
import { normalizeRepo } from "@/lib/domain/repo";
import type { FormState } from "./tasks";

const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

/** Codes are unique across every project, archived ones included, so restoring one can't clash. */
async function codeTaken(code: string, exceptId?: string) {
  const [row] = await db
    .select({ id: s.projects.id })
    .from(s.projects)
    .where(and(sql`upper(${s.projects.code}) = ${code}`, exceptId ? ne(s.projects.id, exceptId) : undefined))
    .limit(1);
  return row != null;
}

export async function createProject(_: FormState, form: FormData): Promise<FormState> {
  await requireSession();
  const workspaceId = field(form, "workspaceId");
  const checked = checkProject({ name: field(form, "name"), code: field(form, "code"), color: field(form, "color") });
  if (!checked.ok) return { error: checked.error };
  const [ws] = await db.select({ id: s.workspaces.id }).from(s.workspaces).where(eq(s.workspaces.id, workspaceId)).limit(1);
  if (!ws) return { error: "That workspace doesn't exist." };
  if (await codeTaken(checked.value.code)) return { error: `#${checked.value.code.toLowerCase()} is already used by another project.` };

  const [{ last }] = await db
    .select({ last: sql<number | null>`max(${s.projects.sort})` })
    .from(s.projects)
    .where(eq(s.projects.workspaceId, workspaceId));
  await db.insert(s.projects).values({ id: `pr_${crypto.randomUUID()}`, workspaceId, ...checked.value, sort: (last ?? -1) + 1 });
  refresh();
  return { saved: Date.now() };
}

/** The settings panel: name, code, colour, staging, billable, production wait, repo and folder. */
export async function updateProject(_: FormState, form: FormData): Promise<FormState> {
  await requireSession();
  const id = field(form, "id");
  const [project] = await db.select().from(s.projects).where(eq(s.projects.id, id)).limit(1);
  if (!project) return { error: "That project doesn't exist any more." };

  const checked = checkProject({ name: field(form, "name"), code: field(form, "code"), color: field(form, "color") });
  if (!checked.ok) return { error: checked.error };
  if (await codeTaken(checked.value.code, id)) return { error: `#${checked.value.code.toLowerCase()} is already used by another project.` };

  const hasStaging = form.get("hasStaging") === "on";
  const billable = form.get("billable") === "on";
  const prodWaitDays = Number(field(form, "prodWaitDays"));
  if (!Number.isInteger(prodWaitDays) || prodWaitDays < 1 || prodWaitDays > WAIT_DAYS_MAX) {
    return { error: `The production wait needs to be a whole number of days from 1 to ${WAIT_DAYS_MAX}.` };
  }
  const repoInput = field(form, "repo");
  const repo = repoInput ? normalizeRepo(repoInput) : null;
  if (repoInput && !repo) return { error: "That isn't a repo URL. Try softsora/gaku or https://github.com/softsora/gaku." };
  const folderInput = field(form, "localPath");
  const localPath = folderInput ? normalizeFolder(folderInput) : null;
  if (folderInput && !localPath) return { error: "The folder needs to be a full path starting with /, like /Users/you/Documents/otasuke." };
  if (localPath) {
    const [other] = await db
      .select({ name: s.projects.name })
      .from(s.projects)
      .where(and(eq(s.projects.localPath, localPath), ne(s.projects.id, id)))
      .limit(1);
    if (other) return { error: `${other.name} already uses that folder.` };
  }

  if (project.hasStaging && !hasStaging) {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)` })
      .from(s.tasks)
      .where(and(eq(s.tasks.projectId, id), eq(s.tasks.stage, "staging")));
    if (n > 0) return { error: `${n} ${n === 1 ? "task is" : "tasks are"} in Staging. Move ${n === 1 ? "it" : "them"} on before turning staging off.` };
  }

  await db
    .update(s.projects)
    .set({ ...checked.value, hasStaging, billable, prodWaitDays, repo, localPath })
    .where(eq(s.projects.id, id));
  refresh();
  return { saved: Date.now() };
}

/** Archive hides a project and its tasks but keeps history and XP; restoring puts it back at the end. */
export async function setProjectArchived(id: string, archived: boolean) {
  await requireSession();
  await db
    .update(s.projects)
    .set({ status: archived ? "archived" : "active" })
    .where(eq(s.projects.id, id));
  refresh();
}

/** Permanent, so only for projects whose tasks never finished: past work can't be erased by accident. */
export async function deleteProject(id: string): Promise<FormState> {
  await requireSession();
  const tasks = await db
    .select({ id: s.tasks.id, closedAt: s.tasks.closedAt, devReleasedAt: s.tasks.devReleasedAt })
    .from(s.tasks)
    .where(eq(s.tasks.projectId, id));
  const finished = tasks.filter((t) => t.closedAt != null || t.devReleasedAt != null).length;
  if (finished > 0) {
    return { error: `${finished} finished ${finished === 1 ? "task belongs" : "tasks belong"} to this project, so it can only be archived.` };
  }
  const ids = tasks.map((t) => t.id);
  // releases first: a project with no finished tasks has none in use
  await db.batch([
    db.delete(s.releases).where(eq(s.releases.projectId, id)),
    ...(ids.length
      ? [
          db.delete(s.deepTasks).where(inArray(s.deepTasks.taskId, ids)),
          db.delete(s.weeklyStars).where(inArray(s.weeklyStars.taskId, ids)),
          db.delete(s.dayPlans).where(inArray(s.dayPlans.taskId, ids)),
          db.delete(s.checklistItems).where(inArray(s.checklistItems.taskId, ids)),
          db.delete(s.taskLabels).where(inArray(s.taskLabels.taskId, ids)),
          db.delete(s.taskRefs).where(inArray(s.taskRefs.taskId, ids)),
          db.delete(s.taskDeps).where(or(inArray(s.taskDeps.taskId, ids), inArray(s.taskDeps.dependsOnId, ids))),
          db.delete(s.timeEntries).where(inArray(s.timeEntries.taskId, ids)),
          db.update(s.xpEvents).set({ taskId: null }).where(inArray(s.xpEvents.taskId, ids)),
          db.delete(s.stageEvents).where(inArray(s.stageEvents.taskId, ids)),
          db.delete(s.tasks).where(inArray(s.tasks.id, ids)),
        ]
      : []),
    db.delete(s.projects).where(eq(s.projects.id, id)),
  ]);
  refresh();
}

/** Moves an active project one place up or down within its workspace, renumbering the order 0, 1, 2… */
export async function moveProject(id: string, dir: "up" | "down") {
  await requireSession();
  const [project] = await db.select().from(s.projects).where(eq(s.projects.id, id)).limit(1);
  if (!project || (dir !== "up" && dir !== "down")) return;
  const siblings = await db
    .select({ id: s.projects.id })
    .from(s.projects)
    .where(and(eq(s.projects.workspaceId, project.workspaceId), eq(s.projects.status, "active")))
    .orderBy(asc(s.projects.sort), asc(s.projects.createdAt));
  const order = moved(
    siblings.map((p) => p.id),
    id,
    dir,
  );
  const [first, ...rest] = order.map((pid, sort) => db.update(s.projects).set({ sort }).where(eq(s.projects.id, pid)));
  if (first) await db.batch([first, ...rest]);
  refresh();
}
