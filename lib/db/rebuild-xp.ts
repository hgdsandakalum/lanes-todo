/**
 * Recomputes every XP event from tasks, deep-task and star picks, and routine ticks, using the same
 * rules as the app (lib/game/xp.ts). Safe to re-run; achievements are left as they are.
 * Run: npm run xp:rebuild
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as s from "./schema";
import { ymd } from "../domain/dates";
import { checkAward, GENERAL_DAILY_CAP, routineAward, SMALL_DAILY_XP, taskAwards, type Award } from "../game/xp";

const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
const db = drizzle(client, { schema: s });

async function main() {
  const [tasks, deep, stars, routines, checks, items] = await Promise.all([
    db.select().from(s.tasks),
    db.select().from(s.deepTasks),
    db.select().from(s.weeklyStars),
    db.select().from(s.routines),
    db.select().from(s.routineChecks),
    db.select().from(s.checklistItems),
  ]);
  const now = new Date();
  const awards: (Award & { taskId: string | null })[] = [];

  for (const t of tasks) {
    const picks = { deep: deep.some((d) => d.taskId === t.id), star: stars.some((x) => x.taskId === t.id) };
    for (const a of taskAwards(t, picks, now)) awards.push({ ...a, taskId: t.id });
  }
  for (const i of items) {
    const a = checkAward(i.id, i.doneAt);
    if (a) awards.push({ ...a, taskId: i.taskId });
  }
  const perDay = new Map<string, number>();
  for (const c of checks) perDay.set(`${c.date}:${c.routineKey}`, (perDay.get(`${c.date}:${c.routineKey}`) ?? 0) + 1);
  for (const [k, ticked] of perDay) {
    const [day, key] = k.split(":");
    const r = routines.find((x) => x.key === key);
    const a = r && routineAward(day, key, ticked, r.items.length, new Date(`${day}T12:00:00Z`));
    if (a) awards.push({ ...a, taskId: null });
  }

  // the daily cap on plain general tasks, first finishes first
  // and on subtask and checklist XP
  const general = new Map<string, number>();
  const small = new Map<string, number>();
  const kept = awards
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .filter((a) => {
      const day = ymd(a.at);
      if (a.kind === "subtask" || a.kind === "check") {
        const n = (small.get(day) ?? 0) + a.amount;
        if (n > SMALL_DAILY_XP) return false;
        small.set(day, n);
        return true;
      }
      if (a.kind !== "general") return true;
      const n = (general.get(day) ?? 0) + 1;
      general.set(day, n);
      return n <= GENERAL_DAILY_CAP;
    });

  const rows = kept.map((a) => ({ id: `xp_${crypto.randomUUID()}`, key: a.key, day: ymd(a.at), kind: a.kind, track: a.track, amount: a.amount, taskId: a.taskId, at: a.at }));
  await db.batch([db.delete(s.xpEvents), ...(rows.length ? [db.insert(s.xpEvents).values(rows)] : [])]);
  console.log(`Rebuilt ${rows.length} XP events, ${rows.reduce((n, r) => n + r.amount, 0)} XP in total.`);
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
