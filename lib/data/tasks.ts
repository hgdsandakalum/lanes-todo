import "server-only";
import { and, asc, count, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";

/** Active projects with their workspace, for quick add's #code lookup and default project. */
export async function getQuickAddProjects() {
  await requireSession();
  return db
    .select({
      id: s.projects.id,
      code: s.projects.code,
      name: s.projects.name,
      color: s.projects.color,
      workspaceSlug: s.workspaces.slug,
      isPrimary: s.workspaces.isPrimary,
    })
    .from(s.projects)
    .innerJoin(s.workspaces, eq(s.projects.workspaceId, s.workspaces.id))
    .where(eq(s.projects.status, "active"))
    .orderBy(asc(s.workspaces.sort), asc(s.projects.sort));
}

/** Open tasks for the given projects, plus how many each has closed. */
export async function getProjectTasks(projectIds: string[]) {
  await requireSession();
  if (projectIds.length === 0) return { open: [], closed: {} as Record<string, number> };
  const [open, closedRows] = await Promise.all([
    db
      .select()
      .from(s.tasks)
      .where(and(inArray(s.tasks.projectId, projectIds), isNull(s.tasks.closedAt)))
      .orderBy(asc(s.tasks.sort), asc(s.tasks.createdAt)),
    db
      .select({ projectId: s.tasks.projectId, n: count() })
      .from(s.tasks)
      .where(and(inArray(s.tasks.projectId, projectIds), isNotNull(s.tasks.closedAt)))
      .groupBy(s.tasks.projectId),
  ]);
  return { open, closed: Object.fromEntries(closedRows.map((r) => [r.projectId, r.n])) as Record<string, number> };
}
