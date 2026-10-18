"use client";
import { useState, useTransition } from "react";
import { starTask } from "@/lib/actions/today";
import type { TodayTask } from "@/lib/data/today";
import { colorVar } from "@/lib/domain/palette";
import { FINISHED_FOR_ME, stageLabel, type TaskType } from "@/lib/domain/stages";
import { TaskPicker } from "./task-picker";

type Slot = { workspace: { id: string; name: string; color: string }; star: TodayTask | null; candidates: TodayTask[] };

/** One starred task per workspace this week, a row each: the workspace, then its star or a way to pick one. */
export function WeeklyThree({ slots }: { slots: Slot[] }) {
  return (
    <ul className="divide-y divide-line/70">
      {slots.map((s) => (
        <StarSlot key={s.workspace.id} slot={s} />
      ))}
    </ul>
  );
}

function StarSlot({ slot: { workspace: w, star, candidates } }: { slot: Slot }) {
  const [changing, setChanging] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const finished = star != null && FINISHED_FOR_ME.has(star.stage);

  function set(taskId: string | null) {
    setError(null);
    start(async () => {
      try {
        await starTask(w.id, taskId);
        setChanging(false);
      } catch {
        setError("Couldn't save that star. Check your connection and try again.");
      }
    });
  }

  return (
    <li className="py-2.5 text-sm first:pt-0 last:pb-0">
      <div className="flex items-baseline gap-2">
        <span aria-hidden className="size-2.5 shrink-0 self-center" style={{ background: colorVar(w.color) }} />
        <span className="shrink-0 text-muted">{w.name}</span>
        {star && !changing ? (
          <>
            <span
              className={`min-w-0 flex-1 truncate text-right ${finished ? "text-muted line-through" : "font-medium"}`}
              title={stageLabel(star.type as TaskType, star.stage, star.kind)}
            >
              {star.title}
            </span>
            {!finished ? (
              <button type="button" onClick={() => setChanging(true)} aria-label={`Change the ${w.name} star`} className="shrink-0 text-muted hover:text-ink">
                Change
              </button>
            ) : null}
          </>
        ) : !changing ? (
          <button
            type="button"
            onClick={() => setChanging(true)}
            disabled={candidates.length === 0}
            className="ml-auto text-muted underline decoration-line underline-offset-4 hover:text-ink disabled:no-underline"
          >
            {candidates.length === 0 ? "No open tasks" : "Star a task"}
          </button>
        ) : null}
      </div>
      {changing ? (
        <div className="mt-2 flex flex-col gap-2">
          <TaskPicker id={`star-${w.id}`} label={`Star a ${w.name} task`} tasks={candidates} grouped={false} action={{ label: "Star", run: set }} pending={pending} />
          <div className="flex gap-3">
            <button type="button" onClick={() => setChanging(false)} className="text-muted hover:text-ink">
              Cancel
            </button>
            {star ? (
              <button type="button" disabled={pending} onClick={() => set(null)} className="text-muted hover:text-ink">
                Remove star
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="mt-1 text-danger">
          {error}
        </p>
      ) : null}
    </li>
  );
}
