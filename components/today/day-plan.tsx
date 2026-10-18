"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { addToPlan, closeDay, movePlanItem, removeFromPlan, reopenDay } from "@/lib/actions/plan";
import { startTimer, stopTimer } from "@/lib/actions/task-detail";
import type { PlanTask } from "@/lib/data/plan";
import type { TodayTask } from "@/lib/data/today";
import { formatMinutes } from "@/lib/domain/estimate";
import { stagesFor, type Priority } from "@/lib/domain/stages";
import { KindIcon } from "@/components/tasks/kind-icon";
import { PriorityMark } from "@/components/tasks/priority";
import { ProjectTag } from "@/components/tasks/project-tag";
import { StageSelect } from "@/components/tasks/stage-select";
import { TaskMarkdown } from "@/components/tasks/markdown";
import { aboveCard, CardLink, cardList, TaskCard } from "@/components/tasks/task-card";
import { TaskPicker } from "./task-picker";

const iconBtn = "rounded-sm px-1.5 py-1 text-sm text-muted hover:bg-sunk hover:text-ink disabled:opacity-30";
const href = (id: string) => `/t/${id.replace(/^t_/, "")}`;

/** Today's shortlist: what you mean to get through today, in order, with estimates against time actually spent. */
export function DayPlan({ plan, pickable }: { plan: { tasks: PlanTask[]; estimate: number; unestimated: number; spentToday: number }; pickable: TodayTask[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inPlan = new Set(plan.tasks.map((t) => t.id));
  const left = plan.tasks.filter((t) => !t.done).length;

  return (
    <section aria-labelledby="plan" className="border-t border-line pt-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 id="plan" className="font-display text-2xl font-extrabold tracking-tight">
          Today&apos;s list
        </h2>
        {plan.tasks.length ? (
          <p className="tabular text-sm text-muted">
            {left} left · {formatMinutes(plan.estimate)} planned{plan.unestimated ? ` (+${plan.unestimated} unestimated)` : ""} · {formatMinutes(plan.spentToday)} spent today
          </p>
        ) : null}
      </div>
      {plan.tasks.some((t) => t.carried && !t.done) ? <p className="mb-2 text-sm text-muted">Unfinished tasks from your last list carried over.</p> : null}

      {plan.tasks.length ? (
        <ol className={`mt-3 ${cardList}`}>
          {plan.tasks.map((t, i) => (
            <TaskCard key={t.id} color={t.projectColor} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto]">
              <div className="col-start-1 row-start-1 min-w-0">
                <p className={`flex items-center gap-2 ${t.done ? "text-muted line-through" : ""}`}>
                  <KindIcon type={t.type} kind={t.kind} className="size-4 text-muted" />
                  <CardLink id={t.id} className="truncate font-medium">
                    {t.title}
                  </CardLink>
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 text-sm text-muted">
                  <ProjectTag code={t.projectCode} color={t.projectColor} title={t.projectName} />
                  {t.priority ? <PriorityMark priority={t.priority as Priority} /> : null}
                  <span className={`tabular ${t.estimateMin != null && t.spent > t.estimateMin ? "text-danger" : ""}`}>
                    {formatMinutes(t.spent)}
                    {t.estimateMin != null ? ` / ${formatMinutes(t.estimateMin)}` : ""}
                  </span>
                  {t.carried ? <span>Carried over</span> : null}
                </p>
              </div>
              <StageSelect
                taskId={t.id}
                title={t.title}
                stage={t.stage}
                stages={stagesFor(t.type, t.hasStaging, t.kind)}
                className={`${aboveCard} col-span-2 w-fit sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:w-auto`}
              />
              <div className={`${aboveCard} col-start-2 row-start-1 flex items-center sm:col-start-3`}>
                {!t.done ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => start(() => (t.running ? stopTimer() : startTimer(t.id)))}
                    aria-label={t.running ? `Stop timer on ${t.title}` : `Start timer on ${t.title}`}
                    className={`${iconBtn} ${t.running ? "text-queen" : ""}`}
                  >
                    {t.running ? "■" : "▶"}
                  </button>
                ) : null}
                <button type="button" disabled={pending || i === 0} onClick={() => start(() => movePlanItem(t.id, "up"))} aria-label={`Move ${t.title} up`} className={iconBtn}>
                  ↑
                </button>
                <button
                  type="button"
                  disabled={pending || i === plan.tasks.length - 1}
                  onClick={() => start(() => movePlanItem(t.id, "down"))}
                  aria-label={`Move ${t.title} down`}
                  className={iconBtn}
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(() => removeFromPlan(t.id))}
                  aria-label={`Take ${t.title} off today's list`}
                  className={`${iconBtn} hover:text-danger`}
                >
                  ×
                </button>
              </div>
            </TaskCard>
          ))}
        </ol>
      ) : (
        <p className="text-muted">Pick the few tasks you mean to finish today. Anything left over carries to tomorrow.</p>
      )}

      <div className="mt-4">
        <TaskPicker
          id="plan-pick"
          label="Add a task to today"
          tasks={pickable.filter((t) => !inPlan.has(t.id))}
          pending={pending}
          action={{
            label: "Add",
            run: (id) =>
              start(async () => {
                setError((await addToPlan(id)).error ?? null);
              }),
          }}
        />
        {error ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}

type Review = {
  finished: { id: string; title: string; projectCode: string; projectColor: string }[];
  progressed: { id: string; title: string; projectCode: string; projectColor: string }[];
  xp: number;
  minutes: number;
  review: { note: string | null } | null;
};

/** The end-of-day review: what got done, from the day's activity, and a note to close the day with. */
export function EndOfDay({ data }: { data: Review }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState(data.review?.note ?? "");
  const [editing, setEditing] = useState(false);
  const closed = data.review != null && !editing;

  return (
    <section aria-labelledby="eod" className="border-t border-line pt-5">
      <h2 id="eod" className="font-display text-2xl font-extrabold tracking-tight">
        End of day
      </h2>
      <p className="tabular mt-1 text-sm text-muted">
        {data.finished.length} finished · {data.progressed.length} moved on · {formatMinutes(data.minutes)} tracked · {data.xp} XP
      </p>

      {data.finished.length ? (
        <>
          <h3 className="mt-4 text-sm font-medium">Done today</h3>
          <ul className="mt-1 flex flex-col gap-1">
            {data.finished.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <ProjectTag code={t.projectCode} color={t.projectColor} />
                <Link href={href(t.id)} className="min-w-0 truncate hover:underline">
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {data.progressed.length ? (
        <>
          <h3 className="mt-4 text-sm font-medium">Moved on</h3>
          <ul className="mt-1 flex flex-col gap-1">
            {data.progressed.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm text-muted">
                <ProjectTag code={t.projectCode} color={t.projectColor} />
                <Link href={href(t.id)} className="min-w-0 truncate hover:underline hover:text-ink">
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {closed ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-queen">Day closed.</p>
          {data.review?.note ? <TaskMarkdown text={data.review.note} className="mt-2 border-l-2 border-line pl-3" /> : null}
          <div className="mt-2 flex gap-3 text-sm">
            <button type="button" onClick={() => setEditing(true)} className="text-muted underline decoration-line underline-offset-4 hover:text-ink">
              Edit note
            </button>
            <button type="button" disabled={pending} onClick={() => start(() => reopenDay())} className="text-muted underline decoration-line underline-offset-4 hover:text-ink">
              Reopen the day
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <label htmlFor="eod-note" className="mb-1 block text-sm font-medium">
            Notes for tomorrow
          </label>
          <textarea
            id="eod-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={5000}
            placeholder="What went well, what got in the way, where to start tomorrow."
            className="w-full rounded-sm border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-queen"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await closeDay(note);
                setEditing(false);
              })
            }
            className="mt-2 rounded-sm bg-ink px-4 py-2 text-sm font-semibold text-bg disabled:opacity-60"
          >
            {data.review ? "Save note" : "Close the day"}
          </button>
        </div>
      )}
    </section>
  );
}
