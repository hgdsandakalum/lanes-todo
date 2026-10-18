import "server-only";
import { and, asc, desc, eq, gte, inArray, isNull, or, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { addDays, daysBetween, ymd } from "@/lib/domain/dates";
import { BOARD_CLOSED_DAYS } from "@/lib/domain/releases";

/**
 * A project page by workspace slug and project code (any case): the project, its open tasks,
 * tasks closed in the last two weeks (for the board's last column), awaiting production and release history.
 */
export async function getProjectPage(slug: string, code: string, day: string) {
  await requireSession();
  const [row] = await db
    .select({ project: s.projects, workspace: s.workspaces })
    .from(s.projects)
    .innerJoin(s.workspaces, eq(s.projects.workspaceId, s.workspaces.id))
    .where(and(eq(s.workspaces.slug, slug), sql`lower(${s.projects.code}) = ${code.toLowerCase()}`))
    .limit(1);
  if (!row) return null;
  const { project } = row;

  const closedSince = new Date(Date.parse(`${addDays(day, -BOARD_CLOSED_DAYS)}T00:00:00Z`) - 864e5);
  const [tasks, closedCount, releases] = await Promise.all([
    db
      .select()
      .from(s.tasks)
      .where(and(eq(s.tasks.projectId, project.id), or(isNull(s.tasks.closedAt), gte(s.tasks.closedAt, closedSince))))
      .orderBy(asc(s.tasks.sort), asc(s.tasks.createdAt)),
    db.$count(s.tasks, and(eq(s.tasks.projectId, project.id), sql`${s.tasks.closedAt} is not null`)),
    db.select().from(s.releases).where(eq(s.releases.projectId, project.id)).orderBy(desc(s.releases.releasedAt)).limit(20),
  ]);

  const shipped = releases.length
    ? await db
        .select({ id: s.tasks.id, title: s.tasks.title, releaseId: s.tasks.releaseId })
        .from(s.tasks)
        .where(inArray(s.tasks.releaseId, releases.map((r) => r.id)))
    : [];

  const open = tasks.filter((t) => t.closedAt == null);
  const recentlyClosed = tasks.filter((t) => t.closedAt != null && daysBetween(ymd(t.closedAt), day) <= BOARD_CLOSED_DAYS);
  const awaiting = open
    .filter((t) => t.type === "code" && t.devReleasedAt != null)
    .map((t) => {
      const devDay = ymd(t.devReleasedAt!);
      const waited = daysBetween(devDay, day);
      return { ...t, devDay, waited, flagged: waited > project.prodWaitDays };
    })
    .sort((a, b) => b.waited - a.waited);

  return {
    ...row,
    open,
    recentlyClosed,
    closedCount,
    awaiting,
    releases: releases.map((r) => ({ ...r, tasks: shipped.filter((t) => t.releaseId === r.id) })),
  };
}
