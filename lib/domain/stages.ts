export type TaskType = "code" | "design" | "general";

/** Code tasks come in kinds, each with its own stages and fields. Null in the database means feature. */
export type CodeKind = "feature" | "bug" | "refactor" | "review" | "ship" | "research";

export type Stage = { key: string; label: string };

const st = (key: string, label: string): Stage => ({ key, label });
const TODO = st("todo", "To do");
const RELEASE = [st("in_review", "In review"), st("dev_released", "Dev released"), st("staging", "Staging"), st("prod_released", "Prod released")];

/**
 * Feature-like code work finishes for you at "dev_released" but only closes at "prod_released".
 * "staging" is used only for projects with hasStaging = true.
 */
export const STAGES: Record<TaskType, Stage[]> = {
  code: [TODO, st("in_progress", "In progress"), ...RELEASE],
  design: [TODO, st("drafting", "Drafting"), st("feedback", "Sent for feedback"), st("revisions", "Revisions"), st("approved", "Approved")],
  general: [TODO, st("done", "Done")],
};

/** Each code kind's workflow. Kinds that don't ship through a release close at their last stage. */
export const KIND_STAGES: Record<CodeKind, Stage[]> = {
  feature: STAGES.code,
  refactor: STAGES.code,
  bug: [TODO, st("reproduced", "Reproduced"), st("in_progress", "Fixing"), ...RELEASE],
  review: [TODO, st("reviewing", "Reviewing"), st("changes_requested", "Changes requested"), st("reviewed", "Reviewed")],
  ship: [TODO, st("testing", "Testing"), st("deploying", "Deploying"), st("deployed", "Deployed")],
  research: [TODO, st("investigating", "Investigating"), st("written_up", "Written up")],
};

export const CODE_KINDS = Object.keys(KIND_STAGES) as CodeKind[];

export const KIND_LABEL: Record<CodeKind, string> = {
  feature: "Feature",
  bug: "Bug fix",
  refactor: "Refactor",
  review: "Code review",
  ship: "Test & deploy",
  research: "Research / tech debt",
};

/** The technical fields each kind shows in the editor, besides the description, refs and checklist every task has. */
export type ContextField = "acceptance" | "repro" | "expected" | "actual";
export const KIND_FIELDS: Record<CodeKind, ContextField[]> = {
  feature: ["acceptance"],
  bug: ["repro", "expected", "actual", "acceptance"],
  refactor: ["acceptance"],
  review: [],
  ship: ["acceptance"],
  research: [],
};
export const FIELD_LABEL: Record<ContextField, string> = {
  acceptance: "Acceptance criteria",
  repro: "Steps to reproduce",
  expected: "Expected behaviour",
  actual: "Actual behaviour",
};

/** A stored kind, read safely: anything unknown (or a non-code task) is null. */
export function codeKind(type: string, kind: string | null | undefined): CodeKind | null {
  if (type !== "code") return null;
  return kind && kind in KIND_STAGES ? (kind as CodeKind) : "feature";
}

/** The stages a task moves through, in order, including Staging (whether or not its project uses it). */
export function workflow(type: TaskType, kind?: string | null): Stage[] {
  const k = codeKind(type, kind);
  return k ? KIND_STAGES[k] : STAGES[type];
}

/** The stage at which the task closes for good. */
export const closingStage = (type: TaskType, kind?: string | null) => workflow(type, kind).at(-1)!.key;

/** Stages that count as "your part is finished" (streaks, deep task, Today). */
export const FINISHED_FOR_ME = new Set(["dev_released", "staging", "prod_released", "approved", "done", "reviewed", "deployed", "written_up"]);

export function stagesFor(type: TaskType, hasStaging: boolean, kind?: string | null): Stage[] {
  return workflow(type, kind).filter((s) => s.key !== "staging" || hasStaging);
}

export const TASK_TYPES: TaskType[] = ["code", "design", "general"];

/**
 * The finish timestamps a task should carry at `stage`. Existing timestamps are kept, so moving
 * within the finished stages doesn't restamp; moving back before them clears them.
 */
export function stageDates(
  type: TaskType,
  stage: string,
  current: { devReleasedAt: Date | null; closedAt: Date | null },
  now: Date,
  kind?: string | null,
): { devReleasedAt: Date | null; closedAt: Date | null } {
  return {
    devReleasedAt: type === "code" && FINISHED_FOR_ME.has(stage) ? (current.devReleasedAt ?? now) : null,
    closedAt: stage === closingStage(type, kind) ? (current.closedAt ?? now) : null,
  };
}

const LABELS = new Map<string, string>();
for (const s of [...Object.values(STAGES), ...Object.values(KIND_STAGES)].flat()) if (!LABELS.has(s.key)) LABELS.set(s.key, s.label);

/** A stage's name. Kind-specific names (a bug's "Fixing") need the kind. */
export function stageLabel(type: TaskType, key: string, kind?: string | null): string {
  return workflow(type, kind).find((s) => s.key === key)?.label ?? LABELS.get(key) ?? key;
}

export const TYPE_LABEL: Record<TaskType, string> = { code: "Code", design: "Design", general: "General" };

/** "Bug fix" for a bug, "Design" for design work: the name a task's row shows. */
export const taskKindLabel = (type: TaskType, kind?: string | null) => {
  const k = codeKind(type, kind);
  return k ? KIND_LABEL[k] : TYPE_LABEL[type];
};

export type Priority = "urgent" | "high" | "medium" | "low";
export const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];
export const PRIORITY_LABEL: Record<Priority, string> = { urgent: "Urgent", high: "High", medium: "Medium", low: "Low" };
/** Sort key: urgent first, no priority last. */
export const priorityRank = (p: string | null | undefined) => (p && PRIORITIES.includes(p as Priority) ? PRIORITIES.indexOf(p as Priority) : PRIORITIES.length);
