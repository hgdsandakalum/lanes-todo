"use server";
import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { ymd } from "@/lib/domain/dates";
import { FINISHED_FOR_ME } from "@/lib/domain/stages";
import { starWeek, WEEKLY_THREE_SLUGS } from "@/lib/domain/weekly";
import { syncDeepItems } from "./routines";
import { reconcileTask } from "@/lib/game/engine";

/** An open task in an active project that isn't finished for you yet, with its workspace. */
async function pickableTask(taskId: string) {
  const [row] = await db
    .select({ id: s.tasks.id, stage: s.tasks.stage, closedAt: s.tasks.closedAt, status: s.projects.status, workspaceId: s.projects.workspaceId })
    .from(s.tasks)
    .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
    .where(eq(s.tasks.id, taskId))
    .limit(1);
  if (!row || row.closedAt != null || row.status !== "active" || FINISHED_FOR_ME.has(row.stage)) return null;
  return row;
}

/** Sets today's deep task (the app timezone's today), or clears it with null. */
export async function pickDeepTask(taskId: string | null) {
  await requireSession();
  const date = ymd();
  const [previous] = await db.select({ taskId: s.deepTasks.taskId }).from(s.deepTasks).where(eq(s.deepTasks.date, date)).limit(1);
  if (taskId == null) {
    await db.delete(s.deepTasks).where(eq(s.deepTasks.date, date));
  } else {
    if (!(await pickableTask(taskId))) throw new Error("That task can't be today's deep task.");
    await db
      .insert(s.deepTasks)
      .values({ date, taskId })
      .onConflictDoUpdate({ target: s.deepTasks.date, set: { taskId, pickedAt: new Date() } });
  }
  for (const id of new Set([previous?.taskId, taskId])) if (id) await reconcileTask(id);
  await syncDeepItems(date);
  refresh();
}

/** Stars a task as this week's pick for its workspace, or clears that workspace's star with null. */
export async function starTask(workspaceId: string, taskId: string | null) {
  await requireSession();
  const week = starWeek(ymd());
  const [ws] = await db.select().from(s.workspaces).where(eq(s.workspaces.id, workspaceId)).limit(1);
  const [previous] = await db
    .select({ taskId: s.weeklyStars.taskId })
    .from(s.weeklyStars)
    .where(and(eq(s.weeklyStars.week, week), eq(s.weeklyStars.workspaceId, workspaceId)))
    .limit(1);
  if (!ws || !(WEEKLY_THREE_SLUGS as readonly string[]).includes(ws.slug)) throw new Error("That workspace has no weekly star.");
  if (taskId == null) {
    await db.delete(s.weeklyStars).where(and(eq(s.weeklyStars.week, week), eq(s.weeklyStars.workspaceId, workspaceId)));
  } else {
    const task = await pickableTask(taskId);
    if (!task || task.workspaceId !== workspaceId) throw new Error(`Pick an open ${ws.name} task.`);
    await db
      .insert(s.weeklyStars)
      .values({ week, workspaceId, taskId })
      .onConflictDoUpdate({ target: [s.weeklyStars.week, s.weeklyStars.workspaceId], set: { taskId } });
  }
  for (const id of new Set([previous?.taskId, taskId])) if (id) await reconcileTask(id);
  refresh();
}
