import { dueMarks, isWaiting } from "@/lib/domain/due";
import { formatMinutes } from "@/lib/domain/estimate";
import { describeRecur } from "@/lib/domain/recur";
import { FINISHED_FOR_ME, taskKindLabel, type Priority, type Stage, type TaskType } from "@/lib/domain/stages";
import type { Task } from "@/lib/db/schema";
import { LabelChip } from "@/components/task/sections";
import { KindIcon } from "./kind-icon";
import { aboveCard, CardLink, TaskCard } from "./task-card";
import { DueMarks } from "./due-marks";
import { Meta } from "./meta";
import { TaskMarkdown } from "./markdown";
import { PriorityMark } from "./priority";
import { StageSelect } from "./stage-select";
import { TaskLinks } from "./task-links";

export type RowExtras = {
  labels?: { name: string; color: string }[];
  progress?: { done: number; total: number };
  bugs?: number; // bug subtasks still to fix
  blocked?: boolean;
  since?: Date | null; // when design work was sent for feedback
};

type Props = { task: Task; stages: Stage[]; repo: string | null; today: string; waitDays: number; color?: string } & RowExtras;

export { taskHref } from "./task-card";

/**
 * A task in a list, as a card edged in its project's colour: kind, title, what matters at a glance, and its stage.
 * The whole card opens the task; the stage, links and notes inside it stay clickable on their own.
 */
export function TaskRow({ task, stages, repo, today, waitDays, color, labels = [], progress, bugs = 0, blocked = false, since }: Props) {
  const type = task.type as TaskType;
  // once dev released, bugs QA reports are added as subtasks; they are the work left for you
  const qa = bugs > 0 && FINISHED_FOR_ME.has(task.stage);

  return (
    <TaskCard color={color} waiting={isWaiting(task)}>
      <div className="grid grid-cols-1 items-start gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="flex items-start gap-2 font-medium leading-snug">
            <KindIcon type={type} kind={task.kind} className="mt-0.5 size-4 text-muted" />
            <CardLink id={task.id}>{task.title}</CardLink>
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 text-sm text-muted [&_a]:relative [&_a]:z-10">
            <span>{taskKindLabel(type, task.kind)}</span>
            {task.priority ? <PriorityMark priority={task.priority as Priority} withLabel /> : null}
            {blocked || task.blocker ? <span className="font-medium text-danger">Blocked</span> : null}
            {qa ? (
              <Meta icon="bug" title="Bugs QA sent back, still to fix. They're subtasks of this task." className="font-semibold text-danger">
                {bugs} QA {bugs === 1 ? "bug" : "bugs"}
              </Meta>
            ) : null}
            <DueMarks marks={dueMarks(task, today, { waitDays, since })} />
            {progress && progress.total ? (
              <Meta icon="progress" label="Subtasks and checklist done" title={`${progress.done} of ${progress.total} subtasks and checklist items done`} className="tabular">
                {progress.done}/{progress.total}
              </Meta>
            ) : null}
            {task.estimateMin ? (
              <Meta icon="estimate" label="Estimate" title="Estimate" className="tabular">
                {formatMinutes(task.estimateMin)}
              </Meta>
            ) : null}
            {task.recur ? <span>{describeRecur(task.recur)}</span> : null}
            {task.ticket ? (
              <Meta icon="ticket" label="Ticket" title="Ticket" className="tabular">
                {task.ticket}
              </Meta>
            ) : null}
            {type === "design" && task.revision != null ? <span>Round {task.revision}</span> : null}
            {type === "design" && task.assets != null ? (
              <span>
                {task.assets} {task.assets === 1 ? "asset" : "assets"}
              </span>
            ) : null}
            {labels.map((l) => (
              <LabelChip key={l.name} {...l} />
            ))}
            <TaskLinks branch={task.branch} link={task.link} repo={repo} />
          </p>
          {task.description ? (
            <div className="pointer-events-none relative z-10 pl-6 [&_a]:pointer-events-auto [&_summary]:pointer-events-auto">
              <Notes text={task.description} />
            </div>
          ) : null}
        </div>
        <StageSelect
          taskId={task.id}
          title={task.title}
          stage={task.stage}
          stages={stages}
          className={`${aboveCard} max-sm:ml-6 max-sm:w-fit sm:col-start-2 sm:row-start-1 sm:w-36`}
        />
      </div>
    </TaskCard>
  );
}

/** The description, folded under the title until asked for. */
export function Notes({ text }: { text: string }) {
  return (
    <details className="group mt-2">
      <summary className="w-fit cursor-pointer list-none text-sm text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">Show notes</span>
        <span className="hidden group-open:inline">Hide notes</span>
      </summary>
      <TaskMarkdown text={text} className="mt-2 border-l-2 border-line pl-3" />
    </details>
  );
}
