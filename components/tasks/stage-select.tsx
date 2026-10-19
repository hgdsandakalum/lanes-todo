"use client";
import { useOptimistic, useState, useTransition } from "react";
import { setTaskStage } from "@/lib/actions/tasks";
import type { Stage } from "@/lib/domain/stages";
import { announceXp } from "@/components/game/xp-pulse";

/** Stages worth spotting at a glance get a tinted fill; the rest stay plain. */
const STAGE_COLOR: Partial<Record<string, string>> = {
  in_progress: "var(--c-sky)",
  dev_released: "var(--c-violet)",
  staging: "var(--c-amber)",
  prod_released: "var(--c-teal)",
};

/** A task's stage as a dropdown; moves save straight away. */
export function StageSelect({ taskId, title, stage, stages, className = "" }: { taskId: string; title: string; stage: string; stages: Stage[]; className?: string }) {
  const [shown, setShown] = useOptimistic(stage);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function move(next: string) {
    setError(null);
    startTransition(async () => {
      setShown(next);
      try {
        announceXp(await setTaskStage(taskId, next));
      } catch {
        setError("Couldn't move that task. Check your connection and try again.");
      }
    });
  }

  const color = STAGE_COLOR[shown];

  return (
    <div className={`relative ${className}`}>
      <label className="sr-only" htmlFor={`stage-${taskId}`}>
        Stage of {title}
      </label>
      <select
        id={`stage-${taskId}`}
        value={shown}
        onChange={(e) => move(e.target.value)}
        style={color ? { background: `color-mix(in srgb, ${color} 22%, var(--bg))`, borderColor: `color-mix(in srgb, ${color} 60%, transparent)` } : undefined}
        className="w-full cursor-pointer rounded-full border border-line bg-bg py-1 pl-3 pr-2 text-sm hover:border-muted focus:border-queen"
      >
        {stages.map((s) => (
          <option key={s.key} value={s.key} className="bg-bg">
            {s.label}
          </option>
        ))}
      </select>
      {error ? (
        <p role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
