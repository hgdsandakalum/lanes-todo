import "server-only";
import { and, asc, desc, eq, isNull, lt } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { addDays } from "@/lib/domain/dates";
import { prodWait, waitingMark, withClient } from "@/lib/domain/due";
import { FINISHED_FOR_ME } from "@/lib/domain/stages";
import { DUE_SOON_DAYS, starWeek, WEEKLY_THREE_SLUGS } from "@/lib/domain/weekly";

/** A task with what Today needs to show it: its project and workspace. */
const todayTask = {
  id: s.tasks.id,
  title: s.tasks.title,
  description: s.tasks.description,
  type: s.tasks.type,
  kind: s.tasks.kind,
  stage: s.tasks.stage,
  priority: s.tasks.priority,
  ticket: s.tasks.ticket,
  blocker: s.tasks.blocker,
  due: s.tasks.due,
  prodDate: s.tasks.prodDate,
  branch: s.tasks.branch,
  link: s.tasks.link,
  devReleasedAt: s.tasks.devReleasedAt,
  closedAt: s.tasks.closedAt,
  projectCode: s.projects.code,
  projectName: s.projects.name,
  projectColor: s.projects.color,
  hasStaging: s.projects.hasStaging,
  prodWaitDays: s.projects.prodWaitDays,
  repo: s.projects.repo,
  localPath: s.projects.localPath,
  workspaceId: s.workspaces.id,
  workspaceSlug: s.workspaces.slug,
  workspaceName: s.workspaces.name,
};

function tasksQuery() {
  return db
    .select(todayTask)
    .from(s.tasks)
    .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
    .innerJoin(s.workspaces, eq(s.projects.workspaceId, s.workspaces.id));
}

export type TodayTask = Awaited<ReturnType<typeof tasksQuery>>[number];

export const finishedForMe = (t: Pick<TodayTask, "stage">) => FINISHED_FOR_ME.has(t.stage);

/**
 * Everything the Today page shows for `day`: the deep task, last pick still open (to carry over),
 * the weekly three, what's due soon, and code waiting for production.
 */
export async function getToday(day: string) {
  await requireSession();
  return loadToday(day);
}

/** getToday without the session check, for callers that check who is asking themselves (the brief in /api/cli). */
export async function loadToday(day: string) {
  const week = starWeek(day);
  const active = eq(s.projects.status, "active");

  const [open, deepRows, lastRows, starRows, slotRows] = await Promise.all([
    // open = not closed; "finished for me" ones (dev released, staging) stay open until production
    tasksQuery()
      .where(and(active, isNull(s.tasks.closedAt)))
      .orderBy(asc(s.workspaces.sort), asc(s.projects.sort), asc(s.tasks.sort), asc(s.tasks.createdAt)),
    tasksQuery().innerJoin(s.deepTasks, eq(s.deepTasks.taskId, s.tasks.id)).where(eq(s.deepTasks.date, day)).limit(1),
    tasksQuery()
      .innerJoin(s.deepTasks, eq(s.deepTasks.taskId, s.tasks.id))
      .where(and(lt(s.deepTasks.date, day), active, isNull(s.tasks.closedAt)))
      .orderBy(desc(s.deepTasks.date))
      .limit(1),
    tasksQuery().innerJoin(s.weeklyStars, eq(s.weeklyStars.taskId, s.tasks.id)).where(eq(s.weeklyStars.week, week)),
    db.select().from(s.workspaces).orderBy(asc(s.workspaces.sort)),
  ]);

  const pickable = open.filter((t) => !finishedForMe(t));
  const last = lastRows[0];
  const slots = WEEKLY_THREE_SLUGS.map((slug) => slotRows.find((w) => w.slug === slug))
    .filter((w) => w != null)
    .map((w) => ({
      workspace: { id: w.id, name: w.name, color: w.color },
      star: starRows.find((t) => t.workspaceId === w.id) ?? null,
      candidates: pickable.filter((t) => t.workspaceId === w.id),
    }));

  const soon = addDays(day, DUE_SOON_DAYS);
  // design sent for feedback is the client's move, so its due date waits
  const dueSoon = pickable.filter((t) => t.due != null && t.due <= soon && !withClient(t)).sort((a, b) => a.due!.localeCompare(b.due!));

  const awaiting = open
    .filter((t) => t.type === "code" && t.devReleasedAt != null)
    .map((t) => ({ ...t, ...prodWait(t, day, t.prodWaitDays), mark: waitingMark(t, day, t.prodWaitDays) }))
    .sort((a, b) => b.waited - a.waited);

  return {
    deep: deepRows[0] ?? null,
    carry: last && !finishedForMe(last) ? last : null,
    pickable,
    slots,
    dueSoon,
    awaiting,
  };
}
