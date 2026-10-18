import type { Project, Task } from "@/lib/db/schema";
import { priorityRank, stagesFor, type TaskType } from "@/lib/domain/stages";
import { cardList } from "./task-card";
import { TaskRow, type RowExtras } from "./task-row";

/** A project's open top-level tasks, most urgent first, then oldest. Subtasks live on their task's page; closed tasks are only counted. */
export function TaskList({ project, tasks, closed, today, extras = {} }: { project: Project; tasks: Task[]; closed: number; today: string; extras?: Record<string, RowExtras> }) {
  const shown = tasks.filter((t) => t.parentId == null).sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  return (
    <div>
      {shown.length === 0 ? (
        <p className="py-3 text-sm text-muted">
          No open tasks. Add one above with <span className="text-ink">#{project.code.toLowerCase()}</span>.
        </p>
      ) : (
        <ul className={`mt-3 ${cardList}`}>
          {shown.map((t) => (
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
          ))}
        </ul>
      )}
      {closed > 0 ? <p className="tabular mt-2 text-sm text-muted">{closed} closed</p> : null}
    </div>
  );
}
