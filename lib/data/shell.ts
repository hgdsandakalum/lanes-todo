import "server-only";
import { cache } from "react";
import { asc, eq, gte, or, sum } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { levelFromXp } from "@/lib/game/levels";
import { toItems } from "@/lib/domain/routines";
import { ymd } from "@/lib/domain/dates";

export async function getWorkspaces() {
  await requireSession();
  return db.select().from(s.workspaces).orderBy(asc(s.workspaces.sort));
}

/** Cached per request: the level bar and the home page both read it. */
export const getXpSummary = cache(async () => {
  await requireSession();
  const rows = await db
    .select({ track: s.xpEvents.track, total: sum(s.xpEvents.amount) })
    .from(s.xpEvents)
    .groupBy(s.xpEvents.track);
  const byTrack = { code: 0, design: 0, general: 0 } as Record<"code" | "design" | "general", number>;
  for (const r of rows) byTrack[r.track] = Number(r.total ?? 0);
  const total = byTrack.code + byTrack.design + byTrack.general;
  return { total, byTrack, level: levelFromXp(total) };
});

export async function getWorkspaceBySlug(slug: string) {
  await requireSession();
  const [ws] = await db.select().from(s.workspaces).where(eq(s.workspaces.slug, slug)).limit(1);
  if (!ws) return null;
  const projects = await db
    .select()
    .from(s.projects)
    .where(eq(s.projects.workspaceId, ws.id))
    .orderBy(asc(s.projects.sort));
  return { ...ws, projects };
}

/** Routines scheduled for a day, each with the item indexes already ticked that day. */
export async function getRoutinesFor(day: string, dayOfWeek: number) {
  await requireSession();
  const [all, checks] = await Promise.all([
    db.select().from(s.routines).orderBy(asc(s.routines.sort)),
    db.select().from(s.routineChecks).where(eq(s.routineChecks.date, day)),
  ]);
  return all
    .filter((r) => r.weekdays.includes(dayOfWeek))
    .map((r) => ({
      ...r,
      items: toItems(r.items),
      checked: checks.filter((c) => c.routineKey === r.key).map((c) => c.itemIndex),
    }));
}

/**
 * Finished-task counts per local day since `since` (YYYY-MM-DD).
 * A task counts on the day it was finished for you: dev release or close, whichever came first.
 */
export async function getActivity(since: string) {
  await requireSession();
  const start = new Date(Date.parse(`${since}T00:00:00Z`) - 864e5); // a day early covers any timezone offset
  const rows = await db
    .select({ dev: s.tasks.devReleasedAt, closed: s.tasks.closedAt })
    .from(s.tasks)
    .where(or(gte(s.tasks.devReleasedAt, start), gte(s.tasks.closedAt, start)));
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const at = [r.dev, r.closed].filter((d): d is Date => d != null).sort((a, b) => a.getTime() - b.getTime())[0];
    const day = ymd(at);
    if (day >= since) counts[day] = (counts[day] ?? 0) + 1;
  }
  return counts;
}
