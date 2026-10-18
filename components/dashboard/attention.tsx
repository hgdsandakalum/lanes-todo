import { formatShort } from "@/lib/domain/dates";
import { stageLabel, type TaskType } from "@/lib/domain/stages";
import { ProjectTag } from "@/components/tasks/project-tag";
import { aboveCard, CardLink, cardList, TaskCard } from "@/components/tasks/task-card";
import { InvoiceButton } from "./invoice-button";
import { Panel } from "./panel";

type Place = { id: string; title: string; type: string; kind: string | null; stage: string; projectCode: string; projectName: string; projectColor: string; workspaceSlug: string };

/** A list of loose ends, boxed, with its count in red. The dashboard only shows the ones that have any. */
function List({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <Panel title={title} aside={count} tone="danger">
      <ul className={cardList}>{children}</ul>
    </Panel>
  );
}

function TaskLine({ t, children }: { t: Place; children: React.ReactNode }) {
  return (
    <TaskCard color={t.projectColor} className="text-sm">
      <p className="flex items-baseline gap-2">
        <ProjectTag code={t.projectCode} color={t.projectColor} title={t.projectName} />
        <CardLink id={t.id} className="truncate font-medium">
          {t.title}
        </CardLink>
      </p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 text-muted">{children}</div>
    </TaskCard>
  );
}

export function Overdue({ tasks, today }: { tasks: (Place & { due: string | null })[]; today: string }) {
  return (
    <List title="Overdue" count={tasks.length}>
      {tasks.map((t) => (
        <TaskLine key={t.id} t={t}>
          <span className="text-danger">Was due {formatShort(t.due!, today)}</span>
          <span>{stageLabel(t.type as TaskType, t.stage, t.kind)}</span>
        </TaskLine>
      ))}
    </List>
  );
}

export function StuckInReview({ tasks }: { tasks: (Place & { waited: number })[] }) {
  return (
    <List title="Stuck in review" count={tasks.length}>
      {tasks.map((t) => (
        <TaskLine key={t.id} t={t}>
          <span>
            {stageLabel(t.type as TaskType, t.stage, t.kind)} for {t.waited} days
          </span>
        </TaskLine>
      ))}
    </List>
  );
}

export function Uninvoiced({ tasks, today }: { tasks: (Place & { delivered: string })[]; today: string }) {
  return (
    <List title="Delivered, not invoiced" count={tasks.length}>
      {tasks.map((t) => (
        <TaskLine key={t.id} t={t}>
          <span>Delivered {formatShort(t.delivered, today)}</span>
          <span className={aboveCard}>
            <InvoiceButton taskId={t.id} title={t.title} />
          </span>
        </TaskLine>
      ))}
    </List>
  );
}
