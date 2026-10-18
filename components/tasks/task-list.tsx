import type { Project, Task } from "@/lib/db/schema";
import { isWaiting } from "@/lib/domain/due";
import { priorityRank, stagesFor, type TaskType } from "@/lib/domain/stages";
import { cardList } from "./task-card";
import { TaskRow, type RowExtras } from "./task-row";

/**
 * A project's open top-level tasks, most urgent first, then oldest. Work that's with QA or the client sits apart below,
 * unless QA sent bugs back, which makes it yours again. Subtasks live on their task's page; closed tasks are only counted.
 */
export function TaskList({ project, tasks, closed, today, extras = {} }: { project: Project; tasks: Task[]; closed: number; today: string; extras?: Record<string, RowExtras> }) {
  const shown = tasks.filter((t) => t.parentId == null).sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  const waiting = shown.filter((t) => isWaiting(t) && !extras[t.id]?.bugs);
  const mine = shown.filter((t) => !waiting.includes(t));
  const row = (t: Task) => (
    <TaskRow
      key={t.id}
      color={project.color}
      task={t}
      stages={stagesFor(t.type as TaskType, project.hasStaging, t.kind)}
      repo={project.repo}
      today={today}
      waitDays={project.prodWaitDays}
      {...extras[t.id]}
    />
  );
  return (
    <div>
      {shown.length === 0 ? (
        <p className="py-3 text-sm text-muted">
          No open tasks. Add one above with <span className="text-ink">#{project.code.toLowerCase()}</span>.
        </p>
      ) : (
        <>
          {mine.length ? <ul className={`mt-3 ${cardList}`}>{mine.map(row)}</ul> : <p className="py-3 text-sm text-muted">Nothing left on your side.</p>}
          {waiting.length ? (
            <section aria-label="With QA and the client" className="mt-5">
              <h3 className="flex items-baseline gap-2 text-sm font-semibold text-muted">
                <span aria-hidden className="w-4 border-t-2 border-dashed border-muted" />
                With QA and the client
                <span className="tabular font-normal">{waiting.length}</span>
              </h3>
              <ul className={`mt-2 ${cardList}`}>{waiting.map(row)}</ul>
            </section>
          ) : null}
        </>
      )}
      {closed > 0 ? <p className="tabular mt-2 text-sm text-muted">{closed} closed</p> : null}
    </div>
  );
}
