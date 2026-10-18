import { daysBetween } from "./dates";

export const RELEASE_NAME_MAX = 80;

/** "Prod release 16 Oct" for a YYYY-MM-DD day. */
export function defaultReleaseName(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const month = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  return `Prod release ${d} ${month}`;
}

/**
 * Checks a release date: not in the future, and not before the latest dev release among the shipped tasks
 * (code can't reach production before it was released to dev).
 */
export function checkReleaseDay(day: string, today: string, devReleasedDays: string[]): string | null {
  if (daysBetween(day, today) < 0) return "A release can't be dated in the future.";
  const latest = [...devReleasedDays].sort().at(-1);
  if (latest && day < latest) return `One of these tasks was dev released on ${latest}, so the release can't be earlier.`;
  return null;
}

/** Board columns keep closed tasks this many days, so the last column doesn't grow forever. */
export const BOARD_CLOSED_DAYS = 14;
