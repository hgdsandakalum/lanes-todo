"use client";
import { useState, useTransition } from "react";
import { pickDeepTask } from "@/lib/actions/today";
import type { TodayTask } from "@/lib/data/today";
import { formatShort } from "@/lib/domain/dates";
import { FINISHED_FOR_ME, stagesFor, type TaskType } from "@/lib/domain/stages";
import { QueenMedallion } from "@/components/board/queen";
import { ProjectTag } from "@/components/tasks/project-tag";
import { StageSelect } from "@/components/tasks/stage-select";
import { TaskLinks } from "@/components/tasks/task-links";
import { Notes } from "@/components/tasks/task-row";
import { editorUrl } from "@/lib/domain/folders";
import { TaskPicker } from "./task-picker";

const btn = "rounded-sm px-3 py-1.5 text-sm text-muted hover:bg-sunk hover:text-ink disabled:opacity-50";

/** The queen of the day: one task picked in the morning sweep, worked first, finished for streaks. */
export function DeepTask({ deep, carry, pickable, today }: { deep: TodayTask | null; carry: TodayTask | null; pickable: TodayTask[]; today: string }) {
  const [changing, setChanging] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pick(taskId: string | null) {
    setError(null);
    start(async () => {
      try {
        await pickDeepTask(taskId);
        setChanging(false);
      } catch {
        setError("Couldn't save that pick. Check your connection and try again.");
      }
    });
  }

  const finished = deep != null && FINISHED_FOR_ME.has(deep.stage);

  return (
    <section
      aria-labelledby="deep"
      className="flex flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-line bg-surface/60 p-6 text-center sm:flex-row sm:items-center sm:p-8 sm:text-left md:flex-none"
    >
      <QueenMedallion filled={deep != null} className="size-36 shrink-0 sm:size-32" />
      <div className="flex w-full min-w-0 flex-col justify-center">
        <h2 id="deep" className="font-display text-xl font-extrabold tracking-tight">
          Today&apos;s deep task
        </h2>

        {deep && !changing ? (
          <>
            <p className={`mt-2 font-display text-3xl font-medium leading-tight ${finished ? "text-muted line-through decoration-queen decoration-2" : ""}`}>{deep.title}</p>
            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted sm:justify-start">
              <ProjectTag code={deep.projectCode} color={deep.projectColor} title={deep.projectName} />
              {deep.due ? <span className={deep.due < today ? "text-danger" : undefined}>Due {formatShort(deep.due, today)}</span> : null}
              <TaskLinks branch={deep.branch} link={deep.link} repo={deep.repo} />
              {deep.localPath && !finished ? (
                <a href={editorUrl(deep.localPath)} title={deep.localPath} className="underline decoration-line underline-offset-4 hover:text-ink">
                  Open in Cursor
                </a>
              ) : null}
            </p>
            {deep.description ? (
              <div className="text-left">
                <Notes text={deep.description} />
              </div>
            ) : null}
            {finished ? <p className="mt-3 font-medium text-queen">Done for today. The rest of the day is yours.</p> : null}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <StageSelect
                taskId={deep.id}
                title={deep.title}
                stage={deep.stage}
                stages={stagesFor(deep.type as TaskType, deep.hasStaging, deep.kind)}
                className="w-44"
              />
              {!finished ? (
                <button type="button" onClick={() => setChanging(true)} className={btn}>
                  Change
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {pickable.length === 0 ? (
              <p className="text-muted">No open tasks yet. Add one with quick add above, then pick it here.</p>
            ) : (
              <>
                {!deep ? <p className="max-w-[46ch] text-[15px] text-muted">Pick one during the morning sweep. Finishing it is worth 50 XP and keeps your streak going.</p> : null}
                {carry && carry.id !== deep?.id ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => pick(carry.id)}
                    className="flex min-w-0 items-center gap-2 rounded-sm border border-dashed border-queen px-3 py-2 text-left text-sm hover:bg-sunk disabled:opacity-50"
                  >
                    <span className="shrink-0 text-muted">Carry over</span>
                    <ProjectTag code={carry.projectCode} color={carry.projectColor} />
                    <span className="truncate font-medium">{carry.title}</span>
                  </button>
                ) : null}
                <TaskPicker id="deep-pick" label="Choose a task" tasks={pickable} action={{ label: "Pick", run: pick }} pending={pending} />
              </>
            )}
            {changing ? (
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                <button type="button" onClick={() => setChanging(false)} className={btn}>
                  Keep {deep?.title}
                </button>
                <button type="button" disabled={pending} onClick={() => pick(null)} className={btn}>
                  Clear today&apos;s pick
                </button>
              </div>
            ) : null}
          </div>
        )}
        {error ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
