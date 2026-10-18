/** Recurring tasks. A rule is stored as text; when a recurring task closes, the next one is created due on the next date. */
import { addDays, isYmd, weekday } from "./dates";

export type Recur = { every: "day" } | { every: "weekday" } | { every: "week"; days: number[] } | { every: "month"; day: number };

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** Reads a stored rule: daily, weekdays, weekly:1,3 (0 = Sunday), monthly:15. Null for anything else. */
export function parseRecur(rule: string | null | undefined): Recur | null {
  if (!rule) return null;
  if (rule === "daily") return { every: "day" };
  if (rule === "weekdays") return { every: "weekday" };
  const weekly = rule.match(/^weekly:([0-6](?:,[0-6])*)$/);
  if (weekly) return { every: "week", days: [...new Set(weekly[1].split(",").map(Number))].sort() };
  const monthly = rule.match(/^monthly:(\d{1,2})$/);
  if (monthly && +monthly[1] >= 1 && +monthly[1] <= 31) return { every: "month", day: +monthly[1] };
  return null;
}

/** Turns what people type ("every fri", "mon,wed", "monthly 15", "weekdays") into a stored rule, or null. */
export function ruleFrom(input: string): string | null {
  const w = input.trim().toLowerCase().replace(/^every\s+/, "");
  if (!w) return null;
  if (["daily", "day", "every day"].includes(w)) return "daily";
  if (["weekdays", "weekday", "workdays"].includes(w)) return "weekdays";
  if (w === "weekly" || w === "week") return null; // which day? the caller supplies one
  const monthly = w.match(/^(?:monthly|month)(?:\s+on)?\s*(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?$/);
  if (monthly) return parseRecur(`monthly:${+monthly[1]}`) ? `monthly:${+monthly[1]}` : null;
  const days = w.replace(/^weekly\s+(?:on\s+)?/, "").split(/[\s,]+/).filter(Boolean);
  const idx = days.map((d) => DAY_NAMES.findIndex((n) => d.startsWith(n) && n.startsWith(d.slice(0, 3))));
  if (idx.length && idx.every((i) => i >= 0)) return `weekly:${[...new Set(idx)].sort().join(",")}`;
  return null;
}

/** The first date strictly after `from` that the rule lands on. */
export function nextDate(rule: Recur, from: string): string {
  if (rule.every === "day") return addDays(from, 1);
  if (rule.every === "weekday") {
    let d = addDays(from, 1);
    while (weekday(d) === 0 || weekday(d) === 6) d = addDays(d, 1);
    return d;
  }
  if (rule.every === "week") {
    for (let i = 1; i <= 7; i++) if (rule.days.includes(weekday(addDays(from, i)))) return addDays(from, i);
    return addDays(from, 7);
  }
  // monthly: the day, or the month's last day when it's shorter (31 → 30 Apr, 28/29 Feb)
  const [y, m] = from.split("-").map(Number);
  for (let step = 0; step < 3; step++) {
    const ym = new Date(Date.UTC(y, m - 1 + step, 1));
    const last = new Date(Date.UTC(ym.getUTCFullYear(), ym.getUTCMonth() + 1, 0)).getUTCDate();
    const d = `${ym.getUTCFullYear()}-${String(ym.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(rule.day, last)).padStart(2, "0")}`;
    if (isYmd(d) && d > from) return d;
  }
  return addDays(from, 28);
}

/** "Every weekday", "Every Mon, Thu", "Monthly on the 15th". */
export function describeRecur(rule: string | null | undefined): string | null {
  const r = parseRecur(rule);
  if (!r) return null;
  if (r.every === "day") return "Every day";
  if (r.every === "weekday") return "Every weekday";
  if (r.every === "week") return `Every ${r.days.map((d) => DAY_NAMES[d][0].toUpperCase() + DAY_NAMES[d].slice(1)).join(", ")}`;
  const n = r.day;
  const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `Monthly on the ${n}${suffix}`;
}
