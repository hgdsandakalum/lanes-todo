import { addDays, weekday } from "./dates";
import { FINISHED_FOR_ME } from "./stages";

/** The weekly review stars three tasks: one each from these workspaces (by slug). */
export const WEEKLY_THREE_SLUGS = ["softsora", "tutorkit", "freelance"] as const;

/** Weeks for the three start on Sunday, so the stars picked in the Sunday review count for the week ahead. */
export const starWeek = (day: string) => addDays(day, -weekday(day));

/** Today shows open tasks due within this many days, plus anything overdue. */
export const DUE_SOON_DAYS = 3;

/** How many of the week's stars are finished. */
export const starsDone = (slots: { star: { stage: string } | null }[]) => slots.filter((s) => s.star && FINISHED_FOR_ME.has(s.star.stage)).length;
