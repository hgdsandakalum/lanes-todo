/**
 * Routine items are plain text, optionally tied to a live signal from your tasks: the checklist shows the count
 * beside the item and lists the tasks under it. The "deep" signal also ticks itself once today's deep task is picked.
 */

export const SIGNALS = ["reviews", "production", "due", "deep", "invoice"] as const;
export type Signal = (typeof SIGNALS)[number];

export const SIGNAL_LABEL: Record<Signal, string> = {
  reviews: "Code waiting on review",
  production: "Not in production yet",
  due: "Overdue or due by tomorrow",
  deep: "Today's deep task (ticks itself)",
  invoice: "Delivered, not invoiced",
};

export type RoutineItem = { text: string; signal?: Signal };

/** Items as stored: older rows hold plain strings. */
export type StoredItem = string | RoutineItem;

export const toItems = (stored: StoredItem[]): RoutineItem[] => stored.map((i) => (typeof i === "string" ? { text: i } : i));

export const ITEM_MAX = 20;
export const ITEM_TEXT_MAX = 200;
export const TITLE_MAX = 60;

/** Checks an edited routine; returns the cleaned items or an error. */
export function cleanRoutine(input: { title: string; note: string; weekdays: number[]; items: RoutineItem[] }):
  | { ok: true; value: { title: string; note: string | null; weekdays: number[]; items: RoutineItem[] } }
  | { ok: false; error: string } {
  const title = input.title.trim();
  const note = input.note.trim();
  const items = input.items
    .map((i) => ({ text: i.text.trim(), ...(i.signal && SIGNALS.includes(i.signal) ? { signal: i.signal } : {}) }))
    .filter((i) => i.text);
  const weekdays = [...new Set(input.weekdays)].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort();
  if (!title || title.length > TITLE_MAX) return { ok: false, error: `Give it a name under ${TITLE_MAX} characters.` };
  if (note.length > 200) return { ok: false, error: "Keep the note under 200 characters." };
  if (!weekdays.length) return { ok: false, error: "Pick at least one day." };
  if (!items.length) return { ok: false, error: "Add at least one item." };
  if (items.length > ITEM_MAX) return { ok: false, error: `Keep it to ${ITEM_MAX} items.` };
  if (items.some((i) => i.text.length > ITEM_TEXT_MAX)) return { ok: false, error: `Keep each item under ${ITEM_TEXT_MAX} characters.` };
  if (items.filter((i) => i.signal === "deep").length > 1) return { ok: false, error: "Only one item can tick itself for the deep task." };
  return { ok: true, value: { title, note: note || null, weekdays, items } };
}

/** The morning sweep as it ships: five steps, four of them backed by live counts. */
export const SWEEP_ITEMS: RoutineItem[] = [
  { text: "Unblock others and clear code reviews", signal: "reviews" },
  { text: "Scan messages and tickets; capture new work with quick add" },
  { text: "Nudge what's not in production", signal: "production" },
  { text: "Flag what's due today or tomorrow", signal: "due" },
  { text: "Pick today's deep task", signal: "deep" },
];
