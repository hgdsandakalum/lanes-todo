"use server";
import { and, asc, eq, inArray, isNull, max, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { isLabel, LABEL_MAX } from "@/lib/domain/quick-add";
import { safeHttpUrl } from "@/lib/domain/repo";
import { reconcileCheck } from "@/lib/game/engine";
import { addTask, ensureLabels } from "@/lib/tasks/core";
import type { FormState } from "./tasks";

/** Actions on a task's page: checklist, subtasks, labels, references, dependencies and the timer. */

const ITEM_MAX = 300;
const ITEMS_MAX = 100;

async function exists(taskId: string) {
  return (await db.$count(s.tasks, eq(s.tasks.id, taskId))) > 0;
}

// ---- checklist

export async function addChecklistItems(taskId: string, text: string): Promise<FormState> {
  await requireSession();
  // one item per line, so a pasted list becomes a checklist; "- [ ] " and "- " prefixes are dropped
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*]\s*)?(?:\[[ xX]\]\s*)?/, "").trim())
    .filter(Boolean);
  if (lines.length === 0) return { error: "Type an item first." };
  if (lines.some((l) => l.length > ITEM_MAX)) return { error: `Keep each item under ${ITEM_MAX} characters.` };
  if (!(await exists(taskId))) return { error: "That task doesn't exist any more." };
  const [{ n, top }] = await db
    .select({ n: sql<number>`count(*)`, top: max(s.checklistItems.sort) })
    .from(s.checklistItems)
    .where(eq(s.checklistItems.taskId, taskId));
  if (n + lines.length > ITEMS_MAX) return { error: `A checklist holds up to ${ITEMS_MAX} items.` };
  await db.insert(s.checklistItems).values(lines.map((t, i) => ({ id: `ci_${crypto.randomUUID()}`, taskId, text: t, sort: (top ?? -1) + 1 + i })));
  refresh();
  return { saved: Date.now() };
}

/** Ticks or unticks an item. Returns the XP change. */
export async function setChecklistItem(itemId: string, done: boolean): Promise<number> {
  await requireSession();
  const [item] = await db.select().from(s.checklistItems).where(eq(s.checklistItems.id, itemId)).limit(1);
  if (!item) return 0;
  const doneAt = done ? (item.doneAt ?? new Date()) : null;
  await db.update(s.checklistItems).set({ doneAt }).where(eq(s.checklistItems.id, itemId));
  const xp = await reconcileCheck(itemId, item.taskId, doneAt);
  refresh();
  return xp;
}

export async function deleteChecklistItem(itemId: string) {
  await requireSession();
  const [item] = await db.select().from(s.checklistItems).where(eq(s.checklistItems.id, itemId)).limit(1);
  if (!item) return;
  await db.delete(s.checklistItems).where(eq(s.checklistItems.id, itemId));
  await reconcileCheck(itemId, item.taskId, null); // its XP goes with it
  refresh();
}

// ---- subtasks

/** Adds a subtask from a quick-add line; it lives in the parent's project unless the line names another. A QA bug is a bug fix unless the line says otherwise. */
export async function addSubtask(parentId: string, text: string, qa = false): Promise<FormState> {
  await requireSession();
  const [parent] = await db.select().from(s.tasks).where(eq(s.tasks.id, parentId)).limit(1);
  if (!parent) return { error: "That task doesn't exist any more." };
  if (parent.parentId) return { error: "Subtasks can't have subtasks of their own. Add a checklist instead." };
  const added = await addTask({ text, fallbackProjectId: parent.projectId, parentId, kind: qa ? "bug" : undefined });
  if (!added.ok) return { error: added.error };
  refresh();
  return { saved: Date.now() };
}

// ---- labels

export async function setTaskLabels(taskId: string, input: string): Promise<FormState> {
  await requireSession();
  const names = [...new Set(input.split(/[\s,]+/).map((n) => n.replace(/^\+/, "").toLowerCase()).filter(Boolean))];
  const bad = names.find((n) => !isLabel(n));
  if (bad) return { error: `"${bad}" can't be a label. Use letters, digits, - and _ (up to ${LABEL_MAX}).` };
  if (names.length > 12) return { error: "Keep it to 12 labels per task." };
  if (!(await exists(taskId))) return { error: "That task doesn't exist any more." };
  const ids = await ensureLabels(names);
  await db.batch([
    db.delete(s.taskLabels).where(eq(s.taskLabels.taskId, taskId)),
    ...(ids.length ? [db.insert(s.taskLabels).values(ids.map((labelId) => ({ taskId, labelId })))] : []),
  ]);
  // labels no task uses any more are tidied away
  await db.delete(s.labels).where(sql`${s.labels.id} not in (select ${s.taskLabels.labelId} from ${s.taskLabels})`);
  refresh();
  return { saved: Date.now() };
}

// ---- references: pull requests, issues, commits, links

const SHA = /^[0-9a-f]{7,40}$/i;

/**
 * A pasted URL is classified by its shape (…/pull/12, …/issues/3, …/commit/sha); with a repo on the project,
 * "#12" is taken as a PR or issue and a bare SHA as a commit.
 */
export async function addRef(taskId: string, kind: "pr" | "issue" | "commit" | "link", input: string, title: string): Promise<FormState> {
  await requireSession();
  const [row] = await db
    .select({ repo: s.projects.repo })
    .from(s.tasks)
    .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
    .where(eq(s.tasks.id, taskId))
    .limit(1);
  if (!row) return { error: "That task doesn't exist any more." };
  const value = input.trim();
  if (!["pr", "issue", "commit", "link"].includes(kind)) return { error: "Pick a kind of reference." };
  if (title.length > 200) return { error: "Keep the title under 200 characters." };

  let ref: string | null = null;
  if (/^https?:\/\//i.test(value)) ref = safeHttpUrl(value);
  else if (kind === "commit" && SHA.test(value)) ref = value.toLowerCase();
  else if ((kind === "pr" || kind === "issue") && /^#?\d{1,7}$/.test(value)) ref = `#${value.replace("#", "")}`;
  if (!ref) {
    const hint = kind === "commit" ? "a commit URL or SHA" : kind === "link" ? "a URL starting with https://" : "a URL or #number";
    return { error: `That isn't ${hint}.` };
  }
  if (!ref.startsWith("http") && !row.repo) return { error: "Add a repo in the project's settings to use #numbers and SHAs, or paste the full URL." };
  await db.insert(s.taskRefs).values({ id: `rf_${crypto.randomUUID()}`, taskId, kind, ref, title: title.trim() || null });
  refresh();
  return { saved: Date.now() };
}

export async function deleteRef(refId: string) {
  await requireSession();
  await db.delete(s.taskRefs).where(eq(s.taskRefs.id, refId));
  refresh();
}

// ---- dependencies

/** Would `taskId` waiting on `dependsOnId` close a loop? Walks what dependsOnId already waits on. */
async function makesCycle(taskId: string, dependsOnId: string) {
  const seen = new Set<string>();
  let frontier = [dependsOnId];
  while (frontier.length) {
    if (frontier.includes(taskId)) return true;
    frontier.forEach((f) => seen.add(f));
    const next = await db.select({ id: s.taskDeps.dependsOnId }).from(s.taskDeps).where(inArray(s.taskDeps.taskId, frontier));
    frontier = next.map((n) => n.id).filter((id) => !seen.has(id));
  }
  return false;
}

export async function addDependency(taskId: string, dependsOnId: string): Promise<FormState> {
  await requireSession();
  if (!dependsOnId) return { error: "Pick the task this one waits on." };
  if (taskId === dependsOnId) return { error: "A task can't wait on itself." };
  if (!(await exists(taskId)) || !(await exists(dependsOnId))) return { error: "That task doesn't exist any more." };
  if (await makesCycle(taskId, dependsOnId)) return { error: "That task already waits on this one, so they'd wait on each other." };
  await db.insert(s.taskDeps).values({ taskId, dependsOnId }).onConflictDoNothing();
  refresh();
  return { saved: Date.now() };
}

export async function removeDependency(taskId: string, dependsOnId: string) {
  await requireSession();
  await db.delete(s.taskDeps).where(and(eq(s.taskDeps.taskId, taskId), eq(s.taskDeps.dependsOnId, dependsOnId)));
  refresh();
}

// ---- timer

/** Starts the timer on a task. Only one timer runs at a time: any other running one stops first. */
export async function startTimer(taskId: string) {
  await requireSession();
  if (!(await exists(taskId))) return;
  const now = new Date();
  await db.batch([
    db.update(s.timeEntries).set({ endedAt: now }).where(isNull(s.timeEntries.endedAt)),
    db.insert(s.timeEntries).values({ id: `te_${crypto.randomUUID()}`, taskId, startedAt: now }),
  ]);
  refresh();
}

export async function stopTimer() {
  await requireSession();
  await db.update(s.timeEntries).set({ endedAt: new Date() }).where(isNull(s.timeEntries.endedAt));
  refresh();
}

/** Adds time worked without the timer, ending now. */
export async function logTime(taskId: string, minutes: number): Promise<FormState> {
  await requireSession();
  if (!Number.isInteger(minutes) || minutes <= 0 || minutes > 24 * 60) return { error: "Log between 1 minute and 24 hours." };
  if (!(await exists(taskId))) return { error: "That task doesn't exist any more." };
  const end = new Date();
  await db.insert(s.timeEntries).values({ id: `te_${crypto.randomUUID()}`, taskId, startedAt: new Date(end.getTime() - minutes * 6e4), endedAt: end });
  refresh();
  return { saved: Date.now() };
}

/** The running timer, if any, for the shell. */
export async function runningTimer() {
  await requireSession();
  const [row] = await db
    .select({ taskId: s.timeEntries.taskId, startedAt: s.timeEntries.startedAt, title: s.tasks.title })
    .from(s.timeEntries)
    .innerJoin(s.tasks, eq(s.timeEntries.taskId, s.tasks.id))
    .where(isNull(s.timeEntries.endedAt))
    .orderBy(asc(s.timeEntries.startedAt))
    .limit(1);
  return row ?? null;
}
