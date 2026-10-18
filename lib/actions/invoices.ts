"use server";
import { and, eq, isNotNull } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { ymd } from "@/lib/domain/dates";
import { starWeek } from "@/lib/domain/weekly";
import { paidOnTime } from "@/lib/game/achievements";

/** Marks delivered billable work as invoiced today, or undoes it. Invoicing in the delivery week unlocks Paid on time. */
export async function setInvoiced(taskId: string, invoiced: boolean) {
  await requireSession();
  const [row] = await db
    .select({ closedAt: s.tasks.closedAt })
    .from(s.tasks)
    .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
    .where(and(eq(s.tasks.id, taskId), eq(s.projects.billable, true), isNotNull(s.tasks.closedAt)))
    .limit(1);
  if (!row) throw new Error("Only delivered work on a billable project can be invoiced.");

  const now = new Date();
  await db.update(s.tasks).set({ invoicedAt: invoiced ? now : null }).where(eq(s.tasks.id, taskId));
  if (invoiced && paidOnTime(starWeek(ymd(row.closedAt!)), starWeek(ymd(now)))) {
    await db.insert(s.achievements).values({ key: "paid_on_time" }).onConflictDoNothing();
  }
  refresh();
}
