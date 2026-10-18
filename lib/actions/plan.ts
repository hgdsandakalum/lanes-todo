"use server";
import { and, asc, count, eq, max } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { ymd } from "@/lib/domain/dates";
import { FINISHED_FOR_ME } from "@/lib/domain/stages";

/** The day's shortlist: add, remove, reorder; and the end-of-day review. Always the app timezone's today. */

const PLAN_MAX = 12;

export async function addToPlan(taskId: string): Promise<{ error?: string }> {
  await requireSession();
  const date = ymd();
  const [task] = await db
    .select({ stage: s.tasks.stage, closedAt: s.tasks.closedAt, status: s.projects.status })
    .from(s.tasks)
    .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
    .where(eq(s.tasks.id, taskId))
    .limit(1);
  if (!task || task.closedAt || task.status !== "active" || FINISHED_FOR_ME.has(task.stage)) return { error: "That task is already finished or archived." };
  const [{ n, top }] = await db.select({ n: count(), top: max(s.dayPlans.sort) }).from(s.dayPlans).where(eq(s.dayPlans.date, date));
  if (n >= PLAN_MAX) return { error: `Today's list holds ${PLAN_MAX} tasks. Finish or drop one first.` };
  await db
    .insert(s.dayPlans)
    .values({ date, taskId, sort: (top ?? -1) + 1 })
    .onConflictDoNothing();
  refresh();
  return {};
}

export async function removeFromPlan(taskId: string) {
  await requireSession();
  await db.delete(s.dayPlans).where(and(eq(s.dayPlans.date, ymd()), eq(s.dayPlans.taskId, taskId)));
  refresh();
}

export async function movePlanItem(taskId: string, dir: "up" | "down") {
  await requireSession();
  const date = ymd();
  const rows = await db.select({ taskId: s.dayPlans.taskId }).from(s.dayPlans).where(eq(s.dayPlans.date, date)).orderBy(asc(s.dayPlans.sort));
  const order = rows.map((r) => r.taskId);
  const i = order.indexOf(taskId);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  const [first, ...rest] = order.map((id, sort) => db.update(s.dayPlans).set({ sort }).where(and(eq(s.dayPlans.date, date), eq(s.dayPlans.taskId, id))));
  await db.batch([first, ...rest]);
  refresh();
}

/** Closes today with a note; saving again updates the note. */
export async function closeDay(note: string): Promise<{ error?: string; saved?: number }> {
  await requireSession();
  if (note.length > 5000) return { error: "Keep the note under 5,000 characters." };
  const date = ymd();
  await db
    .insert(s.dayReviews)
    .values({ date, note: note.trim() || null })
    .onConflictDoUpdate({ target: s.dayReviews.date, set: { note: note.trim() || null, closedAt: new Date() } });
  refresh();
  return { saved: Date.now() };
}

export async function reopenDay() {
  await requireSession();
  await db.delete(s.dayReviews).where(eq(s.dayReviews.date, ymd()));
  refresh();
}
