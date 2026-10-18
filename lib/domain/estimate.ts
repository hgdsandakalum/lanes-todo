/** Time estimates and tracked time, in whole minutes. */

export const ESTIMATE_MAX = 60 * 40; // a working week

/** "30m", "2h", "1h30m", "1.5h", "90" (minutes) → minutes, or null. */
export function parseDuration(input: string): number | null {
  const w = input.trim().toLowerCase().replace(/\s+/g, "");
  if (!w) return null;
  let m: RegExpMatchArray | null;
  if ((m = w.match(/^(\d+)$/))) return clamp(+m[1]);
  if ((m = w.match(/^(\d+(?:\.\d+)?)h$/))) return clamp(Math.round(+m[1] * 60));
  if ((m = w.match(/^(\d+)m(?:in)?$/))) return clamp(+m[1]);
  if ((m = w.match(/^(\d+)h(\d+)m?$/))) return clamp(+m[1] * 60 + +m[2]);
  return null;
}

const clamp = (n: number) => (n > 0 && n <= ESTIMATE_MAX ? n : null);

/** 90 → "1h 30m", 45 → "45m", 120 → "2h". */
export function formatMinutes(min: number): string {
  const m = Math.round(min);
  if (m < 60) return `${m}m`;
  return m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`;
}

/** Minutes tracked by time entries; a running one counts up to `now`. */
export const trackedMinutes = (entries: { startedAt: Date; endedAt: Date | null }[], now: Date) =>
  entries.reduce((n, e) => n + Math.max(0, ((e.endedAt ?? now).getTime() - e.startedAt.getTime()) / 6e4), 0);
