import type { Project, Task } from "@/lib/db/schema";
import { dueMarks } from "@/lib/domain/due";
import { PriorityMark } from "@/components/tasks/priority";
import { type Priority, closingStage, FINISHED_FOR_ME, codeKind, stagesFor, taskKindLabel, TASK_TYPES, CODE_KINDS, type TaskType } from "@/lib/domain/stages";
import { KindIcon } from "@/components/tasks/kind-icon";
import { taskHref, type RowExtras } from "@/components/tasks/task-row";
import { DueMarks } from "@/components/tasks/due-marks";
import Link from "next/link";
import { BOARD_CLOSED_DAYS } from "@/lib/domain/releases";
import { StageSelect } from "@/components/tasks/stage-select";
import { TaskLinks } from "@/components/tasks/task-links";

/** Board groups: each code kind runs its own workflow, then design, then general. */
const GROUPS: { type: TaskType; kind: string | null }[] = [
  ...CODE_KINDS.map((kind) => ({ type: "code" as const, kind })),
  ...TASK_TYPES.filter((t) => t !== "code").map((type) => ({ type, kind: null })),
];
const inGroup = (t: Task, g: (typeof GROUPS)[number]) => t.type === g.type && codeKind(t.type, t.kind) === g.kind;

/**
 * One board per workflow (each code kind, design, general), a column per stage.
 * The closing column holds only the last two weeks.
 */
export function Boards({ project, tasks, types, today, extras = {} }: { project: Project; tasks: Task[]; types: TaskType[]; today: string; extras?: Record<string, RowExtras> }) {
  const shown = GROUPS.filter((g) => types.includes(g.type) && tasks.some((t) => inGroup(t, g)));
  if (shown.length === 0) return <p className="py-6 text-sm text-muted">No tasks here yet. Add one with #{project.code.toLowerCase()} in quick add.</p>;
  return (
    <div className="flex flex-col gap-10">
      {shown.map(({ type, kind }) => (
        <section key={`${type}:${kind}`} aria-label={`${taskKindLabel(type, kind)} board`}>
          {shown.length > 1 ? (
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <KindIcon type={type} kind={kind} />
              {taskKindLabel(type, kind)}
            </h3>
          ) : null}
          <div className="relative -mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
            <ol className="grid auto-cols-[minmax(10.5rem,1fr)] grid-flow-col gap-3">
              {stagesFor(type, project.hasStaging, kind).map((stage) => {
                const cards = tasks.filter((t) => inGroup(t, { type, kind }) && t.stage === stage.key);
                const closing = stage.key === closingStage(type, kind);
                return (
                  <li key={stage.key} className="flex min-w-0 flex-col rounded-sm border border-line bg-sunk/60">
                    <div className="flex items-baseline justify-between border-b border-line px-3 py-2">
                      <h4 className="text-sm font-semibold">{stage.label}</h4>
                      <span className="tabular text-xs text-muted">{cards.length}</span>
                    </div>
                    <ul className="flex flex-col gap-2 p-2">
                      {cards.map((t) => (
                        <li key={t.id} className={`rounded-sm border border-line bg-surface p-3 ${closing ? "opacity-70" : ""}`}>
                          <Link href={taskHref(t.id)} className="text-sm font-medium leading-snug hover:underline">
                            {t.title}
                          </Link>
                          <p className="mt-1 flex flex-wrap gap-x-2.5 gap-y-1 text-xs text-muted">
                            {t.priority ? <PriorityMark priority={t.priority as Priority} /> : null}
                            {extras[t.id]?.bugs && FINISHED_FOR_ME.has(t.stage) ? (
                              <span className="font-semibold text-danger">
                                {extras[t.id].bugs} QA {extras[t.id].bugs === 1 ? "bug" : "bugs"}
                              </span>
                            ) : null}
                            <DueMarks marks={dueMarks(t, today, { waitDays: project.prodWaitDays, since: extras[t.id]?.since })} />
                            <TaskLinks branch={t.branch} link={t.link} repo={project.repo} shipped={t.closedAt != null} />
                          </p>
                          <StageSelect taskId={t.id} title={t.title} stage={t.stage} stages={stagesFor(type, project.hasStaging, kind)} className="mt-2" />
                        </li>
                      ))}
                      {cards.length === 0 ? <li className="px-1 py-2 text-xs text-muted">Empty</li> : null}
                    </ul>
                    {closing ? <p className="mt-auto px-3 pb-2 text-xs text-muted">Last {BOARD_CLOSED_DAYS} days</p> : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      ))}
    </div>
  );
}
