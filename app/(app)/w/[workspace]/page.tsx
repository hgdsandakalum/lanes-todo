import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspaceBySlug } from "@/lib/data/shell";
import { getProjectTasks } from "@/lib/data/tasks";
import { rowExtras } from "@/lib/data/task";
import type { Project, Task } from "@/lib/db/schema";
import { colorVar } from "@/lib/domain/palette";
import { ymd } from "@/lib/domain/dates";
import { isOverdue, prodWait } from "@/lib/domain/due";
import { FINISHED_FOR_ME } from "@/lib/domain/stages";
import { Area, Stat } from "@/components/dashboard/panel";
import { AddProject } from "@/components/projects/add-project";
import { ArchivedProjects } from "@/components/projects/archived-projects";
import { ProjectHeader } from "@/components/projects/project-header";
import { TaskList } from "@/components/tasks/task-list";

export default function WorkspacePage({ params }: PageProps<"/w/[workspace]">) {
  return (
    <Suspense fallback={<div aria-hidden className="h-40 rounded-3xl bg-sunk/60" />}>
      <Workspace params={params} />
    </Suspense>
  );
}

/** One project's numbers: open work, how much is late, and code waiting for production. */
function tally(p: Project, tasks: Task[], today: string) {
  const active = tasks.filter((t) => !FINISHED_FOR_ME.has(t.stage) && t.parentId == null);
  const awaiting = tasks.filter((t) => t.type === "code" && t.devReleasedAt != null);
  return {
    open: active.length,
    started: active.filter((t) => t.stage !== "todo").length,
    overdue: active.filter((t) => isOverdue(t, today)).length,
    awaiting: awaiting.length,
    late: awaiting.filter((t) => prodWait(t, today, p.prodWaitDays).flag === "late").length,
    long: awaiting.filter((t) => prodWait(t, today, p.prodWaitDays).flag === "long").length,
  };
}

const sum = (list: ReturnType<typeof tally>[], key: keyof ReturnType<typeof tally>) => list.reduce((n, t) => n + t[key], 0);

async function Workspace({ params }: { params: PageProps<"/w/[workspace]">["params"] }) {
  const { workspace: slug } = await params;
  const ws = await getWorkspaceBySlug(slug);
  if (!ws) notFound();

  const active = ws.projects.filter((p) => p.status === "active");
  const archived = ws.projects.filter((p) => p.status === "archived");
  const { open, closed } = await getProjectTasks(active.map((p) => p.id));
  const today = ymd();
  const extras = await rowExtras(open.map((t) => t.id));
  const tasksOf = (p: Project) => open.filter((t) => t.projectId === p.id);
  const tallies = active.map((p) => tally(p, tasksOf(p), today));
  const [started, overdue, awaiting, late, long] = (["started", "overdue", "awaiting", "late", "long"] as const).map((k) => sum(tallies, k));

  return (
    <div className="flex flex-col gap-12" style={{ ["--c" as string]: colorVar(ws.color) }}>
      <header>
        <h1 className="flex items-center gap-3 font-display text-4xl font-extrabold leading-none tracking-tight md:text-5xl">
          <span aria-hidden className="size-3.5 shrink-0 bg-[var(--c)]" />
          {ws.name}
        </h1>
      </header>

      <section aria-label="Workspace at a glance" className="-mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Projects" value={active.length} note={archived.length ? `${archived.length} archived` : "All active"} />
        <Stat label="Open tasks" value={sum(tallies, "open")} note={started ? `${started} in progress` : "None started"} />
        <Stat label="Overdue" value={overdue} danger={overdue > 0} note={overdue ? "Past their due date" : "Nothing late"} />
        <Stat
          label="Waiting for production"
          value={awaiting}
          danger={late > 0}
          warn={long > 0}
          note={late ? `${late} past the client's date` : long ? `${long} over the wait limit` : awaiting ? "All within the limit" : "All shipped"}
        />
      </section>

      <Area id="projects" title="Projects">
        {active.length === 0 ? (
          <p className="text-muted">No active projects in {ws.name}.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {active.map((p, i) => {
              const href = `/w/${ws.slug}/${p.code.toLowerCase()}`;
              return (
                <section key={p.id} aria-labelledby={`project-${p.id}`} className="rounded-sm border border-line p-3 sm:p-5">
                  <ProjectHeader project={p} href={href} order={{ first: i === 0, last: i === active.length - 1 }} />
                  <Counts {...tallies[i]} href={href} />
                  <TaskList project={p} tasks={tasksOf(p)} closed={closed[p.id] ?? 0} today={today} extras={extras} />
                </section>
              );
            })}
          </div>
        )}
      </Area>

      <div className="flex flex-col gap-10">
        <AddProject workspaceId={ws.id} workspaceName={ws.name} />
        <ArchivedProjects projects={archived} />
      </div>
    </div>
  );
}

const chip = "tabular rounded-full border px-2.5 py-0.5";

/** A project's numbers as small chips; only what's worth seeing shows. */
function Counts({ open, overdue, awaiting, late, long, href }: ReturnType<typeof tally> & { href: string }) {
  if (!open && !awaiting) return null;
  return (
    <p className="mt-3 flex flex-wrap gap-2 text-xs">
      {open ? <span className={`${chip} border-line text-muted`}>{open} open</span> : null}
      {overdue ? <span className={`${chip} border-danger/50 font-semibold text-danger`}>{overdue} overdue</span> : null}
      {awaiting ? (
        <Link
          href={`${href}#awaiting`}
          className={`${chip} hover:border-ink ${late ? "border-danger/50 font-semibold text-danger" : long ? "border-warn/50 font-semibold text-warn" : "border-line text-ink"}`}
        >
          {awaiting} waiting for production
        </Link>
      ) : null}
    </p>
  );
}
