"use server";
import { eq, inArray, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { csvRecords } from "@/lib/domain/csv";
import { isYmd } from "@/lib/domain/dates";
import { parseDuration } from "@/lib/domain/estimate";
import { isLabel, TITLE_MAX } from "@/lib/domain/quick-add";
import { parseBranches, safeHttpUrl } from "@/lib/domain/repo";
import { CODE_KINDS, FINISHED_FOR_ME, PRIORITIES, TASK_TYPES, stagesFor, type CodeKind, type Priority, type TaskType } from "@/lib/domain/stages";
import { reconcileTask } from "@/lib/game/engine";
import { ensureLabels } from "@/lib/tasks/core";

/**
 * Imports add tasks; they never change or delete what's there. Two sources:
 *  - CSV: a header row and one task per row (title and project required; the export's columns are all read).
 *  - A Lanes JSON backup: tasks whose id isn't here yet, with their checklists, labels and references.
 * The preview runs the same checks without writing, so what you confirm is what gets added.
 */

const MAX_BYTES = 5_000_000;
const MAX_ROWS = 5000;

type Row = {
  line: number;
  task: typeof s.tasks.$inferInsert;
  labels: string[];
  checklist?: { text: string; done: boolean }[];
  refs?: { kind: "pr" | "issue" | "commit" | "link"; ref: string; title: string | null }[];
};
export type ImportResult = { error?: string; ok?: number; skipped?: { line: number; reason: string }[]; done?: boolean; sample?: string[] };

async function projectsByCode() {
  const rows = await db.select({ id: s.projects.id, code: s.projects.code, hasStaging: s.projects.hasStaging, status: s.projects.status }).from(s.projects);
  return new Map(rows.map((p) => [p.code.toUpperCase(), p]));
}

async function fromCsv(text: string): Promise<{ rows: Row[]; skipped: { line: number; reason: string }[] }> {
  const records = csvRecords(text);
  const projects = await projectsByCode();
  const rows: Row[] = [];
  const skipped: { line: number; reason: string }[] = [];
  records.slice(0, MAX_ROWS).forEach((r, i) => {
    const line = i + 2;
    const skip = (reason: string) => skipped.push({ line, reason });
    const title = r.title ?? "";
    if (!title) return skip("No title.");
    if (title.length > TITLE_MAX) return skip(`Title over ${TITLE_MAX} characters.`);
    const project = projects.get((r.project ?? "").replace(/^#/, "").toUpperCase());
    if (!project) return skip(`No project with code "${r.project ?? ""}".`);
    if (project.status !== "active") return skip("Its project is archived.");
    const type = (r.type || "general").toLowerCase() as TaskType;
    if (!TASK_TYPES.includes(type)) return skip(`Type "${r.type}" isn't code, design or general.`);
    const kind = type === "code" ? (r.kind || "feature").toLowerCase() : "";
    if (type === "code" && !CODE_KINDS.includes(kind as CodeKind)) return skip(`Kind "${r.kind}" isn't one of ${CODE_KINDS.join(", ")}.`);
    const stage = (r.stage || "todo").toLowerCase();
    if (!stagesFor(type, project.hasStaging, kind).some((x) => x.key === stage)) return skip(`Stage "${r.stage}" isn't a stage for this kind of task.`);
    if (FINISHED_FOR_ME.has(stage)) return skip("Finished tasks aren't imported (they'd change your XP and streaks).");
    const priority = (r.priority || "").toLowerCase();
    if (priority && !PRIORITIES.includes(priority as Priority)) return skip(`Priority "${r.priority}" isn't urgent, high, medium or low.`);
    if (r.due && !isYmd(r.due)) return skip(`Due "${r.due}" isn't a YYYY-MM-DD date.`);
    const est = r.estimate_minutes || r.estimate || "";
    const estimate = est ? parseDuration(est) : null;
    if (est && estimate == null) return skip(`Estimate "${est}" isn't 30m, 2h or a number of minutes.`);
    const labels = (r.labels ?? "").split(/[\s,]+/).map((l) => l.replace(/^\+/, "").toLowerCase()).filter(Boolean);
    if (labels.some((l) => !isLabel(l))) return skip("A label has characters other than letters, digits, - and _.");
    const branches = parseBranches(r.branches ?? r.branch ?? "");
    if (!branches.ok) return skip(branches.error);
    const link = r.link ? safeHttpUrl(r.link) : null;
    if (r.link && !link) return skip("The link isn't an http(s) URL.");
    rows.push({
      line,
      labels,
      task: {
        id: `t_${crypto.randomUUID()}`,
        projectId: project.id,
        title,
        type,
        kind: kind && kind !== "feature" ? kind : null,
        stage,
        priority: (priority || null) as Priority | null,
        due: r.due || null,
        estimateMin: estimate,
        branch: type === "code" ? branches.branches.join(" ") || null : null,
        ticket: (r.ticket || "").slice(0, 50) || null,
        link,
        description: (r.description || "").slice(0, 20_000) || null,
      },
    });
  });
  if (records.length > MAX_ROWS) skipped.push({ line: MAX_ROWS + 2, reason: `Only the first ${MAX_ROWS} rows are read.` });
  return { rows, skipped };
}

async function fromBackup(text: string): Promise<{ rows: Row[]; skipped: { line: number; reason: string }[] } | { error: string }> {
  let parsed: { app?: string; data?: Record<string, unknown[]> };
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "That file isn't valid JSON." };
  }
  if (parsed.app !== "lanes" || !parsed.data || !Array.isArray(parsed.data.tasks)) return { error: "That JSON isn't a Lanes backup." };
  type T = typeof s.tasks.$inferSelect & { createdAt: string; closedAt: string | null; devReleasedAt: string | null; remindAt: string | null };
  const tasks = parsed.data.tasks as T[];
  const projectIds = new Set((await db.select({ id: s.projects.id }).from(s.projects)).map((p) => p.id));
  const ids = tasks.map((t) => String(t.id)).filter((id) => /^t_[0-9a-f-]{36}$/.test(id));
  const existing = new Set<string>();
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = await db.select({ id: s.tasks.id }).from(s.tasks).where(inArray(s.tasks.id, ids.slice(i, i + 500)));
    chunk.forEach((r) => existing.add(r.id));
  }
  const labelNames = new Map(((parsed.data.labels ?? []) as { id: string; name: string }[]).map((l) => [l.id, l.name]));
  const taskLabels = (parsed.data.taskLabels ?? []) as { taskId: string; labelId: string }[];
  const items = (parsed.data.checklistItems ?? []) as { taskId: string; text: string; doneAt: string | null }[];
  type RefKind = NonNullable<Row["refs"]>[number]["kind"];
  const refs = (parsed.data.taskRefs ?? []) as { taskId: string; kind: RefKind; ref: string; title: string | null }[];

  const rows: Row[] = [];
  const skipped: { line: number; reason: string }[] = [];
  tasks.slice(0, MAX_ROWS).forEach((t, i) => {
    const line = i + 1;
    if (!/^t_[0-9a-f-]{36}$/.test(String(t.id))) return skipped.push({ line, reason: "Not a Lanes task id." });
    if (existing.has(t.id)) return; // already here: nothing to add, and not worth listing
    if (!projectIds.has(t.projectId)) return skipped.push({ line, reason: `"${t.title}": its project isn't in this Lanes.` });
    if (!t.title || typeof t.title !== "string") return skipped.push({ line, reason: "No title." });
    const date = (v: string | null) => (v ? new Date(v) : null);
    rows.push({
      line,
      labels: taskLabels.filter((l) => l.taskId === t.id).map((l) => labelNames.get(l.labelId)).filter((n): n is string => !!n && isLabel(n)),
      checklist: items.filter((c) => c.taskId === t.id).map((c) => ({ text: String(c.text).slice(0, 300), done: c.doneAt != null })),
      refs: refs.filter((r) => r.taskId === t.id && ["pr", "issue", "commit", "link"].includes(r.kind)).map((r) => ({ kind: r.kind, ref: String(r.ref), title: r.title })),
      task: {
        ...t,
        link: t.link ? safeHttpUrl(t.link) : null,
        releaseId: null, // releases aren't restored, so the link would dangle
        parentId: t.parentId && (existing.has(t.parentId) || ids.includes(t.parentId)) ? t.parentId : null,
        createdAt: date(t.createdAt) ?? new Date(),
        closedAt: date(t.closedAt),
        devReleasedAt: date(t.devReleasedAt),
        remindAt: date(t.remindAt),
      },
    });
  });
  return { rows, skipped };
}

async function read(form: FormData): Promise<{ rows: Row[]; skipped: { line: number; reason: string }[] } | { error: string }> {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file or a Lanes JSON backup." };
  if (file.size > MAX_BYTES) return { error: "That file is over 5 MB." };
  const text = await file.text();
  return file.name.toLowerCase().endsWith(".json") || text.trimStart().startsWith("{") ? fromBackup(text) : fromCsv(text);
}

/** Checks a file and says what importing it would add, without writing anything. */
export async function previewImport(_: ImportResult | undefined, form: FormData): Promise<ImportResult> {
  await requireSession();
  const res = await read(form);
  if ("error" in res) return { error: res.error };
  return { ok: res.rows.length, skipped: res.skipped.slice(0, 50), sample: res.rows.slice(0, 5).map((r) => r.task.title) };
}

/** Adds the file's tasks. Finished work from a backup keeps its dates and has its XP settled, as if it had been done here. */
export async function runImport(_: ImportResult | undefined, form: FormData): Promise<ImportResult> {
  await requireSession();
  const res = await read(form);
  if ("error" in res) return { error: res.error };
  const { rows, skipped } = res;
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const labelNames = [...new Set(chunk.flatMap((r) => r.labels))];
    await ensureLabels(labelNames);
    const labelIds = labelNames.length ? new Map((await db.select().from(s.labels).where(inArray(s.labels.name, labelNames))).map((l) => [l.name, l.id])) : new Map<string, string>();
    const stmts = chunk.flatMap((r) => {
      const id = r.task.id!;
      return [
        db.insert(s.tasks).values(r.task).onConflictDoNothing(),
        db.insert(s.stageEvents).values({ id: `se_${crypto.randomUUID()}`, taskId: id, fromStage: null, toStage: r.task.stage ?? "todo" }),
        ...(r.labels.length ? [db.insert(s.taskLabels).values(r.labels.map((n) => ({ taskId: id, labelId: labelIds.get(n)! }))).onConflictDoNothing()] : []),
        ...(r.checklist?.length ? [db.insert(s.checklistItems).values(r.checklist.map((c, sort) => ({ id: `ci_${crypto.randomUUID()}`, taskId: id, text: c.text, doneAt: c.done ? new Date() : null, sort })))] : []),
        ...(r.refs?.length ? [db.insert(s.taskRefs).values(r.refs.map((x) => ({ id: `rf_${crypto.randomUUID()}`, taskId: id, ...x })))] : []),
      ];
    });
    const [first, ...rest] = stmts;
    if (first) await db.batch([first, ...rest]);
  }
  // a subtask imported before its parent is fine: parent ids were checked against the file and the database
  await db.update(s.tasks).set({ parentId: null }).where(sql`${s.tasks.parentId} is not null and ${s.tasks.parentId} not in (select id from ${s.tasks})`);
  for (const r of rows) if (r.task.closedAt || r.task.devReleasedAt) await reconcileTask(r.task.id!);
  refresh();
  return { ok: rows.length, skipped: skipped.slice(0, 50), done: true };
}

/** For the page: how many tasks and projects there are. */
export async function dataCounts() {
  await requireSession();
  const [tasks, projects] = await Promise.all([db.$count(s.tasks), db.$count(s.projects, eq(s.projects.status, "active"))]);
  return { tasks, projects };
}
