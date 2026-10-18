import { FINISHED_FOR_ME, workflow, type TaskType } from "@/lib/domain/stages";

/** XP per event, from the plan. */
export const XP = {
  review: 5, // code task reaches In review
  dev: 30, // code task dev released
  prod: 15, // code task prod released (bonus on top of dev)
  feedback: 5, // design task sent for feedback
  approved: 30, // design task approved or delivered
  deep: 50, // finishing a deep task
  star: 40, // finishing a starred weekly task
  general: 10, // any other general task
  routine: 20, // completing a day's routine
  review_routine: 60, // completing the Sunday review
  subtask: 3, // finishing a subtask
  check: 1, // ticking a checklist item
} as const;

/** Plain general tasks earn XP for at most this many finishes a day. */
export const GENERAL_DAILY_CAP = 10;

/** Subtasks and checklist items together earn at most this much XP a day, so splitting work can't farm XP. */
export const SMALL_DAILY_XP = 30;

export type Track = TaskType;
export type Award = { key: string; kind: keyof typeof XP; track: Track; amount: number; at: Date };

type TaskState = { id: string; type: string; kind?: string | null; parentId?: string | null; stage: string; devReleasedAt: Date | null; closedAt: Date | null };

/** Whether `stage` is at or past `target` in the task's workflow; false when the workflow has no `target`. */
const reached = (t: TaskState, target: string) => {
  const order = workflow(t.type as TaskType, t.kind).map((s) => s.key);
  return order.includes(target) && order.indexOf(t.stage) >= order.indexOf(target);
};

/** When a task was finished for you: dev release for code, close for the rest. */
export function finishedAt(t: TaskState): Date | null {
  if (!FINISHED_FOR_ME.has(t.stage)) return null;
  return (t.type === "code" ? t.devReleasedAt : t.closedAt) ?? t.closedAt ?? t.devReleasedAt;
}

/**
 * Every award a task should hold in its current state. The engine diffs this against what is stored:
 * new keys are added, keys no longer earned (a task moved back) are removed. `now` dates awards with no stage timestamp.
 */
export function taskAwards(t: TaskState, picks: { deep: boolean; star: boolean }, now: Date): Award[] {
  const type = t.type as TaskType;
  const out: Award[] = [];
  const add = (kind: Award["kind"], at: Date | null, track: Track = type) => {
    if (at) out.push({ key: `t:${t.id}:${kind}`, kind, track, amount: XP[kind], at });
  };
  if (!workflow(type, t.kind).some((s) => s.key === t.stage)) return out;

  const done = finishedAt(t);
  // a subtask earns a little when done, never the stage XP: the parent task carries that
  if (t.parentId && !picks.deep && !picks.star) {
    add("subtask", done);
    return out;
  }

  if (type === "code") {
    if (reached(t, "in_review")) add("review", t.devReleasedAt ?? now);
    if (t.devReleasedAt && FINISHED_FOR_ME.has(t.stage)) add("dev", t.devReleasedAt);
    if (t.stage === "prod_released") add("prod", t.closedAt);
  } else if (type === "design") {
    if (reached(t, "feedback")) add("feedback", t.closedAt ?? now);
    if (t.stage === "approved") add("approved", t.closedAt);
  }

  if (picks.deep) add("deep", done);
  if (picks.star) add("star", done);
  if (type === "general" && !picks.deep && !picks.star) add("general", done);
  return out;
}

/** A ticked checklist item. */
export const checkAward = (itemId: string, doneAt: Date | null): Award | null =>
  doneAt ? { key: `c:${itemId}`, kind: "check", track: "general", amount: XP.check, at: doneAt } : null;

/** Small awards (subtasks, checklist items) trimmed to what still fits under the day's SMALL_DAILY_XP. */
export function fitSmall(awards: Award[], earnedToday: number): Award[] {
  let left = SMALL_DAILY_XP - earnedToday;
  return awards.filter((a) => {
    if (a.kind !== "subtask" && a.kind !== "check") return true;
    if (a.amount > left) return false;
    left -= a.amount;
    return true;
  });
}

/** A routine fully ticked on a day earns its award; the Sunday review earns more. */
export function routineAward(day: string, routineKey: string, ticked: number, items: number, at: Date): Award | null {
  if (items === 0 || ticked < items) return null;
  const kind = routineKey === "review" ? "review_routine" : "routine";
  return { key: `r:${day}:${routineKey}`, kind, track: "general", amount: XP[kind], at };
}
