import { parseDuration } from "./estimate";
import { DESCRIPTION_MAX, dueFrom, isLabel, LABEL_MAX, TITLE_MAX } from "./quick-add";
import { PRIORITIES, type Priority } from "./stages";

/**
 * A partial edit from the lanes endpoint: only the fields sent change, and null (or "") clears one.
 * Type, kind, stage and branches have their own commands (move, attach), since they reshape the workflow.
 */

export type TaskEdit = {
  title?: string;
  description?: string | null;
  due?: string | null;
  priority?: Priority | null;
  estimateMin?: number | null;
  blocker?: string | null;
  labels?: string[];
};

export type TaskEditResult = { ok: true; value: TaskEdit } | { ok: false; error: string };

export const EDIT_FIELDS = ["title", "description", "due", "priority", "estimate", "blocker", "labels"] as const;
export const BLOCKER_MAX = 500;
export const LABELS_MAX = 12;

const fail = (error: string): TaskEditResult => ({ ok: false, error });
const blank = (v: unknown) => v === null || (typeof v === "string" && v.trim() === "");

export function parseTaskEdit(input: unknown, today: string): TaskEditResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) return fail(`Send the changes as "set": { ... } with any of: ${EDIT_FIELDS.join(", ")}.`);
  const set = input as Record<string, unknown>;
  const unknown = Object.keys(set).filter((k) => !(EDIT_FIELDS as readonly string[]).includes(k));
  if (unknown.length) return fail(`Can't change ${unknown.join(", ")}. Fields: ${EDIT_FIELDS.join(", ")}. Use move for the stage, attach for a branch.`);
  if (Object.keys(set).length === 0) return fail(`Nothing to change. Fields: ${EDIT_FIELDS.join(", ")}.`);
  const bad = Object.entries(set).find(([k, v]) => v !== null && typeof v !== "string" && !(k === "labels" && Array.isArray(v)));
  if (bad) return fail(`${bad[0]} should be text, or null to clear it.`);
  const out: TaskEdit = {};

  if ("title" in set) {
    const title = String(set.title ?? "").trim();
    if (!title) return fail("A task needs a title, so it can't be cleared.");
    if (title.length > TITLE_MAX) return fail(`Keep the title under ${TITLE_MAX} characters.`);
    out.title = title;
  }
  if ("description" in set) {
    const description = String(set.description ?? "").trim();
    if (description.length > DESCRIPTION_MAX) return fail(`Keep the description under ${DESCRIPTION_MAX.toLocaleString("en")} characters.`);
    out.description = description || null;
  }
  if ("due" in set) {
    if (blank(set.due)) out.due = null;
    else {
      const due = dueFrom(String(set.due).trim().replace(/^!/, ""), today);
      if (!due) return fail(`"${set.due}" isn't a due date. Try today, tmr, fri or ${today}.`);
      out.due = due;
    }
  }
  if ("priority" in set) {
    if (blank(set.priority)) out.priority = null;
    else {
      const p = String(set.priority).trim().replace(/^\*/, "").toLowerCase();
      const priority = /^[1-4]$/.test(p) ? PRIORITIES[+p - 1] : PRIORITIES.find((x) => x === p);
      if (!priority) return fail(`"${set.priority}" isn't a priority. Use urgent, high, medium or low.`);
      out.priority = priority;
    }
  }
  if ("estimate" in set) {
    if (blank(set.estimate)) out.estimateMin = null;
    else {
      const min = parseDuration(String(set.estimate).trim().replace(/^~/, ""));
      if (min == null) return fail("The estimate needs to look like 30m, 2h or 1h30m.");
      out.estimateMin = min;
    }
  }
  if ("blocker" in set) {
    const blocker = String(set.blocker ?? "").trim();
    if (blocker.length > BLOCKER_MAX) return fail(`Keep the blocker under ${BLOCKER_MAX} characters.`);
    out.blocker = blocker || null;
  }
  if ("labels" in set) {
    // the whole list: ["backend", "+qa"] or "backend qa"; [] or null clears them
    const raw = Array.isArray(set.labels) ? set.labels.map(String) : String(set.labels ?? "").split(/[\s,]+/);
    const names = [...new Set(raw.map((n) => n.trim().replace(/^\+/, "").toLowerCase()).filter(Boolean))];
    const badLabel = names.find((n) => !isLabel(n));
    if (badLabel) return fail(`"${badLabel}" can't be a label. Use letters, digits, - and _ (up to ${LABEL_MAX}).`);
    if (names.length > LABELS_MAX) return fail(`Keep it to ${LABELS_MAX} labels per task.`);
    out.labels = names;
  }
  return { ok: true, value: out };
}
