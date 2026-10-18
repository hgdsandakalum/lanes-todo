import "server-only";
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import type { getToday } from "@/lib/data/today";
import { addDays } from "@/lib/domain/dates";
import { REVIEW_STAGE } from "@/lib/domain/review";
import { toItems, type Signal } from "@/lib/domain/routines";

type SignalTask = { id: string; title: string; projectCode: string; projectColor: string };

/** What a signal says right now: a short line, whether it's urgent (overdue, over a limit), and the tasks behind it. */
export type SignalState = { summary: string; alert: boolean; tasks: SignalTask[] };

const pick = (t: SignalTask): SignalTask => ({ id: t.id, title: t.title, projectCode: t.projectCode, projectColor: t.projectColor });
const n = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/** Live counts for routine items, from data the Today page already loaded plus uninvoiced work. */
export async function getSignals(day: string, today: Awaited<ReturnType<typeof getToday>>): Promise<Record<Signal, SignalState>> {
  await requireSession();
  const reviewStages = new Set(Object.values(REVIEW_STAGE));
  const reviews = today.pickable.filter((t) => reviewStages.has(t.stage) || t.kind === "review");
  const tomorrow = addDays(day, 1);
  const due = today.dueSoon.filter((t) => t.due! <= tomorrow);
  const overdue = due.filter((t) => t.due! < day).length;
  const flagged = today.awaiting.filter((t) => t.flagged).length;
  const uninvoiced = await db
    .select({ id: s.tasks.id, title: s.tasks.title, projectCode: s.projects.code, projectColor: s.projects.color })
    .from(s.tasks)
    .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
    .where(and(eq(s.projects.billable, true), isNotNull(s.tasks.closedAt), isNull(s.tasks.invoicedAt)))
    .orderBy(asc(s.tasks.closedAt));

  return {
    reviews: { summary: reviews.length ? `${n(reviews.length, "task")} in review` : "Nothing in review", alert: false, tasks: reviews.map(pick) },
    production: {
      summary: today.awaiting.length ? `${n(today.awaiting.length, "task")} waiting${flagged ? `, ${flagged} over the limit` : ""}` : "All in production",
      alert: flagged > 0,
      tasks: today.awaiting.map(pick),
    },
    due: {
      summary: due.length ? [overdue ? `${overdue} overdue` : "", due.length - overdue ? `${due.length - overdue} due soon` : ""].filter(Boolean).join(", ") : "Nothing due by tomorrow",
      alert: overdue > 0,
      tasks: due.map(pick),
    },
    deep: { summary: today.deep ? today.deep.title : "Not picked yet", alert: false, tasks: today.deep ? [pick(today.deep)] : [] },
    invoice: { summary: uninvoiced.length ? `${n(uninvoiced.length, "task")} to invoice` : "All invoiced", alert: false, tasks: uninvoiced },
  };
}

/** Every routine with its items, in order, for the editor. */
export async function listRoutines() {
  await requireSession();
  const rows = await db.select().from(s.routines).orderBy(asc(s.routines.sort));
  return rows.map((r) => ({ ...r, items: toItems(r.items) }));
}
