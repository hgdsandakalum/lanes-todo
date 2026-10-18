import "server-only";
import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";

/** Escapes LIKE wildcards so "50%" and "a_b" match literally. */
const pattern = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
const likeI = (col: Parameters<typeof like>[0], p: string) => sql`${col} like ${p} escape '\\'`;

export type Hit = {
  kind: "task" | "project" | "release" | "review";
  id: string;
  title: string;
  href: string | null; // day reviews have no page of their own
  where: string; // what matched, e.g. "Checklist", "Branch", "Steps to reproduce"
  snippet: string | null;
  meta: { projectCode?: string; projectColor?: string; type?: string; taskKind?: string | null; stage?: string; closed?: boolean };
};

/** A line of context around the first match, for a result. */
function snippet(text: string | null, q: string): string | null {
  if (!text) return null;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return null;
  const start = Math.max(0, i - 60);
  const end = Math.min(text.length, i + q.length + 80);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).replace(/\s+/g, " ").trim()}${end < text.length ? "…" : ""}`;
}

const TASK_FIELDS = [
  ["title", "Title"],
  ["description", "Notes"],
  ["acceptance", "Acceptance criteria"],
  ["repro", "Steps to reproduce"],
  ["expected", "Expected behaviour"],
  ["actual", "Actual behaviour"],
  ["blocker", "Blocker"],
  ["branch", "Branch"],
  ["ticket", "Ticket"],
  ["link", "Link"],
] as const;

/**
 * Searches tasks (every text field, checklists, labels, references), projects, releases and day reviews.
 * Open tasks come before closed ones; at most `limit` task results.
 */
export async function search(query: string, limit = 60): Promise<Hit[]> {
  await requireSession();
  const q = query.trim().slice(0, 100);
  if (q.length < 2) return [];
  const p = pattern(q);

  const taskCols = {
    id: s.tasks.id,
    title: s.tasks.title,
    type: s.tasks.type,
    kind: s.tasks.kind,
    stage: s.tasks.stage,
    closedAt: s.tasks.closedAt,
    projectCode: s.projects.code,
    projectColor: s.projects.color,
    ...Object.fromEntries(TASK_FIELDS.map(([f]) => [f, s.tasks[f]])),
  } as const;

  const [direct, viaChecklist, viaLabel, viaRef, projects, releases, reviews] = await Promise.all([
    db
      .select(taskCols)
      .from(s.tasks)
      .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
      .where(or(...TASK_FIELDS.map(([f]) => likeI(s.tasks[f], p))))
      .orderBy(sql`${s.tasks.closedAt} is not null`, desc(s.tasks.createdAt))
      .limit(limit),
    db
      .select({ taskId: s.checklistItems.taskId, text: s.checklistItems.text })
      .from(s.checklistItems)
      .where(likeI(s.checklistItems.text, p))
      .limit(limit),
    db
      .select({ taskId: s.taskLabels.taskId, name: s.labels.name })
      .from(s.taskLabels)
      .innerJoin(s.labels, eq(s.taskLabels.labelId, s.labels.id))
      .where(likeI(s.labels.name, p))
      .limit(limit),
    db
      .select({ taskId: s.taskRefs.taskId, ref: s.taskRefs.ref, title: s.taskRefs.title })
      .from(s.taskRefs)
      .where(or(likeI(s.taskRefs.ref, p), likeI(s.taskRefs.title, p)))
      .limit(limit),
    db
      .select({ id: s.projects.id, name: s.projects.name, code: s.projects.code, color: s.projects.color, slug: s.workspaces.slug, ws: s.workspaces.name })
      .from(s.projects)
      .innerJoin(s.workspaces, eq(s.projects.workspaceId, s.workspaces.id))
      .where(or(likeI(s.projects.name, p), likeI(s.projects.code, p), likeI(s.projects.repo, p)))
      .limit(10),
    db
      .select({ id: s.releases.id, name: s.releases.name, code: s.projects.code, color: s.projects.color, slug: s.workspaces.slug })
      .from(s.releases)
      .innerJoin(s.projects, eq(s.releases.projectId, s.projects.id))
      .innerJoin(s.workspaces, eq(s.projects.workspaceId, s.workspaces.id))
      .where(likeI(s.releases.name, p))
      .limit(10),
    db.select().from(s.dayReviews).where(likeI(s.dayReviews.note, p)).orderBy(desc(s.dayReviews.date)).limit(10),
  ]);

  const hits: Hit[] = [];
  const seen = new Set<string>();
  const taskHit = (t: (typeof direct)[number], where: string, snip: string | null) => {
    if (seen.has(t.id)) return;
    seen.add(t.id);
    hits.push({
      kind: "task",
      id: t.id,
      title: t.title,
      href: `/t/${t.id.replace(/^t_/, "")}`,
      where,
      snippet: snip,
      meta: { projectCode: t.projectCode, projectColor: t.projectColor, type: t.type, taskKind: t.kind, stage: t.stage, closed: t.closedAt != null },
    });
  };

  for (const t of direct) {
    const [field, label] = TASK_FIELDS.find(([f]) => String((t as Record<string, unknown>)[f] ?? "").toLowerCase().includes(q.toLowerCase())) ?? ["title", "Title"];
    taskHit(t, label, field === "title" ? null : snippet(String((t as Record<string, unknown>)[field] ?? ""), q));
  }

  // tasks found through what hangs on them
  const extra = new Map<string, { where: string; snip: string | null }>();
  for (const c of viaChecklist) if (!extra.has(c.taskId)) extra.set(c.taskId, { where: "Checklist", snip: c.text });
  for (const l of viaLabel) if (!extra.has(l.taskId)) extra.set(l.taskId, { where: "Label", snip: l.name });
  for (const r of viaRef) if (!extra.has(r.taskId)) extra.set(r.taskId, { where: "Reference", snip: [r.ref, r.title].filter(Boolean).join(" · ") });
  const missing = [...extra.keys()].filter((id) => !seen.has(id));
  if (missing.length) {
    const rows = await db
      .select(taskCols)
      .from(s.tasks)
      .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
      .where(and(inArray(s.tasks.id, missing.slice(0, limit))));
    for (const t of rows) taskHit(t, extra.get(t.id)!.where, extra.get(t.id)!.snip);
  }
  hits.sort((a, b) => Number(a.meta.closed) - Number(b.meta.closed));

  for (const pr of projects)
    hits.unshift({ kind: "project", id: pr.id, title: pr.name, href: `/w/${pr.slug}/${pr.code.toLowerCase()}`, where: pr.ws, snippet: null, meta: { projectCode: pr.code, projectColor: pr.color } });
  for (const r of releases)
    hits.push({ kind: "release", id: r.id, title: r.name, href: `/w/${r.slug}/${r.code.toLowerCase()}#releases`, where: "Release", snippet: null, meta: { projectCode: r.code, projectColor: r.color } });
  for (const d of reviews) hits.push({ kind: "review", id: d.date, title: `Day review, ${d.date}`, href: null, where: "End-of-day note", snippet: snippet(d.note, q), meta: {} });
  return hits;
}
