"use client";
import { useState, useTransition } from "react";
import { Field, inputCls, primaryBtn, quietBtn } from "@/components/projects/fields";
import { deleteRoutine, saveRoutine } from "@/lib/actions/routines";
import { ITEM_MAX, SIGNAL_LABEL, SIGNALS, type RoutineItem, type Signal } from "@/lib/domain/routines";

type Routine = { key: string; title: string; note: string | null; weekdays: number[]; items: RoutineItem[] };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const iconBtn = "grid size-8 shrink-0 place-items-center rounded-sm text-muted hover:bg-sunk hover:text-ink disabled:opacity-30";
const FIXED = new Set(["sweep", "review"]);

/** Which days a routine runs, in words. */
function daysLabel(days: number[]) {
  const set = days.join();
  if (set === "1,2,3,4,5") return "Weekdays";
  if (days.length === 7) return "Every day";
  return days.map((d) => DAYS[d]).join(", ");
}

/** A routine as a summary row; Edit opens its editor in place. */
export function RoutineCard({ routine: r }: { routine: Routine }) {
  const [editing, setEditing] = useState(false);
  return (
    <li className="py-4">
      <div className="flex items-baseline gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-extrabold tracking-tight">{r.title}</h2>
          <p className="text-sm text-muted">
            {daysLabel(r.weekdays)} · {r.items.length} {r.items.length === 1 ? "item" : "items"}
            {r.note ? ` · ${r.note}` : ""}
          </p>
        </div>
        <button type="button" onClick={() => setEditing((v) => !v)} aria-expanded={editing} aria-label={editing ? `Close ${r.title}` : `Edit ${r.title}`} className={quietBtn}>
          {editing ? "Close" : "Edit"}
        </button>
      </div>
      {editing ? (
        <div className="mt-3 rounded-sm border border-line bg-surface p-4">
          <RoutineForm routine={r} onDone={() => setEditing(false)} />
        </div>
      ) : null}
    </li>
  );
}

export function NewRoutine() {
  const [open, setOpen] = useState(false);
  return open ? (
    <div className="rounded-sm border border-line bg-surface p-4" role="group" aria-label="New routine">
      <RoutineForm routine={{ key: "", title: "", note: null, weekdays: [1, 2, 3, 4, 5], items: [{ text: "" }] }} onDone={() => setOpen(false)} />
    </div>
  ) : (
    <button type="button" onClick={() => setOpen(true)} className="w-fit rounded-sm border border-dashed border-line px-4 py-2 text-sm text-muted hover:border-ink hover:text-ink">
      New routine
    </button>
  );
}

function RoutineForm({ routine: r, onDone }: { routine: Routine; onDone: () => void }) {
  const [title, setTitle] = useState(r.title);
  const [note, setNote] = useState(r.note ?? "");
  const [days, setDays] = useState(new Set(r.weekdays));
  const [items, setItems] = useState<RoutineItem[]>(r.items);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const id = (n: string) => `rt-${n}-${r.key || "new"}`;

  const setItem = (i: number, patch: Partial<RoutineItem>) => setItems((list) => list.map((x, n) => (n === i ? { ...x, ...patch } : x)));
  const move = (i: number, by: number) =>
    setItems((list) => {
      const next = [...list];
      [next[i], next[i + by]] = [next[i + by], next[i]];
      return next;
    });

  function save() {
    setError(null);
    start(async () => {
      const res = await saveRoutine(r.key, { title, note, weekdays: [...days], items });
      if (res?.error) setError(res.error);
      else onDone();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" id={id("title")}>
          <input id={id("title")} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={60} className={inputCls} />
        </Field>
        <Field label="Note (optional)" id={id("note")}>
          <input id={id("note")} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="30 minutes, before opening any code" className={inputCls} />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-medium">Days</legend>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d, n) => (
            <label key={d} className="cursor-pointer">
              <input
                type="checkbox"
                checked={days.has(n)}
                onChange={(e) =>
                  setDays((set) => {
                    const next = new Set(set);
                    if (e.target.checked) next.add(n);
                    else next.delete(n);
                    return next;
                  })
                }
                className="peer sr-only"
              />
              <span className="block rounded-full border border-line px-3 py-1 text-sm text-muted peer-checked:border-ink peer-checked:bg-ink peer-checked:text-bg peer-focus-visible:outline-2 peer-focus-visible:outline-queen">
                {d}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-medium">Items</legend>
        <p className="mb-2 text-sm text-muted">Link an item to your tasks to see a live count under it.</p>
        <ol className="flex flex-col gap-3 sm:gap-2">
          {items.map((item, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2 border-b border-line/60 pb-3 last:border-0 sm:flex-nowrap sm:border-0 sm:pb-0">
              <label htmlFor={id(`item-${i}`)} className="sr-only">
                Item {i + 1}
              </label>
              <input id={id(`item-${i}`)} value={item.text} onChange={(e) => setItem(i, { text: e.target.value })} maxLength={200} className={`min-w-0 flex-1 basis-full sm:basis-auto ${inputCls}`} />
              <label htmlFor={id(`signal-${i}`)} className="sr-only">
                Live count for item {i + 1}
              </label>
              <select
                id={id(`signal-${i}`)}
                value={item.signal ?? ""}
                onChange={(e) => setItem(i, { signal: (e.target.value || undefined) as Signal | undefined })}
                className={`w-auto min-w-0 flex-1 sm:w-56 sm:flex-none ${inputCls}`}
              >
                <option value="">No live count</option>
                {SIGNALS.map((sg) => (
                  <option key={sg} value={sg}>
                    {SIGNAL_LABEL[sg]}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move item ${i + 1} up`} className={iconBtn}>
                ↑
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move item ${i + 1} down`} className={iconBtn}>
                ↓
              </button>
              <button type="button" onClick={() => setItems((list) => list.filter((_, n) => n !== i))} disabled={items.length === 1} aria-label={`Remove item ${i + 1}`} className={`${iconBtn} hover:text-danger`}>
                ×
              </button>
            </li>
          ))}
        </ol>
        {items.length < ITEM_MAX ? (
          <button type="button" onClick={() => setItems((list) => [...list, { text: "" }])} className={`mt-2 ${quietBtn}`}>
            Add an item
          </button>
        ) : null}
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button disabled={pending} className={primaryBtn}>
          {pending ? "Saving…" : r.key ? "Save" : "Add routine"}
        </button>
        <button type="button" onClick={onDone} className={quietBtn}>
          Cancel
        </button>
        {r.key && !FIXED.has(r.key) ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => (confirming ? start(() => deleteRoutine(r.key)) : setConfirming(true))}
            onBlur={() => setConfirming(false)}
            className={`ml-auto ${quietBtn} text-danger hover:text-danger`}
          >
            {confirming ? "Click again to delete" : "Delete routine"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
