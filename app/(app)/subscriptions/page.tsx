import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getSubscriptions } from "@/lib/data/subscriptions";
import { getQuickAddProjects } from "@/lib/data/tasks";
import { addDays, ymd } from "@/lib/domain/dates";
import { SUB_DUE_SOON_DAYS, formatMoney } from "@/lib/domain/subscriptions";
import { Subscriptions as List } from "@/components/subscriptions/subscriptions";

export const metadata: Metadata = { title: "Subscriptions" };

export default function SubscriptionsPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <header>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Subscriptions</h1>
        <p className="mt-2 max-w-prose text-muted">The services you pay for on repeat, what they add up to, and what renews next.</p>
      </header>
      <Suspense fallback={<div aria-hidden className="h-60 rounded-sm bg-sunk/60" />}>
        <Subscriptions />
      </Suspense>
    </div>
  );
}

async function Subscriptions() {
  await connection();
  const today = ymd();
  const [{ subs, totals, payments }, projects] = await Promise.all([getSubscriptions(), getQuickAddProjects()]);
  const active = subs.filter((x) => x.status === "active").length;
  return (
    <>
      {totals.length ? (
        <div className="tabular -mt-6 flex flex-wrap gap-x-10 gap-y-3">
          {totals.map((t) => (
            <p key={t.currency}>
              <span className="font-display text-3xl font-extrabold tracking-tight">{formatMoney(t.month, t.currency)}</span>
              <span className="block text-sm text-muted">
                a month · {formatMoney(t.year, t.currency)} a year
              </span>
            </p>
          ))}
          <p>
            <span className="font-display text-3xl font-extrabold tracking-tight">{active}</span>
            <span className="block text-sm text-muted">active</span>
          </p>
        </div>
      ) : null}
      <List subs={subs} payments={payments} projects={projects} today={today} until={addDays(today, SUB_DUE_SOON_DAYS)} />
    </>
  );
}
