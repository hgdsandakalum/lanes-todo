import { addDays, pad } from "./dates";

/** Subscription payments: what each service costs, how often, and when it next renews. Amounts are in cents. */

export const SUB_CATEGORIES = ["hosting", "domains", "ai", "dev_tools", "design", "productivity", "storage", "entertainment", "other"] as const;
export type SubCategory = (typeof SUB_CATEGORIES)[number];
export const SUB_CATEGORY_LABEL: Record<SubCategory, string> = {
  hosting: "Hosting & servers",
  domains: "Domains & email",
  ai: "AI tools",
  dev_tools: "Developer tools",
  design: "Design",
  productivity: "Productivity",
  storage: "Storage & backup",
  entertainment: "Entertainment",
  other: "Other",
};

export const CYCLES = ["weekly", "monthly", "quarterly", "yearly"] as const;
export type Cycle = (typeof CYCLES)[number];
export const CYCLE_LABEL: Record<Cycle, string> = { weekly: "Weekly", monthly: "Monthly", quarterly: "Every 3 months", yearly: "Yearly" };

export const SUB_STATUSES = ["active", "paused", "cancelled"] as const;
export type SubStatus = (typeof SUB_STATUSES)[number];

export const CURRENCIES = ["USD", "LKR", "EUR", "GBP", "JPY", "AUD", "INR", "SGD"] as const;

/** Renewals this many days ahead count as due soon. */
export const SUB_DUE_SOON_DAYS = 7;

/** "12.99" or "1,200" → 1299 / 120000 cents; null when it isn't a positive amount. */
export function parseAmount(input: string): number | null {
  const s = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return cents > 0 && cents < 1e12 ? cents : null;
}

/** "USD" and other ISO codes the runtime can format; null otherwise. */
export function parseCurrency(input: string): string | null {
  const c = input.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(c)) return null;
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: c });
    return c;
  } catch {
    return null;
  }
}

export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).format(cents / 100);
}

/** What one cycle's price comes to per month, in cents. */
export function monthlyCents(cents: number, cycle: Cycle): number {
  if (cycle === "weekly") return (cents * 52) / 12;
  if (cycle === "quarterly") return cents / 3;
  if (cycle === "yearly") return cents / 12;
  return cents;
}

/** Monthly and yearly totals of the active subscriptions, one per currency (no exchange rates), biggest first. */
export function totalsByCurrency(subs: { amount: number; currency: string; cycle: Cycle; status: string }[]) {
  const by = new Map<string, number>();
  for (const s of subs) if (s.status === "active") by.set(s.currency, (by.get(s.currency) ?? 0) + monthlyCents(s.amount, s.cycle));
  return [...by]
    .map(([currency, month]) => ({ currency, month: Math.round(month), year: Math.round(month * 12) }))
    .sort((a, b) => b.month - a.month);
}

const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/**
 * The renewal after `day`. Months keep the billing day (`anchor`, 1–31) and clamp it to short months,
 * so a plan billed on the 31st renews on 28 Feb, then 31 Mar again.
 */
export function nextRenewal(day: string, cycle: Cycle, anchor = Number(day.slice(8))): string {
  if (cycle === "weekly") return addDays(day, 7);
  const [y, m] = day.split("-").map(Number);
  const step = cycle === "monthly" ? 1 : cycle === "quarterly" ? 3 : 12;
  const total = m - 1 + step;
  const ny = y + Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${pad(nm)}-${pad(Math.min(anchor, daysIn(ny, nm)))}`;
}
