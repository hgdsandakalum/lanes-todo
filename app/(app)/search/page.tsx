import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { search } from "@/lib/data/search";
import { stageLabel, type TaskType } from "@/lib/domain/stages";
import { KindIcon } from "@/components/tasks/kind-icon";
import { ProjectTag } from "@/components/tasks/project-tag";
import { SearchBox } from "@/components/search/search-box";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Search</h1>
      <Suspense fallback={<SearchBox defaultValue="" />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const hits = await search(query);
  return (
    <>
      <SearchBox defaultValue={query} />
      {query.trim().length < 2 ? (
        <p className="text-muted">Search task titles, notes, acceptance criteria, repro steps, checklists, labels, branches, tickets, PRs and commits, projects, releases and end-of-day notes.</p>
      ) : hits.length === 0 ? (
        <p className="text-muted">Nothing matches &ldquo;{query}&rdquo;.</p>
      ) : (
        <>
          <p className="tabular text-sm text-muted">
            {hits.length} {hits.length === 1 ? "result" : "results"}
          </p>
          <ul className="flex flex-col divide-y divide-line/70">
            {hits.map((h) => (
              <li key={`${h.kind}:${h.id}`} className="py-3">
                <p className="flex items-center gap-2">
                  {h.meta.type ? <KindIcon type={h.meta.type as TaskType} kind={h.meta.taskKind} className="size-4 text-muted" /> : null}
                  {h.meta.projectCode ? <ProjectTag code={h.meta.projectCode} color={h.meta.projectColor!} /> : null}
                  {h.href ? (
                    <Link href={h.href} className={`min-w-0 truncate font-medium hover:underline ${h.meta.closed ? "text-muted" : ""}`}>
                      {h.title}
                    </Link>
                  ) : (
                    <span className="min-w-0 truncate font-medium">{h.title}</span>
                  )}
                </p>
                <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted">
                  <span>{h.kind === "project" ? `Project in ${h.where}` : h.where}</span>
                  {h.meta.stage ? <span>{stageLabel(h.meta.type as TaskType, h.meta.stage, h.meta.taskKind)}</span> : null}
                </p>
                {h.snippet ? <p className="mt-1 text-sm">{h.snippet}</p> : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
