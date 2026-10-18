import "server-only";
import { and, asc, desc, eq, gte, inArray, isNotNull, lt, max, or } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { ymd } from "@/lib/domain/dates";
import { trackedMinutes } from "@/lib/domain/estimate";
import { FINISHED_FOR_ME, type TaskType } from "@/lib/domain/stages";

/** Midnight at the start of `day` in the app timezone, give or take the offset: a day early, then filtered by ymd(). */
const around = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) - 864e5);

/**
 * Carries the most recent earlier day's unfinished picks into `day`, once: when `day` has no list yet.
 * Runs when today's list is first read, so "automatic" needs no scheduler. Idempotent.
 */
async function carryOver(day: string) {
  if ((await db.$count(s.dayPlans, eq(s.dayPlans.date, day))) > 0) return;
  const [prev] = await db.select({ date: max(s.dayPlans.date) }).from(s.dayPlans).where(lt(s.dayPlans.date, day));
  if (!prev?.date) return;
  const rows = await db
    .select({ taskId: s.dayPlans.taskId, sort: s.dayPlans.sort, stage: s.tasks.stage, closedAt: s.tasks.closedAt, status: s.projects.status })
    .from(s.dayPlans)
    .innerJoin(s.tasks, eq(s.dayPlans.taskId, s.tasks.id))
    .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
    .where(eq(s.dayPlans.date, prev.date))
    .orderBy(asc(s.dayPlans.sort));
  const carry = rows.filter((r) => r.closedAt == null && r.status === "active" && !FINISHED_FOR_ME.has(r.stage));
  if (carry.length) await db.insert(s.dayPlans).values(carry.map((r, i) => ({ date: day, taskId: r.taskId, sort: i, carried: true }))).onConflictDoNothing();
}

/** Today's shortlist with each task's estimate and time spent (all time, and today), plus the totals. */
export async function getPlan(day: string) {
  await requireSession();
  await carryOver(day);
  const rows = await db
    .select({
      id: s.tasks.id,
      title: s.tasks.title,
      type: s.tasks.type,
      kind: s.tasks.kind,
      stage: s.tasks.stage,
      priority: s.tasks.priority,
      due: s.tasks.due,
      estimateMin: s.tasks.estimateMin,
      projectCode: s.projects.code,
      projectColor: s.projects.color,
      projectName: s.projects.name,
      hasStaging: s.projects.hasStaging,
      carried: s.dayPlans.carried,
    })
    .from(s.dayPlans)
    .innerJoin(s.tasks, eq(s.dayPlans.taskId, s.tasks.id))
    .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
    .where(eq(s.dayPlans.date, day))
    .orderBy(asc(s.dayPlans.sort));

  const ids = rows.map((r) => r.id);
  const entries = ids.length ? await db.select().from(s.timeEntries).where(inArray(s.timeEntries.taskId, ids)) : [];
  const now = new Date();
  const tasks = rows.map((r) => {
    const mine = entries.filter((e) => e.taskId === r.id);
    return {
      ...r,
      type: r.type as TaskType,
      done: FINISHED_FOR_ME.has(r.stage),
      spent: trackedMinutes(mine, now),
      spentToday: trackedMinutes(mine.filter((e) => ymd(e.startedAt) === day), now),
      running: mine.some((e) => e.endedAt == null),
    };
  });
  return {
    tasks,
    estimate: tasks.filter((t) => !t.done).reduce((n, t) => n + (t.estimateMin ?? 0), 0),
    unestimated: tasks.filter((t) => !t.done && t.estimateMin == null).length,
    spentToday: tasks.reduce((n, t) => n + t.spentToday, 0),
  };
}

export type PlanTask = Awaited<ReturnType<typeof getPlan>>["tasks"][number];

/** What got done on `day`: finished tasks, stage moves, XP, time, and the day's review note if closed. */
export async function getDayReview(day: string) {
  await requireSession();
  const since = around(day);
  const [moves, xp, time, review, finished] = await Promise.all([
    db
      .select({ taskId: s.stageEvents.taskId, toStage: s.stageEvents.toStage, fromStage: s.stageEvents.fromStage, at: s.stageEvents.at })
      .from(s.stageEvents)
      .where(and(gte(s.stageEvents.at, since), isNotNull(s.stageEvents.fromStage))),
    db.select({ amount: s.xpEvents.amount }).from(s.xpEvents).where(eq(s.xpEvents.day, day)),
    db.select().from(s.timeEntries).where(gte(s.timeEntries.startedAt, since)),
    db.select().from(s.dayReviews).where(eq(s.dayReviews.date, day)).limit(1),
    db
      .select({ id: s.tasks.id, title: s.tasks.title, type: s.tasks.type, kind: s.tasks.kind, projectCode: s.projects.code, projectColor: s.projects.color, devReleasedAt: s.tasks.devReleasedAt, closedAt: s.tasks.closedAt })
      .from(s.tasks)
      .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
      .where(or(gte(s.tasks.devReleasedAt, since), gte(s.tasks.closedAt, since)))
      .orderBy(desc(s.tasks.closedAt)),
  ]);
  const doneToday = finished.filter((t) => {
    const at = t.type === "code" ? (t.devReleasedAt ?? t.closedAt) : t.closedAt;
    return at != null && ymd(at) === day;
  });
  const movedIds = new Set(moves.filter((m) => ymd(m.at) === day).map((m) => m.taskId));
  doneToday.forEach((t) => movedIds.delete(t.id));
  const progressed = movedIds.size
    ? await db
        .select({ id: s.tasks.id, title: s.tasks.title, type: s.tasks.type, kind: s.tasks.kind, stage: s.tasks.stage, projectCode: s.projects.code, projectColor: s.projects.color })
        .from(s.tasks)
        .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
        .where(inArray(s.tasks.id, [...movedIds]))
    : [];
  const now = new Date();
  return {
    finished: doneToday,
    progressed,
    xp: xp.reduce((n, e) => n + e.amount, 0),
    minutes: trackedMinutes(time.filter((e) => ymd(e.startedAt) === day), now),
    review: review[0] ?? null,
  };
}
