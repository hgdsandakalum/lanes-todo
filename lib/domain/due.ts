import { daysBetween, formatShort, ymd } from "./dates";
import { FINISHED_FOR_ME } from "./stages";

/**
 * What a task's dates say, by whose move it is. Before dev release the due date is your deadline and goes red when
 * missed. After it, the task is with QA and the client: the due date is hidden, the wait is counted (amber past the
 * project's limit) and only a production date the client gave can go red. Design work sent for feedback is with the
 * client too.
 */

export type Tone = "danger" | "warn" | "muted" | "plain";
export type Mark = { text: string; tone: Tone };

export type DatedTask = {
  type: string;
  stage: string;
  due: string | null;
  prodDate: string | null;
  devReleasedAt: Date | null;
  closedAt: Date | null;
};

const days = (n: number) => (n === 1 ? "1 day" : `${n} days`);
const released = (w: { devDay: string; waited: number }, today: string) =>
  w.waited === 0 ? "Dev released today" : w.waited === 1 ? "Dev released yesterday" : `Dev released ${formatShort(w.devDay, today)} · ${days(w.waited)}`;

/** Design work sent for feedback: the client's move. */
export const withClient = (t: Pick<DatedTask, "type" | "stage">) => t.type === "design" && t.stage === "feedback";

/** Past its due date while it's still yours to finish. */
export function isOverdue(t: Pick<DatedTask, "stage" | "type" | "due" | "closedAt">, today: string): boolean {
  return t.closedAt == null && !FINISHED_FOR_ME.has(t.stage) && !withClient(t) && t.due != null && t.due < today;
}

/** How many days after its due date a task was dev released; null when on time or without a due date. */
export function releasedLate(t: Pick<DatedTask, "due" | "devReleasedAt">): number | null {
  if (!t.due || !t.devReleasedAt) return null;
  const late = daysBetween(t.due, ymd(t.devReleasedAt));
  return late > 0 ? late : null;
}

export type ProdWait = { devDay: string; waited: number; flag: "late" | "long" | null; flagged: boolean };

/** Code waiting for production: since when, and whether it needs a look ("late": past the client's date; "long": no date and over the limit). */
export function prodWait(t: Pick<DatedTask, "devReleasedAt" | "prodDate">, today: string, waitDays: number): ProdWait {
  const devDay = ymd(t.devReleasedAt!);
  const waited = daysBetween(devDay, today);
  const flag = t.prodDate ? (t.prodDate < today ? "late" : null) : waited > waitDays ? "long" : null;
  return { devDay, waited, flag, flagged: flag != null };
}

/** The one line for code waiting for production, as the Release lists show it. */
export function waitingMark(t: Pick<DatedTask, "devReleasedAt" | "prodDate">, today: string, waitDays: number): Mark {
  const w = prodWait(t, today, waitDays);
  if (t.prodDate)
    return w.flag === "late" ? { text: `Prod was due ${formatShort(t.prodDate, today)}`, tone: "danger" } : { text: `Prod ${formatShort(t.prodDate, today)}`, tone: "plain" };
  if (w.flag === "long") return { text: `Waiting ${days(w.waited)}, over the ${waitDays}-day limit`, tone: "warn" };
  return { text: released(w, today), tone: "muted" };
}

/** What a task card shows about its dates, in order. `since` is when design work was sent for feedback, if known. */
export function dueMarks(t: DatedTask, today: string, opts: { waitDays: number; since?: Date | null }): Mark[] {
  if (t.closedAt != null) return [];
  if (t.type === "code" && t.devReleasedAt != null && FINISHED_FOR_ME.has(t.stage)) {
    const w = prodWait(t, today, opts.waitDays);
    const late = releasedLate(t);
    const main: Mark = t.prodDate
      ? waitingMark(t, today, opts.waitDays)
      : w.flag === "long"
        ? { text: `Waiting ${days(w.waited)}`, tone: "warn" }
        : { text: released(w, today), tone: "muted" };
    return late ? [main, { text: `${days(late)} late`, tone: "muted" }] : [main];
  }
  if (withClient(t)) {
    const n = opts.since ? daysBetween(ymd(opts.since), today) : null;
    return [{ text: n ? `With client ${days(n)}` : "With client", tone: "muted" }];
  }
  if (t.due == null || FINISHED_FOR_ME.has(t.stage)) return [];
  return [t.due < today ? { text: `Was due ${formatShort(t.due, today)}`, tone: "danger" } : { text: `Due ${formatShort(t.due, today)}`, tone: "plain" }];
}

/** Of the dev released tasks given, how many had a due date and how many met it. */
export function onTime(tasks: Pick<DatedTask, "due" | "devReleasedAt">[]): { dated: number; met: number } {
  const dated = tasks.filter((t) => t.due && t.devReleasedAt);
  return { dated: dated.length, met: dated.filter((t) => releasedLate(t) == null).length };
}
