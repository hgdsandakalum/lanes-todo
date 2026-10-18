import { addDays } from "@/lib/domain/dates";
import { starWeek } from "@/lib/domain/weekly";

/** How far back a streak is counted; past a year it's history, not a streak. */
const LOOKBACK_DAYS = 400;

export type StreakRule = {
  /** Days the habit was done, YYYY-MM-DD in the app timezone. */
  done: Set<string>;
  /** Whether the habit was due that day (the morning sweep is weekdays only; the deep task is every day). */
  expected: (day: string) => boolean;
  /** Missed days forgiven per week (weeks start on Sunday). */
  restPerWeek?: number;
};

export type Streak = { current: number; best: number; restUsedThisWeek: boolean };

/**
 * Consecutive due days done, counting back from today. Today not done yet doesn't break it (the day isn't over).
 * Each week forgives `restPerWeek` missed due days; a rest day keeps the streak but doesn't add to it.
 */
export function streak(today: string, rule: StreakRule): Streak {
  const rest = rule.restPerWeek ?? 1;
  const restUsed = new Map<string, number>();
  // a rest only counts once a done day is found beyond it; until then it's tentative
  let tentative: string[] = [];
  let current = 0;
  for (let i = 0; i < LOOKBACK_DAYS; i++) {
    const day = addDays(today, -i);
    if (!rule.expected(day)) continue;
    if (rule.done.has(day)) {
      current++;
      tentative = [];
      continue;
    }
    if (i === 0) continue; // today, still open
    const week = starWeek(day);
    const used = restUsed.get(week) ?? 0;
    if (used < rest) {
      restUsed.set(week, used + 1);
      tentative.push(week);
      continue;
    }
    break;
  }
  for (const week of tentative) restUsed.set(week, restUsed.get(week)! - 1);
  return { current, best: Math.max(current, bestStreak(today, rule)), restUsedThisWeek: (restUsed.get(starWeek(today)) ?? 0) > 0 };
}

/** The longest run in the lookback window, same rules, walking forward. */
export function bestStreak(today: string, rule: StreakRule): number {
  const rest = rule.restPerWeek ?? 1;
  let best = 0;
  let run = 0;
  let week = "";
  let used = 0;
  for (let i = LOOKBACK_DAYS - 1; i >= 1; i--) {
    const day = addDays(today, -i);
    if (!rule.expected(day)) continue;
    const w = starWeek(day);
    if (w !== week) {
      week = w;
      used = 0;
    }
    if (rule.done.has(day)) {
      run++;
      best = Math.max(best, run);
    } else if (run > 0 && used < rest) {
      used++;
    } else {
      run = 0;
    }
  }
  if (rule.expected(today) && rule.done.has(today)) best = Math.max(best, run + 1);
  return best;
}
