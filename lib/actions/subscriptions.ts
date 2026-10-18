"use server";
import { desc, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { isYmd, ymd } from "@/lib/domain/dates";
import { safeHttpUrl } from "@/lib/domain/repo";
import { CYCLES, SUB_CATEGORIES, SUB_STATUSES, nextRenewal, parseAmount, parseCurrency, type Cycle, type SubCategory, type SubStatus } from "@/lib/domain/subscriptions";
import type { FormState } from "./tasks";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/** Creates or updates a subscription from its form. */
export async function saveSubscription(_: FormState, form: FormData): Promise<FormState> {
  await requireSession();
  const id = text(form, "id");
  const name = text(form, "name");
  const category = text(form, "category") as SubCategory;
  const amount = parseAmount(text(form, "amount"));
  const currency = parseCurrency(text(form, "currency"));
  const cycle = text(form, "cycle") as Cycle;
  const nextDue = text(form, "nextDue");
  const projectId = text(form, "projectId");
  const rawUrl = text(form, "url");
  const url = rawUrl ? safeHttpUrl(rawUrl) : null;
  const paymentMethod = text(form, "paymentMethod");
  const notes = text(form, "notes");
  if (!name || name.length > 80) return { error: "Give it a name under 80 characters." };
  if (!SUB_CATEGORIES.includes(category)) return { error: "Pick a category." };
  if (amount == null) return { error: "Enter the price, like 12.99." };
  if (!currency) return { error: "Use a three-letter currency code, like USD or LKR." };
  if (!CYCLES.includes(cycle)) return { error: "Pick how often it bills." };
  if (!isYmd(nextDue)) return { error: "Pick the next renewal date." };
  if (rawUrl && !url) return { error: "The link must start with https:// or http://." };
  if (paymentMethod.length > 80 || notes.length > 2000) return { error: "Keep the card under 80 characters and the notes under 2,000." };
  if (projectId && (await db.$count(s.projects, eq(s.projects.id, projectId))) === 0) return { error: "That project doesn't exist any more." };
  const values = {
    name,
    category,
    amount,
    currency,
    cycle,
    nextDue,
    billingDay: Number(nextDue.slice(8)),
    projectId: projectId || null,
    url,
    paymentMethod: paymentMethod || null,
    notes: notes || null,
  };
  if (id) await db.update(s.subscriptions).set(values).where(eq(s.subscriptions.id, id));
  else await db.insert(s.subscriptions).values({ id: `sub_${crypto.randomUUID()}`, ...values });
  refresh();
  return { saved: Date.now() };
}

export async function setSubscriptionStatus(id: string, status: SubStatus) {
  await requireSession();
  if (!SUB_STATUSES.includes(status)) return;
  await db.update(s.subscriptions).set({ status }).where(eq(s.subscriptions.id, id));
  refresh();
}

/** Deletes a subscription and its payment history. Cancelling keeps the history; this doesn't. */
export async function deleteSubscription(id: string) {
  await requireSession();
  await db.batch([db.delete(s.subscriptionPayments).where(eq(s.subscriptionPayments.subscriptionId, id)), db.delete(s.subscriptions).where(eq(s.subscriptions.id, id))]);
  refresh();
}

/** Records the current renewal as paid today, at the current price, and moves on to the next renewal. */
export async function markPaid(id: string): Promise<{ error?: string }> {
  await requireSession();
  const [sub] = await db.select().from(s.subscriptions).where(eq(s.subscriptions.id, id)).limit(1);
  if (!sub) return { error: "That subscription doesn't exist any more." };
  if (sub.status !== "active") return { error: "Resume it before recording a payment." };
  await db.batch([
    db.insert(s.subscriptionPayments).values({ id: `sp_${crypto.randomUUID()}`, subscriptionId: id, paidOn: ymd(), dueOn: sub.nextDue, amount: sub.amount, currency: sub.currency }),
    db
      .update(s.subscriptions)
      .set({ nextDue: nextRenewal(sub.nextDue, sub.cycle, sub.billingDay) })
      .where(eq(s.subscriptions.id, id)),
  ]);
  refresh();
  return {};
}

/** Takes back a subscription's latest payment and puts its renewal date back to the one that payment covered. */
export async function undoPayment(paymentId: string) {
  await requireSession();
  const [p] = await db.select().from(s.subscriptionPayments).where(eq(s.subscriptionPayments.id, paymentId)).limit(1);
  if (!p) return;
  const [latest] = await db
    .select({ id: s.subscriptionPayments.id })
    .from(s.subscriptionPayments)
    .where(eq(s.subscriptionPayments.subscriptionId, p.subscriptionId))
    .orderBy(desc(s.subscriptionPayments.dueOn), desc(s.subscriptionPayments.paidOn))
    .limit(1);
  if (latest?.id !== p.id) return;
  await db.batch([
    db.delete(s.subscriptionPayments).where(eq(s.subscriptionPayments.id, p.id)),
    db.update(s.subscriptions).set({ nextDue: p.dueOn }).where(eq(s.subscriptions.id, p.subscriptionId)),
  ]);
  refresh();
}
