import "server-only";
import { and, asc, desc, eq, inArray, lte } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { addDays } from "@/lib/domain/dates";
import { SUB_DUE_SOON_DAYS, totalsByCurrency, type Cycle, type SubCategory, type SubStatus } from "@/lib/domain/subscriptions";

const fields = {
  sub: s.subscriptions,
  projectCode: s.projects.code,
  projectColor: s.projects.color,
  projectName: s.projects.name,
};

const shape = (r: { sub: typeof s.subscriptions.$inferSelect; projectCode: string | null; projectColor: string | null; projectName: string | null }) => ({
  ...r.sub,
  cycle: r.sub.cycle as Cycle,
  category: r.sub.category as SubCategory,
  status: r.sub.status as SubStatus,
  project: r.projectCode ? { code: r.projectCode, color: r.projectColor!, name: r.projectName! } : null,
});

/** Every subscription, soonest renewal first, with its project, recent payments and the per-currency totals. */
export async function getSubscriptions() {
  await requireSession();
  const rows = await db
    .select(fields)
    .from(s.subscriptions)
    .leftJoin(s.projects, eq(s.subscriptions.projectId, s.projects.id))
    .orderBy(asc(s.subscriptions.nextDue), asc(s.subscriptions.name));
  const subs = rows.map(shape);
  const payments = subs.length
    ? await db
        .select()
        .from(s.subscriptionPayments)
        .where(
          inArray(
            s.subscriptionPayments.subscriptionId,
            subs.map((x) => x.id),
          ),
        )
        .orderBy(desc(s.subscriptionPayments.paidOn), desc(s.subscriptionPayments.dueOn))
    : [];
  const names = new Map(subs.map((x) => [x.id, x.name]));
  // only a subscription's latest payment can be undone: it's the one whose renewal date nextDue moved on from
  const latest = new Map<string, (typeof payments)[number]>();
  for (const p of payments) if (!latest.has(p.subscriptionId) || p.dueOn > latest.get(p.subscriptionId)!.dueOn) latest.set(p.subscriptionId, p);
  return {
    subs,
    totals: totalsByCurrency(subs),
    payments: payments.map((p) => ({ ...p, name: names.get(p.subscriptionId) ?? "", latest: latest.get(p.subscriptionId) === p })),
  };
}

export type SubscriptionRow = Awaited<ReturnType<typeof getSubscriptions>>["subs"][number];
export type PaymentRow = Awaited<ReturnType<typeof getSubscriptions>>["payments"][number];

/** Active subscriptions that renew within the next few days, or already should have. */
export async function getRenewalsDue(day: string) {
  await requireSession();
  const until = addDays(day, SUB_DUE_SOON_DAYS);
  return db
    .select({ id: s.subscriptions.id, name: s.subscriptions.name, amount: s.subscriptions.amount, currency: s.subscriptions.currency, nextDue: s.subscriptions.nextDue })
    .from(s.subscriptions)
    .where(and(eq(s.subscriptions.status, "active"), lte(s.subscriptions.nextDue, until)))
    .orderBy(asc(s.subscriptions.nextDue));
}
