import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getProjectPage } from "@/lib/data/project";
import { rowExtras } from "@/lib/data/task";
import { formatShort, ymd } from "@/lib/domain/dates";
import { FINISHED_FOR_ME, TASK_TYPES, type TaskType } from "@/lib/domain/stages";
import { Area, Panel, Stat } from "@/components/dashboard/panel";
import { ProjectHeader } from "@/components/projects/project-header";
import { TaskList } from "@/components/tasks/task-list";
import { Boards } from "@/components/project/board";
import { ReleaseHistory } from "@/components/project/release-history";
import { ShipRelease } from "@/components/project/ship-release";
import { ViewSwitch, type TypeFilter, type View } from "@/components/project/view-switch";

type Props = PageProps<"/w/[workspace]/[project]">;

export default function ProjectPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<div aria-hidden className="h-40 rounded-3xl bg-sunk/60" />}>
      <ProjectView params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectView({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  await connection(); // "today" reads the clock, so this renders per request
  const [{ workspace: slug, project: code }, query] = await Promise.all([params, searchParams]);
  const today = ymd();
  const data = await getProjectPage(slug, code, today);
  if (!data) notFound();
  const { project: p, workspace: ws } = data;
  const extras = await rowExtras(data.open.map((t) => t.id));

  const view: View = query.view === "board" ? "board" : "list";
  const type: TypeFilter = TASK_TYPES.includes(query.type as TaskType) ? (query.type as TaskType) : "all";
  const ofType = <T extends { type: string }>(list: T[]) => (type === "all" ? list : list.filter((t) => t.type === type));
  const counts = Object.fromEntries([["all", data.open.length], ...TASK_TYPES.map((t) => [t, data.open.filter((x) => x.type === t).length])]) as Record<TypeFilter, number>;
  const showCode = type === "all" || type === "code";
  const active = data.open.filter((t) => !FINISHED_FOR_ME.has(t.stage) && t.parentId == null);
  const started = active.filter((t) => t.stage !== "todo").length;
  const overdue = active.filter((t) => t.due != null && t.due < today).length;
  const flagged = data.awaiting.filter((t) => t.flagged).length;
  const last = data.releases[0];
  const codeProject = data.open.some((t) => t.type === "code") || data.awaiting.length > 0 || data.releases.length > 0;

  return (
    <div className="flex flex-col gap-12">
      <div>
        <p className="mb-3 text-sm text-muted">
          <Link href={`/w/${ws.slug}`} className="inline-block py-1.5 underline decoration-line underline-offset-4 hover:text-ink">
            {ws.name}
          </Link>
        </p>
        <ProjectHeader project={p} page />
        {p.status === "archived" ? <p className="mt-3 text-sm text-danger">This project is archived. Restore it from {ws.name} to add tasks.</p> : null}
      </div>

      <section aria-label="Project at a glance" className="-mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open tasks" value={active.length} note={started ? `${started} in progress` : "None started"} />
        <Stat label="Overdue" value={overdue} danger={overdue > 0} note={overdue ? "Past their due date" : "Nothing late"} />
        <Stat label="Waiting for production" value={data.awaiting.length} danger={flagged > 0} note={flagged ? `${flagged} over the ${p.prodWaitDays}-day limit` : `Flags after ${p.prodWaitDays} days`} />
        <Stat label="Releases" value={data.releases.length} note={last ? `Last: ${last.name}, ${formatShort(ymd(last.releasedAt), today)}` : `${data.closedCount} ${data.closedCount === 1 ? "task" : "tasks"} closed`} />
      </section>

      <Area id="tasks" title="Tasks" note={<ViewSwitch base={`/w/${ws.slug}/${p.code.toLowerCase()}`} view={view} type={type} counts={counts} />}>
        {view === "board" ? (
          <Boards project={p} tasks={ofType([...data.open, ...data.recentlyClosed])} types={type === "all" ? TASK_TYPES : [type]} today={today} />
        ) : (
          <TaskList project={p} tasks={ofType(data.open)} closed={data.closedCount} today={today} extras={extras} />
        )}
      </Area>

      {showCode && codeProject ? (
        <Area id="release" title="Release">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Ready to ship" aside={data.awaiting.length ? `${data.awaiting.length} waiting` : undefined} tone={flagged ? "danger" : undefined}>
              <div id="awaiting" className="scroll-mt-6">
                {data.awaiting.length ? (
                  <ShipRelease key={data.awaiting.map((t) => t.id).join()} projectId={p.id} tasks={data.awaiting} today={today} waitDays={p.prodWaitDays} />
                ) : (
                  <p className="text-sm text-muted">Nothing waiting. Code you dev release shows up here, ready to ship to production.</p>
                )}
              </div>
            </Panel>
            <Panel title="Release history" aside={data.releases.length ? `${data.releases.length}` : undefined}>
              <ReleaseHistory releases={data.releases} today={today} />
            </Panel>
          </div>
        </Area>
      ) : null}
    </div>
  );
}
