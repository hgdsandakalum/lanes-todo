"use client";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { setRoutineItem } from "@/lib/actions/routines";
import { announceXp } from "@/components/game/xp-pulse";
import { ProjectTag } from "@/components/tasks/project-tag";
import { taskHref } from "@/components/tasks/task-card";
import type { SignalState } from "@/lib/data/routines";
import type { RoutineItem, Signal } from "@/lib/domain/routines";

type Routine = { key: string; title: string; note: string | null; items: RoutineItem[]; checked: number[] };

/**
 * A day's routine as a checklist. Items tied to a signal show its live count, with the tasks behind it a click away;
 * the deep-task item ticks itself. Once every item is ticked, the routine folds to one line.
 */
export function RoutineChecklist({ routine, signals }: { routine: Routine; signals?: Partial<Record<Signal, SignalState>> }) {
  const [checked, setChecked] = useOptimistic(new Set(routine.checked), (state, { index, on }: { index: number; on: boolean }) => {
    const next = new Set(state);
    if (on) next.add(index);
    else next.delete(index);
    return next;
  });
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const done = checked.size;
  const total = routine.items.length;
  const complete = done === total;
  const [open, setOpen] = useState(!complete);
  const [wasComplete, setWasComplete] = useState(complete);
  // fold when the last item gets ticked; unfold if one is unticked
  if (complete !== wasComplete) {
    setWasComplete(complete);
    setOpen(!complete);
  }

  function toggle(index: number) {
    const on = !checked.has(index);
    setError(null);
    startTransition(async () => {
      setChecked({ index, on });
      try {
        announceXp(await setRoutineItem(routine.key, index, on));
      } catch {
        setError("Couldn't save that tick. Check your connection and try again.");
      }
    });
  }

  return (
    <section aria-labelledby={`routine-${routine.key}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={`routine-${routine.key}`} className="font-display text-lg font-extrabold tracking-tight">
          <Link href="/routines" className="hover:underline hover:underline-offset-4" title="Edit routines">
            {routine.title}
          </Link>
        </h3>
        {complete ? (
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="text-sm font-semibold hover:underline hover:underline-offset-4">
            Done ✓ <span className="font-normal text-muted">{open ? "Hide" : "Show"}</span>
          </button>
        ) : (
          <p className="tabular shrink-0 text-sm text-muted">
            {done} / {total}
          </p>
        )}
      </div>
      {open ? (
        <>
          {routine.note ? <p className="mt-0.5 text-sm text-muted">{routine.note}</p> : null}
          <ul className="mt-3">
            {routine.items.map((item, i) => {
              const on = checked.has(i);
              const auto = item.signal === "deep";
              const signal = item.signal ? signals?.[item.signal] : undefined;
              return (
                <li key={i} className="py-1">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    aria-disabled={auto || undefined}
                    onClick={() => (auto ? null : toggle(i))}
                    title={auto ? "Ticks itself once today's deep task is picked" : undefined}
                    className={`group flex w-full items-start gap-3 rounded-lg px-1.5 py-1 text-left text-[15px] leading-snug ${auto ? "cursor-default" : "hover:bg-sunk/60"}`}
                  >
                    <span aria-hidden className={`mt-0.5 grid size-4 shrink-0 place-items-center border-2 ${auto ? "border-line" : "border-muted group-hover:border-ink"}`}>
                      {on ? <span className="pocket-in size-2 bg-pocket" /> : null}
                    </span>
                    <span className={on ? "text-muted line-through decoration-line decoration-2" : ""}>{item.text}</span>
                  </button>
                  {signal ? <SignalLine signal={signal} done={on} /> : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}

/** The live count under an item; when tasks are behind it, a click lists them. */
function SignalLine({ signal, done }: { signal: SignalState; done: boolean }) {
  // red only for what's urgent; anything else waiting on you reads in full ink until the item is ticked
  const tone = done ? "text-muted" : signal.alert ? "text-danger" : signal.tasks.length ? "text-ink" : "text-muted";
  if (!signal.tasks.length) return <p className={`pl-9 text-sm ${tone}`}>{signal.summary}</p>;
  return (
    <details className="group pl-9 text-sm">
      <summary className={`w-fit cursor-pointer list-none hover:underline hover:underline-offset-4 [&::-webkit-details-marker]:hidden ${tone}`}>
        {signal.summary} <span aria-hidden className="inline-block text-muted transition-transform group-open:rotate-90">›</span>
      </summary>
      <ul className="mt-1 flex flex-col gap-1 pb-1">
        {signal.tasks.slice(0, 8).map((t) => (
          <li key={t.id} className="flex min-w-0 items-baseline gap-2">
            <ProjectTag code={t.projectCode} color={t.projectColor} />
            <Link href={taskHref(t.id)} className="min-w-0 truncate hover:underline hover:underline-offset-4">
              {t.title}
            </Link>
          </li>
        ))}
        {signal.tasks.length > 8 ? <li className="text-muted">and {signal.tasks.length - 8} more</li> : null}
      </ul>
    </details>
  );
}
