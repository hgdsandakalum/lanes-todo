import { addDays, isYmd, weekday } from "./dates";
import { CODE_KINDS, PRIORITIES, TASK_TYPES, type CodeKind, type Priority, type TaskType } from "./stages";
import { isValidBranch, MAX_BRANCHES } from "./repo";
import { parseDuration } from "./estimate";

/**
 * Quick add: one line of text with shortcuts mixed in anywhere.
 *   #gk          project by code
 *   @code        type (@code, @design, @general), or a code kind: @feature @bug @refactor @review @ship @research
 *   !fri !tmr    due date (!today, !tmr, a weekday, or !2026-10-20)
 *   ^feat/login  git branch (code tasks); repeat for more than one
 *   *high        priority (*urgent *high *medium *low, or *1 to *4)
 *   +backend     label; repeat for more than one
 *   ~2h ~30m     estimate
 * Everything else is the title.
 */
export type QuickAdd = {
  title: string;
  project?: string;
  type?: TaskType;
  kind?: CodeKind;
  due?: string;
  branches?: string[];
  priority?: Priority;
  labels?: string[];
  estimate?: number;
};
export type QuickAddResult = { ok: true; value: QuickAdd } | { ok: false; error: string };

export const TITLE_MAX = 200;
export const LABEL_MAX = 30;

/** Kind words quick add takes after @, with a couple of everyday spellings. */
const KIND_WORDS: Record<string, CodeKind> = { ...Object.fromEntries(CODE_KINDS.map((k) => [k, k])), fix: "bug", bugfix: "bug", deploy: "ship", test: "ship", debt: "research", spike: "research" };

/** A label as stored: lower case letters, digits, - and _. */
export const isLabel = (s: string) => s.length > 0 && s.length <= LABEL_MAX && /^[a-z0-9][a-z0-9_-]*$/.test(s);
/** Task descriptions are Markdown; long enough for a spec, short enough to stay a note. */
export const DESCRIPTION_MAX = 20_000;

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const FULL_DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** A due-date word to YYYY-MM-DD. A weekday means the next one, today included. */
export function dueFrom(word: string, today: string): string | null {
  const w = word.toLowerCase();
  if (w === "today" || w === "tod") return today;
  if (w === "tmr" || w === "tomorrow") return addDays(today, 1);
  const day = DAYS.indexOf(w) >= 0 ? DAYS.indexOf(w) : FULL_DAYS.indexOf(w);
  if (day >= 0) return addDays(today, (day - weekday(today) + 7) % 7);
  return isYmd(w) ? w : null;
}

const fail = (error: string): QuickAddResult => ({ ok: false, error });

export function parseQuickAdd(input: string, today: string): QuickAddResult {
  const out: Omit<QuickAdd, "title"> = {};
  const title: string[] = [];
  for (const word of input.trim().split(/\s+/).filter(Boolean)) {
    const sigil = word[0];
    const rest = word.slice(1);
    if (sigil === "#" && /^[a-z][a-z0-9]*$/i.test(rest)) {
      if (out.project) return fail("Use one #project per task.");
      out.project = rest.toUpperCase();
    } else if (sigil === "@" && (TASK_TYPES as string[]).includes(rest.toLowerCase())) {
      if (out.type || out.kind) return fail("Use one @type per task.");
      out.type = rest.toLowerCase() as TaskType;
    } else if (sigil === "@" && KIND_WORDS[rest.toLowerCase()]) {
      if (out.kind || out.type) return fail("Use one @type per task.");
      out.kind = KIND_WORDS[rest.toLowerCase()];
    } else if (sigil === "*" && rest) {
      const p = /^[1-4]$/.test(rest) ? PRIORITIES[+rest - 1] : PRIORITIES.find((x) => x === rest.toLowerCase());
      if (!p) return fail(`"${word}" isn't a priority. Use *urgent, *high, *medium or *low.`);
      out.priority = p;
    } else if (sigil === "+" && isLabel(rest.toLowerCase())) {
      out.labels = [...new Set([...(out.labels ?? []), rest.toLowerCase()])];
    } else if (sigil === "~" && rest) {
      const min = parseDuration(rest);
      if (min == null) return fail(`"${word}" isn't an estimate. Try ~30m, ~2h or ~1h30m.`);
      out.estimate = min;
    } else if (sigil === "!" && rest) {
      const due = dueFrom(rest, today);
      if (!due) return fail(`"${word}" isn't a due date. Try !today, !tmr, !fri or !${addDays(today, 7)}.`);
      out.due = due;
    } else if (sigil === "^" && rest) {
      if (!isValidBranch(rest)) return fail(`"${rest}" isn't a valid branch name.`);
      out.branches = [...new Set([...(out.branches ?? []), rest])];
      if (out.branches.length > MAX_BRANCHES) return fail(`Keep it to ${MAX_BRANCHES} branches per task.`);
    } else {
      title.push(word);
    }
  }
  if (out.kind) out.type = "code";
  if (out.branches) {
    if (out.type && out.type !== "code") return fail("Branches are for code tasks. Drop the ^branch or use @code.");
    out.type = "code";
  }
  const text = title.join(" ");
  if (!text) return fail("Add a title as well as the shortcuts.");
  if (text.length > TITLE_MAX) return fail(`Keep the title under ${TITLE_MAX} characters.`);
  return { ok: true, value: { title: text, ...out } };
}
