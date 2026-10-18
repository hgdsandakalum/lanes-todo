import Link from "next/link";
import type { TodayTask } from "@/lib/data/today";
import { ProjectTag } from "@/components/tasks/project-tag";
import { aboveCard, CardLink, cardList, TaskCard } from "@/components/tasks/task-card";
import { Panel } from "./panel";

type Waiting = TodayTask & { waited: number; flagged: boolean };

const ago = (days: number) => (days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`);

/**
 * Code that's finished in dev or staging but not yet in production, closest to production first.
 * Each card links to its project's release form, where it ships. Hidden when nothing is waiting.
 */
export function NotInProduction({ tasks }: { tasks: Waiting[] }) {
  const groups = [
    { key: "staging", label: "In staging", items: tasks.filter((t) => t.stage === "staging") },
    { key: "dev_released", label: "Dev released", items: tasks.filter((t) => t.stage === "dev_released") },
  ].filter((g) => g.items.length);
  const flagged = tasks.filter((t) => t.flagged).length;
  const projects = new Set(tasks.map((t) => t.projectCode)).size;

  if (!tasks.length) return null;
  return (
    <Panel
      title="Not in production yet"
      aside={
        <>
          {tasks.length} in {projects} {projects === 1 ? "project" : "projects"}
          {flagged ? <span className="font-semibold text-danger"> · {flagged} over the limit</span> : null}
        </>
      }
      className="lg:col-span-full"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g.key}>
            <h4 className="mb-2 flex items-baseline justify-between text-sm text-muted">
              {g.label}
              <span className="tabular">{g.items.length}</span>
            </h4>
            <ul className={cardList}>
              {g.items.map((t) => (
                <TaskCard key={t.id} color={t.projectColor} className="text-sm">
                  <p className="flex items-baseline gap-2">
                    <ProjectTag code={t.projectCode} color={t.projectColor} title={t.projectName} />
                    <CardLink id={t.id} className="truncate font-medium">
                      {t.title}
                    </CardLink>
                  </p>
                  <p className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className={`tabular ${t.flagged ? "text-danger" : "text-muted"}`}>
                      Dev released {ago(t.waited)}
                      {t.flagged ? `, over the ${t.prodWaitDays}-day limit` : ""}
                    </span>
                    <Link
                      href={`/w/${t.workspaceSlug}/${t.projectCode.toLowerCase()}#awaiting`}
                      className={`${aboveCard} text-muted underline decoration-line underline-offset-4 hover:text-ink`}
                    >
                      Release
                    </Link>
                  </p>
                </TaskCard>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  );
}
