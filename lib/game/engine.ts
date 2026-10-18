import "server-only";
import { and, eq, gte, inArray, isNull, like, lt, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { addDays, ymd } from "@/lib/domain/dates";
import { FINISHED_FOR_ME } from "@/lib/domain/stages";
import { starWeek } from "@/lib/domain/weekly";
import { balancedWeek, fullStackWeek, inboxZero, tutorkitSteady, type AchievementKey } from "./achievements";
import { checkAward, fitSmall, GENERAL_DAILY_CAP, routineAward, taskAwards, type Award } from "./xp";

/**
 * The game engine. XP is never computed from scratch at read time and never stored as a running total:
 * each action reconciles the awards one task (or one routine day) should hold against what's stored,
 * inserting what's newly earned and removing what no longer is. Keys make every award pay at most once.
 * Returns the net XP change, for the small "+30 XP" note.
 */
async function reconcile(prefix: string, desired: Award[], taskId: string | null): Promise<number> {
  const stored = await db.select().from(s.xpEvents).where(like(s.xpEvents.key, `${prefix}%`));
  const want = new Map(desired.map((a) => [a.key, a]));
  const added = desired.filter((a) => !stored.some((e) => e.key === a.key));
  const removed = stored.filter((e) => !want.has(e.key));
  if (added.length === 0 && removed.length === 0) return 0;

  const insert = added.length
    ? db
        .insert(s.xpEvents)
        .values(added.map((a) => ({ id: `xp_${crypto.randomUUID()}`, key: a.key, day: ymd(a.at), kind: a.kind, track: a.track, amount: a.amount, taskId, at: a.at })))
        .onConflictDoNothing()
    : null;
  const remove = removed.length ? db.delete(s.xpEvents).where(inArray(s.xpEvents.key, removed.map((e) => e.key))) : null;
  if (insert && remove) await db.batch([remove, insert]);
  else await (insert ?? remove);
  return added.reduce((n, a) => n + a.amount, 0) - removed.reduce((n, e) => n + e.amount, 0);
}

/** Brings one task's XP in line with its stage, deep-task and star picks. */
export async function reconcileTask(taskId: string): Promise<number> {
  const [task] = await db.select().from(s.tasks).where(eq(s.tasks.id, taskId)).limit(1);
  if (!task) return 0;
  const [deep, star] = await Promise.all([
    db.$count(s.deepTasks, eq(s.deepTasks.taskId, taskId)),
    db.$count(s.weeklyStars, eq(s.weeklyStars.taskId, taskId)),
  ]);
  let desired = taskAwards(task, { deep: deep > 0, star: star > 0 }, new Date());

  // plain general tasks: at most GENERAL_DAILY_CAP paid finishes per day
  const general = desired.find((a) => a.kind === "general");
  if (general) {
    const day = ymd(general.at);
    const others = await db.$count(
      s.xpEvents,
      and(eq(s.xpEvents.kind, "general"), eq(s.xpEvents.day, day), sql`${s.xpEvents.key} <> ${general.key}`),
    );
    if (others >= GENERAL_DAILY_CAP) desired = desired.filter((a) => a !== general);
  }
  const small = desired.find((a) => a.kind === "subtask");
  if (small) desired = fitSmall(desired, await smallXpOn(ymd(small.at), small.key));
  const gained = await reconcile(`t:${taskId}:`, desired, taskId);
  await checkAchievements();
  return gained;
}

/** Subtask and checklist XP already earned on a day, not counting `exceptKey` (the award being settled). */
async function smallXpOn(day: string, exceptKey: string) {
  const [row] = await db
    .select({ n: sql<number>`coalesce(sum(${s.xpEvents.amount}), 0)` })
    .from(s.xpEvents)
    .where(and(inArray(s.xpEvents.kind, ["subtask", "check"]), eq(s.xpEvents.day, day), sql`${s.xpEvents.key} <> ${exceptKey}`));
  return Number(row?.n ?? 0);
}

/** Brings one checklist item's XP in line with whether it's ticked. */
export async function reconcileCheck(itemId: string, taskId: string, doneAt: Date | null): Promise<number> {
  const award = checkAward(itemId, doneAt);
  const desired = award ? fitSmall([award], await smallXpOn(ymd(award.at), award.key)) : [];
  return reconcile(`c:${itemId}`, desired, taskId);
}

/** Brings one routine's XP for one day in line with its ticks. */
export async function reconcileRoutine(day: string, routineKey: string): Promise<number> {
  const [routine] = await db.select().from(s.routines).where(eq(s.routines.key, routineKey)).limit(1);
  if (!routine) return 0;
  const ticked = await db.$count(s.routineChecks, and(eq(s.routineChecks.date, day), eq(s.routineChecks.routineKey, routineKey)));
  const award = routineAward(day, routineKey, ticked, routine.items.length, new Date());
  const gained = await reconcile(`r:${day}:${routineKey}`, award ? [award] : [], null);
  await checkAchievements();
  return gained;
}

/** Unlocks any achievement earned in the current week. Unlocked ones stay unlocked. */
export async function checkAchievements() {
  const today = ymd();
  const week = starWeek(today);
  const unlocked = new Set((await db.select({ key: s.achievements.key }).from(s.achievements)).map((a) => a.key));
  const earned: AchievementKey[] = [];
  const weekStart = new Date(Date.parse(`${week}T00:00:00Z`) - 864e5); // a day early covers the timezone offset

  if (!unlocked.has("balanced_week")) {
    const [workspaces, moves] = await Promise.all([
      db.select({ id: s.workspaces.id }).from(s.workspaces),
      db
        .select({ workspaceId: s.projects.workspaceId, at: s.stageEvents.at })
        .from(s.stageEvents)
        .innerJoin(s.tasks, eq(s.stageEvents.taskId, s.tasks.id))
        .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
        .where(and(gte(s.stageEvents.at, weekStart), sql`${s.stageEvents.fromStage} is not null`)),
    ]);
    const moved = new Set(moves.filter((m) => starWeek(ymd(m.at)) === week).map((m) => m.workspaceId));
    if (balancedWeek(workspaces.map((w) => w.id), moved)) earned.push("balanced_week");
  }

  if (!unlocked.has("full_stack_week")) {
    const kinds = await db.select({ kind: s.xpEvents.kind }).from(s.xpEvents).where(gte(s.xpEvents.day, week));
    if (fullStackWeek(new Set(kinds.map((k) => k.kind)))) earned.push("full_stack_week");
  }

  if (!unlocked.has("tutorkit_steady")) {
    const rows = await db
      .select({ key: s.xpEvents.key })
      .from(s.xpEvents)
      .where(and(like(s.xpEvents.key, "r:%:tk_sun"), gte(s.xpEvents.day, addDays(week, -21))));
    const sundays = new Set(rows.map((r) => r.key.split(":")[1]));
    if (tutorkitSteady(week, sundays)) earned.push("tutorkit_steady");
  }

  if (!unlocked.has("inbox_zero")) {
    const reviewDone = (await db.$count(s.xpEvents, eq(s.xpEvents.key, `r:${week}:review`))) > 0;
    if (reviewDone) {
      const overdue = await db
        .select({ stage: s.tasks.stage })
        .from(s.tasks)
        .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
        .where(and(isNull(s.tasks.closedAt), eq(s.projects.status, "active"), lt(s.tasks.due, week)));
      if (inboxZero(true, overdue.filter((t) => !FINISHED_FOR_ME.has(t.stage)).length)) earned.push("inbox_zero");
    }
  }

  if (earned.length) await db.insert(s.achievements).values(earned.map((key) => ({ key }))).onConflictDoNothing();
}
