"use server";
import { eq, inArray, or } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { isYmd, ymd, zonedTime } from "@/lib/domain/dates";
import { parseDuration } from "@/lib/domain/estimate";
import { ruleFrom } from "@/lib/domain/recur";
import { DESCRIPTION_MAX, TITLE_MAX } from "@/lib/domain/quick-add";
import { parseBranches, safeHttpUrl, withTicketBranch } from "@/lib/domain/repo";
import {
  CODE_KINDS,
  KIND_FIELDS,
  PRIORITIES,
  codeKind,
  shipsToProd,
  stageDates,
  stagesFor,
  TASK_TYPES,
  type CodeKind,
  type ContextField,
  type TaskType,
} from "@/lib/domain/stages";
import { reconcileTask } from "@/lib/game/engine";
import { addTask, moveTask, taskWithProject } from "@/lib/tasks/core";

export type FormState = { error?: string; saved?: number } | undefined;

const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

/** Quick add. The line is re-parsed on the server against the app timezone's today; the client's parse is only a preview. */
export async function createTask(_: FormState, form: FormData): Promise<FormState> {
  await requireSession();
  const added = await addTask({ text: field(form, "text"), fallbackProjectId: field(form, "projectId") || null });
  if (!added.ok) return { error: added.error };
  refresh();
  return { saved: Date.now() };
}

/** Moves a task to a stage of its type and settles its XP. Returns the XP change. */
export async function setTaskStage(taskId: string, stage: string): Promise<number> {
  await requireSession();
  const xp = await moveTask(taskId, stage);
  refresh();
  return xp;
}

const optionalInt = (v: string) => (v === "" ? null : Number(v));
const CONTEXT_MAX = 10_000;

/** Saves the edit panel. Changing type or kind resets the stage to "To do" when the old stage doesn't exist in the new workflow. */
export async function updateTask(_: FormState, form: FormData): Promise<FormState> {
  await requireSession();
  const row = await taskWithProject(field(form, "id"));
  if (!row) return { error: "That task doesn't exist any more." };
  const { task, hasStaging } = row;

  const title = field(form, "title");
  const description = field(form, "description");
  const type = field(form, "type") as TaskType;
  const due = field(form, "due");
  const prodDate = field(form, "prodDate");
  const devReleasedOn = field(form, "devReleasedOn"); // corrects when it reached dev; only sent once it has
  const ticket = field(form, "ticket");
  const branches = parseBranches(field(form, "branch"));
  const link = field(form, "link");
  const assets = optionalInt(field(form, "assets"));
  const revision = optionalInt(field(form, "revision"));
  const kindInput = field(form, "kind");
  const priority = field(form, "priority");
  const estimateInput = field(form, "estimate");
  const estimate = estimateInput ? parseDuration(estimateInput) : null;
  const remindInput = field(form, "remindAt"); // "2026-10-16T09:30", app timezone
  const remindAt = remindInput ? zonedTime(remindInput.slice(0, 10), remindInput.slice(11, 16)) : null;
  const recurInput = field(form, "recur");
  const recur = recurInput ? ruleFrom(recurInput) : null;
  const blocker = field(form, "blocker");
  const context = Object.fromEntries((["acceptance", "repro", "expected", "actual"] as ContextField[]).map((f) => [f, field(form, f)])) as Record<ContextField, string>;

  if (!title) return { error: "Give the task a title." };
  if (title.length > TITLE_MAX) return { error: `Keep the title under ${TITLE_MAX} characters.` };
  if (description.length > DESCRIPTION_MAX) return { error: `Keep the description under ${DESCRIPTION_MAX.toLocaleString("en")} characters.` };
  if (!TASK_TYPES.includes(type)) return { error: "Pick Code, Design or General." };
  if (due && !isYmd(due)) return { error: "The due date isn't a real date." };
  if (prodDate && !isYmd(prodDate)) return { error: "The prod date isn't a real date." };
  if (devReleasedOn && !isYmd(devReleasedOn)) return { error: "The dev release date isn't a real date." };
  if (devReleasedOn && devReleasedOn > ymd()) return { error: "The dev release date can't be in the future." };
  if (ticket.length > 50) return { error: "Keep the ticket ID under 50 characters." };
  if (type === "code" && !branches.ok) return { error: branches.error };
  if (kindInput && !CODE_KINDS.includes(kindInput as CodeKind)) return { error: "Pick a kind of code work." };
  if (priority && !PRIORITIES.includes(priority as never)) return { error: "Pick Urgent, High, Medium or Low." };
  if (estimateInput && estimate == null) return { error: "The estimate needs to look like 30m, 2h or 1h30m." };
  if (remindInput && !remindAt) return { error: "The reminder isn't a real date and time." };
  if (recurInput && !recur) return { error: 'Repeat needs to look like "every day", "weekdays", "every mon, thu" or "monthly 15".' };
  if (recur && !due) return { error: "A repeating task needs a due date to count from." };
  if (blocker.length > 500) return { error: "Keep the blocker under 500 characters." };
  if (Object.values(context).some((v) => v.length > CONTEXT_MAX)) return { error: `Keep each technical field under ${CONTEXT_MAX.toLocaleString("en")} characters.` };
  if (link && !safeHttpUrl(link)) return { error: "The link needs to start with https://." };
  for (const [n, label] of [[assets, "Assets"], [revision, "Revision round"]] as const) {
    if (type === "design" && n !== null && (!Number.isInteger(n) || n < 0 || n > 999)) return { error: `${label} must be a whole number.` };
  }

  const kind = codeKind(type, kindInput || "feature");
  // a corrected dev release day is stored at midday, app time
  const releasedAt = devReleasedOn && task.devReleasedAt && devReleasedOn !== ymd(task.devReleasedAt) ? zonedTime(devReleasedOn, "12:00") : task.devReleasedAt;
  const fields = kind ? KIND_FIELDS[kind] : [];
  const stageKept = stagesFor(type, hasStaging, kind).some((st) => st.key === task.stage);
  const stage = stageKept ? task.stage : "todo";
  // a bug or feature with a ticket gets its branch named after it, e.g. bugfix/t-206
  const branch = type === "code" && branches.ok ? withTicketBranch(branches.branches, { kind: codeKind(task.type, task.kind), ticket: task.ticket }, { kind, ticket }).join(" ") || null : null;
  const update = db
    .update(s.tasks)
    .set({
      title,
      description: description || null,
      type,
      kind: kind === "feature" ? null : kind,
      priority: priority ? (priority as (typeof PRIORITIES)[number]) : null,
      estimateMin: estimate,
      remindAt,
      recur,
      blocker: blocker || null,
      // technical fields the kind doesn't show are cleared, like other fields of another type
      acceptance: fields.includes("acceptance") ? context.acceptance || null : null,
      repro: fields.includes("repro") ? context.repro || null : null,
      expected: fields.includes("expected") ? context.expected || null : null,
      actual: fields.includes("actual") ? context.actual || null : null,
      due: due || null,
      prodDate: shipsToProd(type, kind) ? prodDate || null : null,
      // fields that belong to another type are cleared, so they can't resurface on a type switch back
      ticket: type === "code" ? ticket || null : null,
      branch,
      assets: type === "design" ? assets : null,
      revision: type === "design" ? revision : null,
      link: link ? safeHttpUrl(link) : null,
      stage,
      ...stageDates(type, stage, { ...task, devReleasedAt: releasedAt }, new Date(), kind),
    })
    .where(eq(s.tasks.id, task.id));

  if (stage === task.stage) await update;
  else
    await db.batch([
      update,
      db.insert(s.stageEvents).values({ id: `se_${crypto.randomUUID()}`, taskId: task.id, fromStage: task.stage, toStage: stage }),
    ]);
  await reconcileTask(task.id);
  refresh();
  return { saved: Date.now() };
}

/**
 * Deletes a task and its subtasks, with their stage history, picks, checklists, labels, references, dependencies and time.
 * XP they earned stays (the events just lose their task link). Rows are deleted explicitly: SQLite doesn't enforce cascades here.
 */
export async function deleteTask(taskId: string) {
  await requireSession();
  const subs = await db.select({ id: s.tasks.id }).from(s.tasks).where(eq(s.tasks.parentId, taskId));
  const ids = [taskId, ...subs.map((t) => t.id)];
  await db.batch([
    db.delete(s.deepTasks).where(inArray(s.deepTasks.taskId, ids)),
    db.delete(s.weeklyStars).where(inArray(s.weeklyStars.taskId, ids)),
    db.delete(s.dayPlans).where(inArray(s.dayPlans.taskId, ids)),
    db.delete(s.checklistItems).where(inArray(s.checklistItems.taskId, ids)),
    db.delete(s.taskLabels).where(inArray(s.taskLabels.taskId, ids)),
    db.delete(s.taskRefs).where(inArray(s.taskRefs.taskId, ids)),
    db.delete(s.taskDeps).where(or(inArray(s.taskDeps.taskId, ids), inArray(s.taskDeps.dependsOnId, ids))),
    db.delete(s.timeEntries).where(inArray(s.timeEntries.taskId, ids)),
    db.update(s.xpEvents).set({ taskId: null }).where(inArray(s.xpEvents.taskId, ids)),
    db.delete(s.stageEvents).where(inArray(s.stageEvents.taskId, ids)),
    db.delete(s.tasks).where(inArray(s.tasks.id, ids)),
  ]);
  refresh();
}
