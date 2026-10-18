import { formatShort } from "@/lib/domain/dates";
import { formatMinutes } from "@/lib/domain/estimate";
import { describeRecur } from "@/lib/domain/recur";
import { taskKindLabel, type Priority, type Stage, type TaskType } from "@/lib/domain/stages";
import type { Task } from "@/lib/db/schema";
import { LabelChip } from "@/components/task/sections";
import { KindIcon } from "./kind-icon";
import { aboveCard, CardLink, TaskCard } from "./task-card";
import { TaskMarkdown } from "./markdown";
import { PriorityMark } from "./priority";
import { StageSelect } from "./stage-select";
import { TaskLinks } from "./task-links";

export type RowExtras = { labels?: { name: string; color: string }[]; progress?: { done: number; total: number }; blocked?: boolean };

type Props = { task: Task; stages: Stage[]; repo: string | null; today: string; color?: string } & RowExtras;

export { taskHref } from "./task-card";

/**
 * A task in a list, as a card edged in its project's colour: kind, title, what matters at a glance, and its stage.
 * The whole card opens the task; the stage, links and notes inside it stay clickable on their own.
 */
export function TaskRow({ task, stages, repo, today, color, labels = [], progress, blocked = false }: Props) {
  const type = task.type as TaskType;
  const overdue = task.due != null && task.due < today;

  return (
    <TaskCard color={color}>
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
            {task.due ? (
              <span className={overdue ? "text-danger" : undefined}>
                {overdue ? "Was due" : "Due"} {formatShort(task.due, today)}
              </span>
            ) : null}
            {progress && progress.total ? (
              <span className="tabular" title="Subtasks and checklist items done">
                {progress.done}/{progress.total}
              </span>
            ) : null}
            {task.estimateMin ? <span className="tabular">{formatMinutes(task.estimateMin)}</span> : null}
            {task.recur ? <span>{describeRecur(task.recur)}</span> : null}
            {task.ticket ? <span className="tabular">{task.ticket}</span> : null}
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
