import "server-only";
import { eq, gte, like } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { addDays, weekday, ymd } from "@/lib/domain/dates";
import { ACHIEVEMENTS } from "@/lib/game/achievements";
import { streak } from "@/lib/game/streaks";
import { finishedAt } from "@/lib/game/xp";

/**
 * Streaks and achievements for the dashboard.
 * Deep task: a day counts when that day's pick was finished for you on that day.
 * Morning sweep: a day counts when every item was ticked (the routine's award exists), on its scheduled weekdays only.
 */
export async function getGameSummary(today: string) {
  await requireSession();
  const since = addDays(today, -400);
  const [deepRows, sweepRows, sweep, unlocked] = await Promise.all([
    db
      .select({ date: s.deepTasks.date, task: s.tasks })
      .from(s.deepTasks)
      .innerJoin(s.tasks, eq(s.deepTasks.taskId, s.tasks.id))
      .where(gte(s.deepTasks.date, since)),
    db.select({ key: s.xpEvents.key }).from(s.xpEvents).where(like(s.xpEvents.key, "r:%:sweep")),
    db.select().from(s.routines).where(eq(s.routines.key, "sweep")).limit(1),
    db.select().from(s.achievements),
  ]);

  const deepDone = new Set(
    deepRows.filter((r) => {
      const at = finishedAt(r.task);
      return at != null && ymd(at) === r.date;
    }).map((r) => r.date),
  );
  const sweepDays = new Set(sweep[0]?.weekdays ?? [1, 2, 3, 4, 5]);

  return {
    deep: streak(today, { done: deepDone, expected: () => true }),
    sweep: streak(today, { done: new Set(sweepRows.map((r) => r.key.split(":")[1])), expected: (d) => sweepDays.has(weekday(d)) }),
    achievements: ACHIEVEMENTS.map((a) => ({ ...a, unlockedAt: unlocked.find((u) => u.key === a.key)?.unlockedAt ?? null })),
  };
}
