/** Level titles in order. Past the last one, the title stays and the number keeps climbing. */
export const TITLES = ["Intern", "Junior", "Developer", "Senior", "Lead", "Staff", "Principal", "Architect"];

/** XP needed to go from level n to n+1: 100, 150, 225 … (×1.5, rounded to 5). */
export function xpForLevel(level: number): number {
  return Math.round((100 * Math.pow(1.5, level - 1)) / 5) * 5;
}

export type LevelInfo = { level: number; title: string; intoLevel: number; needed: number; progress: number };

export function levelFromXp(totalXp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  const needed = xpForLevel(level);
  return {
    level,
    title: TITLES[Math.min(level, TITLES.length) - 1],
    intoLevel: remaining,
    needed,
    progress: remaining / needed,
  };
}
