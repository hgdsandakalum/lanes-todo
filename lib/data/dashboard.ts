import "server-only";
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { daysBetween, ymd } from "@/lib/domain/dates";
import { REVIEW_STAGE, STUCK_DAYS, weeklyScore } from "@/lib/domain/review";
import type { TaskType } from "@/lib/domain/stages";
import { starWeek } from "@/lib/domain/weekly";

const taskWithPlace = {
  id: s.tasks.id,
  title: s.tasks.title,
  type: s.tasks.type,
  kind: s.tasks.kind,
  stage: s.tasks.stage,
  due: s.tasks.due,
  closedAt: s.tasks.closedAt,
  projectCode: s.projects.code,
  projectName: s.projects.name,
  projectColor: s.projects.color,
  workspaceSlug: s.workspaces.slug,
  workspaceName: s.workspaces.name,
};

/** Everything the dashboard adds on top of Today's loaders: this week's balance and score, stuck and uninvoiced work. */
export async function getDashboard(today: string, stars: { done: number; total: number }) {
  await requireSession();
  const week = starWeek(today);
  const weekStart = new Date(Date.parse(`${week}T00:00:00Z`) - 864e5); // a day early covers the timezone offset

  const [workspaces, xpRows, moveRows, reviewRows, uninvoiced] = await Promise.all([
    db.select().from(s.workspaces).orderBy(asc(s.workspaces.sort)),
    db
      .select({ workspaceId: s.projects.workspaceId, xp: sql<number>`sum(${s.xpEvents.amount})` })
      .from(s.xpEvents)
      .innerJoin(s.tasks, eq(s.xpEvents.taskId, s.tasks.id))
      .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
      .where(gte(s.xpEvents.day, week))
      .groupBy(s.projects.workspaceId),
    db
      .select({ workspaceId: s.projects.workspaceId, at: s.stageEvents.at })
      .from(s.stageEvents)
      .innerJoin(s.tasks, eq(s.stageEvents.taskId, s.tasks.id))
      .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
      .where(and(gte(s.stageEvents.at, weekStart), isNotNull(s.stageEvents.fromStage))),
    db
      .select(taskWithPlace)
      .from(s.tasks)
      .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
      .innerJoin(s.workspaces, eq(s.projects.workspaceId, s.workspaces.id))
      .where(and(isNull(s.tasks.closedAt), eq(s.projects.status, "active"), inArray(s.tasks.stage, Object.values(REVIEW_STAGE)))),
    db
      .select(taskWithPlace)
      .from(s.tasks)
      .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
      .innerJoin(s.workspaces, eq(s.projects.workspaceId, s.workspaces.id))
      .where(and(eq(s.projects.billable, true), isNotNull(s.tasks.closedAt), isNull(s.tasks.invoicedAt)))
      .orderBy(asc(s.tasks.closedAt)),
  ]);

  // when each review-stage task entered its current stage
  const entered = reviewRows.length
    ? await db
        .select({ taskId: s.stageEvents.taskId, toStage: s.stageEvents.toStage, at: s.stageEvents.at })
        .from(s.stageEvents)
        .where(inArray(s.stageEvents.taskId, reviewRows.map((t) => t.id)))
        .orderBy(desc(s.stageEvents.at))
    : [];
  const stuck = reviewRows
    .filter((t) => REVIEW_STAGE[t.type as TaskType] === t.stage)
    .map((t) => {
      const since = entered.find((e) => e.taskId === t.id && e.toStage === t.stage)?.at;
      return { ...t, waited: since ? daysBetween(ymd(since), today) : 0 };
    })
    .filter((t) => t.waited >= STUCK_DAYS)
    .sort((a, b) => b.waited - a.waited);

  const moved = new Map<string, number>();
  for (const m of moveRows) if (starWeek(ymd(m.at)) === week) moved.set(m.workspaceId, (moved.get(m.workspaceId) ?? 0) + 1);
  const balance = workspaces.map((w) => ({
    id: w.id,
    name: w.name,
    color: w.color,
    xp: Number(xpRows.find((r) => r.workspaceId === w.id)?.xp ?? 0),
    moves: moved.get(w.id) ?? 0,
  }));

  return {
    week,
    balance,
    score: weeklyScore(stars.done, stars.total, balance.filter((b) => b.moves > 0).length, workspaces.length),
    stuck,
    uninvoiced: uninvoiced.map((t) => ({ ...t, delivered: ymd(t.closedAt!) })),
  };
}
