import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTaskPage } from "@/lib/data/task";
import { formatShort, localInput, ymd } from "@/lib/domain/dates";
import { formatMinutes } from "@/lib/domain/estimate";
import { editorUrl } from "@/lib/domain/folders";
import { describeRecur } from "@/lib/domain/recur";
import { codeKind, FIELD_LABEL, FINISHED_FOR_ME, KIND_FIELDS, stagesFor, taskKindLabel, type Priority, type TaskType } from "@/lib/domain/stages";
import { KindIcon } from "@/components/tasks/kind-icon";
import { TaskMarkdown } from "@/components/tasks/markdown";
import { ProjectTag } from "@/components/tasks/project-tag";
import { StageSelect } from "@/components/tasks/stage-select";
import { TaskLinks } from "@/components/tasks/task-links";
import { TaskEditor } from "@/components/task/editor";
import { Checklist, Dependencies, Labels, References, Subtasks, TimeSection } from "@/components/task/sections";
import { PriorityMark } from "@/components/tasks/priority";

export default function TaskPage({ params }: PageProps<"/t/[task]">) {
  return (
    <Suspense fallback={<div aria-hidden className="h-60 rounded-3xl bg-sunk/60" />}>
      <TaskView params={params} />
    </Suspense>
  );
}

async function TaskView({ params }: { params: PageProps<"/t/[task]">["params"] }) {
  await connection();
  const { task: id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getTaskPage(`t_${id.toLowerCase()}`);
  if (!data) notFound();
  const { task: t, project: p, workspace: ws } = data;
  const today = ymd();
  const type = t.type as TaskType;
  const kind = codeKind(type, t.kind);
  const projectHref = `/w/${ws.slug}/${p.code.toLowerCase()}`;
  const running = data.time.find((e) => e.endedAt == null) ?? null;
  const context = (kind ? KIND_FIELDS[kind] : []).filter((f) => t[f]);
  const finished = FINISHED_FOR_ME.has(t.stage);
  const waitingOn = data.blockedBy.filter((d) => !FINISHED_FOR_ME.has(d.stage));

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="mb-3 flex flex-wrap items-center gap-x-2 text-sm text-muted">
          <Link href={`/w/${ws.slug}`} className="py-1.5 underline decoration-line underline-offset-4 hover:text-ink">
            {ws.name}
          </Link>
          <span aria-hidden>/</span>
          <Link href={projectHref} className="py-1.5 underline decoration-line underline-offset-4 hover:text-ink">
            {p.name}
          </Link>
          {data.parent ? (
            <>
              <span aria-hidden>/</span>
              <Link href={`/t/${data.parent.id.replace(/^t_/, "")}`} className="min-w-0 truncate py-1.5 underline decoration-line underline-offset-4 hover:text-ink">
                {data.parent.title}
              </Link>
            </>
          ) : null}
        </p>

        <div className="flex items-start gap-3">
          <KindIcon type={type} kind={t.kind} className="mt-2 size-6 text-muted" />
          <h1 className={`min-w-0 font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl ${finished ? "text-muted" : ""}`}>{t.title}</h1>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <StageSelect taskId={t.id} title={t.title} stage={t.stage} stages={stagesFor(type, p.hasStaging, t.kind)} className="-ml-1.5" />
          <ProjectTag code={p.code} color={p.color} title={p.name} />
          <span>{taskKindLabel(type, t.kind)}</span>
          {t.priority ? <PriorityMark priority={t.priority as Priority} withLabel /> : null}
          {t.due ? <span className={t.due < today && !finished ? "text-danger" : undefined}>Due {formatShort(t.due, today)}</span> : null}
          {t.estimateMin ? <span className="tabular">Estimate {formatMinutes(t.estimateMin)}</span> : null}
          {t.recur ? <span>{describeRecur(t.recur)}</span> : null}
          {t.remindAt ? <span title="Reminders arrive on your phone once Lanes is deployed">Reminder {localInput(t.remindAt).replace("T", " ")}</span> : null}
          {t.ticket ? <span className="tabular">{t.ticket}</span> : null}
          <TaskLinks branch={t.branch} link={t.link} repo={p.repo} shipped={t.closedAt != null} />
          {p.localPath && !finished ? (
            <a href={editorUrl(p.localPath)} title={p.localPath} className="underline decoration-line underline-offset-4 hover:text-ink">
              Open in Cursor
            </a>
          ) : null}
        </div>
        <div className="mt-3">
          <Labels taskId={t.id} labels={data.labels} all={data.allLabels} />
        </div>
        {t.blocker || waitingOn.length ? (
          <p className="mt-4 border-l-2 border-danger pl-3 text-sm">
            <span className="font-medium text-danger">Blocked. </span>
            {t.blocker}
            {t.blocker && waitingOn.length ? " " : ""}
            {waitingOn.length ? `Waiting on ${waitingOn.map((d) => d.title).join(", ")}.` : ""}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-12">
        <div className="flex min-w-0 flex-col gap-10">
          {t.description || context.length ? (
            <section aria-label="Notes" className="flex flex-col gap-6">
              {t.description ? <TaskMarkdown text={t.description} /> : null}
              {context.map((f) => (
                <div key={f}>
                  <h2 className="mb-2 font-display text-lg font-extrabold tracking-tight">{FIELD_LABEL[f]}</h2>
                  <TaskMarkdown text={t[f]!} />
                </div>
              ))}
            </section>
          ) : null}
          <Checklist taskId={t.id} items={data.checklist} templates={data.templates.map((x) => ({ id: x.id, name: x.name, count: x.checklist.length }))} />
          <Subtasks
            taskId={t.id}
            subtasks={data.subtasks}
            stagesOf={Object.fromEntries(data.subtasks.map((st) => [st.id, stagesFor(st.type as TaskType, p.hasStaging, st.kind)]))}
            canHave={t.parentId == null}
          />
          <References taskId={t.id} refs={data.refs} repo={p.repo} />
          <details className="group border-t border-line pt-5">
            <summary className="w-fit cursor-pointer list-none font-display text-lg font-extrabold tracking-tight [&::-webkit-details-marker]:hidden">
              Edit task <span aria-hidden className="ml-1 inline-block font-sans text-sm font-normal text-muted transition-transform group-open:rotate-90">›</span>
            </summary>
            <div className="mt-4">
              <TaskEditor task={t} hasStaging={p.hasStaging} remindAt={t.remindAt ? localInput(t.remindAt) : ""} backHref={projectHref} />
            </div>
          </details>
        </div>

        <aside className="flex flex-col gap-10 lg:border-l lg:border-line lg:pl-8" aria-label="Time and dependencies">
          <TimeSection taskId={t.id} estimate={t.estimateMin} entries={data.time} runningHere={running?.startedAt ?? null} runningElsewhere={null} />
          <Dependencies taskId={t.id} blockedBy={data.blockedBy} blocks={data.blocks} candidates={data.candidates} />
        </aside>
      </div>
    </div>
  );
}
