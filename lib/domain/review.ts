import type { TaskType } from "./stages";

/** The stage where a task waits on someone else's review. */
export const REVIEW_STAGE: Partial<Record<TaskType, string>> = { code: "in_review", design: "feedback" };

/** A task waiting on review this many days or more counts as stuck. */
export const STUCK_DAYS = 3;

/**
 * The week's one number, out of 100: 60 for the weekly three (20 per finished star) and 40 for
 * balance (the share of workspaces with at least one stage move this week).
 */
export function weeklyScore(starsDone: number, starsTotal: number, workspacesMoved: number, workspacesTotal: number) {
  const stars = starsTotal ? Math.round((60 * Math.min(starsDone, starsTotal)) / starsTotal) : 0;
  const balance = workspacesTotal ? Math.round((40 * Math.min(workspacesMoved, workspacesTotal)) / workspacesTotal) : 0;
  return { score: stars + balance, stars, balance };
}
