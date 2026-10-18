const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD in the given IANA timezone (defaults to the app timezone). */
export function ymd(d: Date = new Date(), timeZone = process.env.APP_TIMEZONE || "Asia/Colombo"): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Day of week (0 = Sunday) for a YYYY-MM-DD string. */
export function weekday(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function formatLong(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return {
    weekday: date.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" }),
    rest: `${d} ${date.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" })} ${y}`,
  };
}

/** Shifts a YYYY-MM-DD string by whole days. */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export { pad };

/** "Today", "Tomorrow", "Yesterday", or a short date like "Fri 17 Oct" relative to `today`. */
export function formatShort(day: string, today: string): string {
  if (day === today) return "Today";
  if (day === addDays(today, 1)) return "Tomorrow";
  if (day === addDays(today, -1)) return "Yesterday";
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const wd = date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  const mon = date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  return `${wd} ${d} ${mon}${y === Number(today.slice(0, 4)) ? "" : ` ${y}`}`;
}

/** True for a real calendar day written as YYYY-MM-DD. */
export function isYmd(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s;
}

/** Whole calendar days from `a` to `b` (both YYYY-MM-DD); negative when `b` is earlier. */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);
}

/** The instant a wall-clock time ("2026-10-16", "09:30") happens in a timezone. */
export function zonedTime(day: string, time: string, timeZone = process.env.APP_TIMEZONE || "Asia/Colombo"): Date | null {
  if (!isYmd(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const guess = Date.parse(`${day}T${time}:00Z`);
  // the zone's offset at that moment: format the UTC guess in the zone and see how far off it reads
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(guess);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const shown = Date.parse(`${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:00Z`);
  return new Date(guess - (shown - guess));
}

/** "2026-10-16T09:30" for a datetime-local input, in the timezone. */
export function localInput(d: Date, timeZone = process.env.APP_TIMEZONE || "Asia/Colombo"): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
