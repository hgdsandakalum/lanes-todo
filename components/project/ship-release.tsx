"use client";
import { useActionState, useState } from "react";
import { shipRelease } from "@/lib/actions/releases";
import type { FormState } from "@/lib/actions/tasks";
import { defaultReleaseName } from "@/lib/domain/releases";
import { keepValues } from "@/components/projects/keep-values";
import { toneClass } from "@/components/tasks/due-marks";
import type { Mark } from "@/lib/domain/due";

type Waiting = { id: string; title: string; stage: string; branch: string | null; waited: number; devDay: string; mark: Mark };

/** Awaiting production, with a checkbox per task and one button that ships the ticked ones as a release. */
export function ShipRelease({ projectId, tasks, today }: { projectId: string; tasks: Waiting[]; today: string }) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set(tasks.map((t) => t.id)));
  const [day, setDay] = useState(today);
  const [state, action, pending] = useActionState(async (prev: FormState, form: FormData) => {
    const res = await shipRelease(prev, form);
    if (!res?.error) setPicked(new Set());
    return res;
  }, undefined);

  if (tasks.length === 0) {
    return <p className="mt-2 text-sm text-muted">Nothing waiting. Dev released code shows up here until it ships.</p>;
  }
  const visible = tasks.filter((t) => picked.has(t.id)).length;
  const all = visible === tasks.length;
  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <form onSubmit={keepValues(action)}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex items-center gap-3 border-b border-line pb-2 text-sm">
        <label className="flex items-center gap-2 text-muted">
          <input
            type="checkbox"
            checked={all}
            onChange={() => setPicked(all ? new Set() : new Set(tasks.map((t) => t.id)))}
            className="size-4 accent-[var(--queen)]"
          />
          Select all
        </label>
      </div>
      <ul className="divide-y divide-line/70">
        {tasks.map((t) => (
          <li key={t.id}>
            <label className="flex cursor-pointer items-start gap-3 py-2.5">
              <input type="checkbox" name="taskId" value={t.id} checked={picked.has(t.id)} onChange={() => toggle(t.id)} className="mt-1 size-4 shrink-0 accent-[var(--queen)]" />
              <span className="min-w-0">
                <span className="block font-medium leading-snug">{t.title}</span>
                <span className={`tabular block text-sm ${toneClass(t.mark.tone) ?? ""}`}>
                  {t.mark.text}
                  {t.stage === "staging" ? ", now in staging" : ""}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_10.5rem] gap-3 border-t border-line pt-4">
        <div>
          <label htmlFor="release-name" className="mb-1 block text-sm font-medium">
            Release name
          </label>
          <input
            id="release-name"
            name="name"
            maxLength={80}
            placeholder={defaultReleaseName(day)}
            autoComplete="off"
            className="w-full rounded-sm border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-queen"
          />
        </div>
        <div>
          <label htmlFor="release-day" className="mb-1 block text-sm font-medium">
            Released on
          </label>
          <input
            id="release-day"
            name="day"
            type="date"
            value={day}
            max={today}
            onChange={(e) => setDay(e.target.value || today)}
            className="w-full rounded-sm border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-queen"
          />
        </div>
        <button disabled={pending || visible === 0} className="col-span-2 rounded-full bg-queen-fill px-4 py-2 text-sm font-semibold text-queen-ink hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Shipping…" : visible === 0 ? "Tick tasks to ship" : `Ship ${visible} to production`}
        </button>
        {state?.error ? (
          <p role="alert" className="col-span-2 text-sm text-danger">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
