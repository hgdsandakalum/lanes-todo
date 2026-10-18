"use server";
import { and, eq, max } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { weekday, ymd } from "@/lib/domain/dates";
import { cleanRoutine, toItems, type RoutineItem } from "@/lib/domain/routines";
import { reconcileRoutine } from "@/lib/game/engine";
import type { FormState } from "./tasks";

/** Ticks or unticks one routine item for today (the app timezone's today, never the client's). Returns the XP change. */
export async function setRoutineItem(routineKey: string, itemIndex: number, checked: boolean): Promise<number> {
  await requireSession();
  const date = ymd();
  const [routine] = await db.select().from(s.routines).where(eq(s.routines.key, routineKey)).limit(1);
  const items = routine ? toItems(routine.items) : [];
  if (!routine || !Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= items.length) {
    throw new Error("That routine item doesn't exist.");
  }
  if (items[itemIndex].signal === "deep") throw new Error("That item ticks itself once today's deep task is picked.");
  if (checked) {
    await db.insert(s.routineChecks).values({ date, routineKey, itemIndex }).onConflictDoNothing();
  } else {
    await db
      .delete(s.routineChecks)
      .where(and(eq(s.routineChecks.date, date), eq(s.routineChecks.routineKey, routineKey), eq(s.routineChecks.itemIndex, itemIndex)));
  }
  const xp = await reconcileRoutine(date, routineKey);
  refresh();
  return xp;
}

/**
 * Ticks today's "deep task" routine items when a deep task is picked, and unticks them when it's cleared.
 * Called by pickDeepTask and saveRoutine. Returns the XP change.
 */
export async function syncDeepItems(date: string): Promise<number> {
  await requireSession();
  if (date !== ymd()) return 0;
  const picked = (await db.$count(s.deepTasks, eq(s.deepTasks.date, date))) > 0;
  let xp = 0;
  for (const r of await db.select().from(s.routines)) {
    if (!r.weekdays.includes(weekday(date))) continue;
    const index = toItems(r.items).findIndex((i) => i.signal === "deep");
    if (index < 0) continue;
    const where = and(eq(s.routineChecks.date, date), eq(s.routineChecks.routineKey, r.key), eq(s.routineChecks.itemIndex, index));
    if (picked) await db.insert(s.routineChecks).values({ date, routineKey: r.key, itemIndex: index }).onConflictDoNothing();
    else await db.delete(s.routineChecks).where(where);
    xp += await reconcileRoutine(date, r.key);
  }
  return xp;
}

/**
 * Saves an edited routine, or a new one when `key` is empty. Today's ticks follow their items by text, so reordering or adding items keeps them;
 * ticks on removed items go, and the day's routine XP is brought in line.
 */
export async function saveRoutine(key: string, input: { title: string; note: string; weekdays: number[]; items: RoutineItem[] }): Promise<FormState> {
  await requireSession();
  const cleaned = cleanRoutine(input);
  if (!cleaned.ok) return { error: cleaned.error };
  const date = ymd();
  const [routine] = await db.select().from(s.routines).where(eq(s.routines.key, key)).limit(1);
  const { value } = cleaned;
  if (routine) {
    const before = toItems(routine.items);
    const checks = await db.select().from(s.routineChecks).where(and(eq(s.routineChecks.date, date), eq(s.routineChecks.routineKey, key)));
    const keep = checks
      .map((c) => value.items.findIndex((i) => i.text === before[c.itemIndex]?.text))
      .filter((i, n, all) => i >= 0 && all.indexOf(i) === n && value.items[i].signal !== "deep");
    await db.batch([
      db.update(s.routines).set(value).where(eq(s.routines.key, key)),
      db.delete(s.routineChecks).where(and(eq(s.routineChecks.date, date), eq(s.routineChecks.routineKey, key))),
      ...keep.map((itemIndex) => db.insert(s.routineChecks).values({ date, routineKey: key, itemIndex })),
    ]);
  } else if (key) {
    return { error: "That routine doesn't exist any more." };
  } else {
    const [{ top }] = await db.select({ top: max(s.routines.sort) }).from(s.routines);
    key = `rt_${crypto.randomUUID().slice(0, 8)}`;
    await db.insert(s.routines).values({ key, sort: (top ?? -1) + 1, ...value });
  }
  await syncDeepItems(date);
  await reconcileRoutine(date, key);
  refresh();
  return { saved: Date.now() };
}

export async function deleteRoutine(key: string) {
  await requireSession();
  if (key === "sweep" || key === "review") return; // streaks and the Sunday review are built on these two
  await db.batch([db.delete(s.routineChecks).where(eq(s.routineChecks.routineKey, key)), db.delete(s.routines).where(eq(s.routines.key, key))]);
  refresh();
}
