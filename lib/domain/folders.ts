/** Project folders on your computer and the lanes command's lookups. Plain functions, no React or database code. */
import { FINISHED_FOR_ME, stagesFor, type TaskType } from "./stages";

export const FOLDER_MAX = 500;

/** An absolute folder path without a trailing slash, or null if it isn't one. "~" can't be used: the server can't know your home folder. */
export function normalizeFolder(input: string): string | null {
  const path = input.trim().replace(/\/+$/, "");
  if (!path.startsWith("/") || path.length > FOLDER_MAX) return null;
  if (/[\u0000-\u001f]/.test(path) || path.split("/").includes("..")) return null;
  return path;
}

/** The project whose folder holds `cwd`; the deepest folder wins, so a project in a subfolder of another's repo is found. */
export function projectForFolder<P extends { localPath: string | null }>(projects: P[], cwd: string): P | null {
  let best: P | null = null;
  for (const p of projects) {
    const dir = p.localPath;
    if (!dir || (cwd !== dir && !cwd.startsWith(`${dir}/`))) continue;
    if (!best || dir.length > best.localPath!.length) best = p;
  }
  return best;
}

/** "Open in Cursor": Cursor answers the same file URL scheme as VS Code, and opens a folder in its own window. */
export const editorUrl = (folder: string) => `cursor://file${folder.split("/").map(encodeURIComponent).join("/")}`;

/** Branches a task is never "on": work happens off them, so the lanes command doesn't attach them to new tasks. */
const SHARED_BRANCHES = new Set(["main", "master", "develop", "dev", "development", "staging", "production", "prod", "release"]);
export const isSharedBranch = (branch: string) => SHARED_BRANCHES.has(branch.toLowerCase());

/** "a1b2c3" for task t_a1b2c3d4-…: short enough to type, and looked up as a prefix. */
export const shortId = (taskId: string) => taskId.replace(/^t_/, "").slice(0, 6);

/** Words the lanes command takes for a stage, besides the stage keys and labels themselves. Each picks a stage from the task's own workflow. */
const ALIASES: Record<string, (keys: string[]) => string | undefined> = {
  start: (keys) => keys[1], // the first stage after To do: In progress, Reproduced, Reviewing, Testing…
  review: (keys) => (keys.includes("in_review") ? "in_review" : undefined),
  released: (keys) => (keys.includes("dev_released") ? "dev_released" : undefined),
  dev: (keys) => (keys.includes("dev_released") ? "dev_released" : undefined),
  prod: (keys) => (keys.includes("prod_released") ? "prod_released" : undefined),
  feedback: (keys) => (keys.includes("feedback") ? "feedback" : undefined),
  // "done" means your part is finished: dev released for features, Reviewed for a code review, Done for general work
  done: (keys) => keys.find((k) => FINISHED_FOR_ME.has(k)),
};

/** The stage key a typed word names for this task, or null. Accepts keys (in_review), labels (in review) and the aliases above. */
export function resolveStage(type: TaskType, hasStaging: boolean, word: string, kind?: string | null): string | null {
  const w = word.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const stages = stagesFor(type, hasStaging, kind);
  const direct = stages.find((s) => s.key === w || s.label.toLowerCase().replace(/\s+/g, "_") === w);
  if (direct) return direct.key;
  return ALIASES[w]?.(stages.map((s) => s.key)) ?? null;
}

/** Every word resolveStage accepts for a task, for the error message. */
export const stageWords = (type: TaskType, hasStaging: boolean, kind?: string | null) => [
  ...stagesFor(type, hasStaging, kind).map((s) => s.key),
  ...Object.keys(ALIASES).filter((a) => resolveStage(type, hasStaging, a, kind) != null),
];
