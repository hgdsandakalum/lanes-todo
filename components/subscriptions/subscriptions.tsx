"use client";
import { useActionState, useState, useTransition } from "react";
import { keepValues } from "@/components/projects/keep-values";
import { Field, inputCls, primaryBtn, quietBtn } from "@/components/projects/fields";
import { ProjectTag } from "@/components/tasks/project-tag";
import { deleteSubscription, markPaid, saveSubscription, setSubscriptionStatus, undoPayment } from "@/lib/actions/subscriptions";
import type { FormState } from "@/lib/actions/tasks";
import type { PaymentRow, SubscriptionRow } from "@/lib/data/subscriptions";
import { formatShort } from "@/lib/domain/dates";
import { CURRENCIES, CYCLE_LABEL, CYCLES, SUB_CATEGORIES, SUB_CATEGORY_LABEL, formatMoney } from "@/lib/domain/subscriptions";

type ProjectOption = { id: string; code: string; name: string };

const PER = { weekly: "a week", monthly: "a month", quarterly: "every 3 months", yearly: "a year" } as const;
const summaryCls = "cursor-pointer text-sm text-muted hover:text-ink";

/**
 * The page body: one list, soonest renewal first. Renewals due within the week carry a "Paid" button;
 * paused and cancelled ones and the payment history fold away underneath.
 */
export function Subscriptions({ subs, payments, projects, today, until }: { subs: SubscriptionRow[]; payments: PaymentRow[]; projects: ProjectOption[]; today: string; until: string }) {
  const [adding, setAdding] = useState(false);
  const active = subs.filter((x) => x.status === "active");
  const inactive = subs.filter((x) => x.status !== "active");
  return (
    <div className="flex flex-col gap-8">
      <div>
        {adding ? (
          <div className="rounded-sm border border-line bg-surface p-4" role="group" aria-label="New subscription">
            <SubscriptionForm projects={projects} today={today} onDone={() => setAdding(false)} />
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className={primaryBtn}>
            Add a subscription
          </button>
        )}
      </div>

      {active.length ? (
        <ul className="divide-y divide-line/70 border-y border-line/70" aria-label="Active subscriptions">
          {active.map((x) => (
            <Row key={x.id} sub={x} projects={projects} today={today} due={x.nextDue <= until} />
          ))}
        </ul>
      ) : subs.length === 0 ? (
        <p className="max-w-prose text-muted">Add the services you pay for: hosting, domains, AI tools, apps. Lanes adds up what they cost and shows each renewal before it lands.</p>
      ) : null}

      {inactive.length ? (
        <details>
          <summary className={summaryCls}>Paused and cancelled ({inactive.length})</summary>
          <ul className="mt-2 divide-y divide-line/70">
            {inactive.map((x) => (
              <Row key={x.id} sub={x} projects={projects} today={today} due={false} />
            ))}
          </ul>
        </details>
      ) : null}

      {payments.length ? <PaymentHistory payments={payments} today={today} /> : null}
    </div>
  );
}

function Row({ sub: x, projects, today, due }: { sub: SubscriptionRow; projects: ProjectOption[]; today: string; due: boolean }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inactive = x.status !== "active";
  const overdue = !inactive && x.nextDue < today;
  const when = inactive ? (x.status === "paused" ? "Paused" : "Cancelled") : overdue ? `Was due ${formatShort(x.nextDue, today)}` : `Renews ${formatShort(x.nextDue, today)}`;
  return (
    <li className="py-3">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => setEditing((v) => !v)} aria-expanded={editing} className="group min-w-0 flex-1 text-left">
          <span className={`flex items-center gap-2 font-medium group-hover:underline group-hover:underline-offset-4 ${inactive ? "text-muted" : ""}`}>
            <span className="truncate">{x.name}</span>
            {x.project ? <ProjectTag code={x.project.code} color={x.project.color} title={`Paid for ${x.project.name}`} /> : null}
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted">
            <span className={overdue ? "font-semibold text-danger" : due ? "text-ink" : ""}>{when}</span> · {SUB_CATEGORY_LABEL[x.category]}
          </span>
        </button>
        <span className="tabular shrink-0 text-right">
          <span className={`block font-medium ${inactive ? "text-muted" : ""}`}>{formatMoney(x.amount, x.currency)}</span>
          <span className="block text-sm text-muted">{PER[x.cycle]}</span>
        </span>
        {due ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setError((await markPaid(x.id)).error ?? null);
              })
            }
            aria-label={`Mark ${x.name} paid`}
            className="shrink-0 rounded-sm border border-line px-3 py-1.5 text-sm font-semibold hover:border-ink disabled:opacity-60"
          >
            Paid
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {editing ? (
        <div className="mt-3 rounded-sm border border-line bg-surface p-4">
          <SubscriptionForm sub={x} projects={projects} today={today} onDone={() => setEditing(false)} />
          <div className="mt-4 flex flex-wrap gap-1 border-t border-line pt-3">
            {x.url ? (
              <a href={x.url} target="_blank" rel="noreferrer noopener" className={quietBtn}>
                Open billing page
              </a>
            ) : null}
            {inactive ? (
              <button type="button" disabled={pending} onClick={() => start(() => setSubscriptionStatus(x.id, "active"))} className={quietBtn}>
                Resume
              </button>
            ) : (
              <>
                <button type="button" disabled={pending} onClick={() => start(() => setSubscriptionStatus(x.id, "paused"))} className={quietBtn}>
                  Pause
                </button>
                <button type="button" disabled={pending} onClick={() => start(() => setSubscriptionStatus(x.id, "cancelled"))} className={quietBtn}>
                  Cancelled
                </button>
              </>
            )}
            <DeleteButton id={x.id} />
          </div>
        </div>
      ) : null}
    </li>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => (confirming ? start(() => deleteSubscription(id)) : setConfirming(true))}
      onBlur={() => setConfirming(false)}
      className={`ml-auto ${quietBtn} text-danger hover:text-danger`}
    >
      {confirming ? "Delete it and its payments?" : "Delete"}
    </button>
  );
}

/** The essentials up front; card, billing page, project and notes behind "More details". */
function SubscriptionForm({ sub: x, projects, today, onDone }: { sub?: SubscriptionRow; projects: ProjectOption[]; today: string; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (prev: FormState, form: FormData) => {
    const res = await saveSubscription(prev, form);
    if (!res?.error) onDone();
    return res;
  }, undefined);
  const id = (n: string) => `sub-${n}-${x?.id ?? "new"}`;
  const hasExtras = Boolean(x?.projectId || x?.paymentMethod || x?.url || x?.notes);
  return (
    <form onSubmit={keepValues(action)} className="flex flex-col gap-4">
      {x ? <input type="hidden" name="id" value={x.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Field label="Service" id={id("name")}>
          <input id={id("name")} name="name" required maxLength={80} defaultValue={x?.name} placeholder="Vercel Pro" autoComplete="off" autoFocus={!x} className={inputCls} />
        </Field>
        <Field label="Category" id={id("category")}>
          <select id={id("category")} name="category" defaultValue={x?.category ?? "hosting"} className={inputCls}>
            {SUB_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SUB_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
          <Field label="Price" id={id("amount")}>
            <input id={id("amount")} name="amount" required inputMode="decimal" defaultValue={x ? (x.amount / 100).toFixed(2) : ""} placeholder="20.00" className={`tabular ${inputCls}`} />
          </Field>
          <Field label="Currency" id={id("currency")}>
            <input id={id("currency")} name="currency" required list="sub-currencies" maxLength={3} defaultValue={x?.currency ?? "USD"} autoComplete="off" spellCheck={false} className={`uppercase ${inputCls}`} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Bills" id={id("cycle")}>
            <select id={id("cycle")} name="cycle" defaultValue={x?.cycle ?? "monthly"} className={inputCls}>
              {CYCLES.map((c) => (
                <option key={c} value={c}>
                  {CYCLE_LABEL[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Next renewal" id={id("nextDue")}>
            <input id={id("nextDue")} name="nextDue" type="date" required defaultValue={x?.nextDue ?? today} className={inputCls} />
          </Field>
        </div>
      </div>

      <details open={hasExtras}>
        <summary className={summaryCls}>More details</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Card or account" id={id("paymentMethod")}>
            <input id={id("paymentMethod")} name="paymentMethod" maxLength={80} defaultValue={x?.paymentMethod ?? ""} placeholder="Visa ending 4242" autoComplete="off" className={inputCls} />
          </Field>
          <Field label="Paid for a project" id={id("projectId")}>
            <select id={id("projectId")} name="projectId" defaultValue={x && projects.some((p) => p.id === x.projectId) ? (x.projectId ?? "") : ""} className={inputCls}>
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Billing page" id={id("url")} className="sm:col-span-2">
            <input id={id("url")} name="url" type="url" defaultValue={x?.url ?? ""} placeholder="https://vercel.com/account/billing" className={inputCls} />
          </Field>
          <Field label="Notes" id={id("notes")} className="sm:col-span-2">
            <textarea id={id("notes")} name="notes" rows={2} maxLength={2000} defaultValue={x?.notes ?? ""} className={inputCls} />
          </Field>
        </div>
      </details>

      <datalist id="sub-currencies">
        {CURRENCIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      {state?.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button disabled={pending} className={primaryBtn}>
          {pending ? "Saving…" : x ? "Save" : "Add"}
        </button>
        <button type="button" onClick={onDone} className={quietBtn}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Payments recorded so far, newest first, folded away. A subscription's latest payment can be undone. */
function PaymentHistory({ payments, today }: { payments: PaymentRow[]; today: string }) {
  const [pending, start] = useTransition();
  return (
    <details>
      <summary className={summaryCls}>Payment history ({payments.length})</summary>
      <ul className="mt-2 divide-y divide-line/70">
        {payments.slice(0, 40).map((p) => (
          <li key={p.id} className="flex items-baseline gap-3 py-2 text-sm">
            <span className="tabular w-24 shrink-0 text-muted">{formatShort(p.paidOn, today)}</span>
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
            <span className="tabular">{formatMoney(p.amount, p.currency)}</span>
            {p.latest ? (
              <button type="button" disabled={pending} onClick={() => start(() => undoPayment(p.id))} aria-label={`Undo the ${p.name} payment`} className="text-muted underline decoration-line underline-offset-4 hover:text-ink">
                Undo
              </button>
            ) : (
              <span aria-hidden className="w-[2.1rem]" />
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
