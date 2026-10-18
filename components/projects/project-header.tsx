"use client";
import { keepValues } from "@/components/projects/keep-values";
import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { moveProject, setProjectArchived, updateProject } from "@/lib/actions/projects";
import type { FormState } from "@/lib/actions/tasks";
import type { Project } from "@/lib/db/schema";
import { colorVar } from "@/lib/domain/palette";
import { editorUrl } from "@/lib/domain/folders";
import { repoLabel } from "@/lib/domain/repo";
import { ColorField, Field, inputCls, NameAndCode, primaryBtn, quietBtn } from "./fields";

// reorder arrows stay out of sight until the header is hovered or focused; touch screens always show them
const arrowBtn =
  "grid size-8 place-items-center rounded-sm text-muted hover:bg-sunk hover:text-ink disabled:pointer-events-none disabled:opacity-30 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100";

/** A project's heading row: code, name, release flow, repo, reorder arrows and its settings panel. */
/** `href` links the name to the project page; `order` shows the reorder arrows (workspace page only); `page` makes it the page's title. */
export function ProjectHeader({ project: p, href, order, page = false }: { project: Project; href?: string; order?: { first: boolean; last: boolean }; page?: boolean }) {
  const [open, setOpen] = useState(false);
  const [moving, startMove] = useTransition();
  const titleId = `project-${p.id}`;

  return (
    <div className={`group ${page ? "" : "border-b border-line pb-3"}`}>
      <div className={`grid items-center gap-x-4 gap-y-1 ${page ? "grid-cols-[auto_minmax(0,1fr)_auto]" : "grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[4.5rem_minmax(0,1fr)_auto]"}`}>
        <span
          className={`tabular flex w-fit items-center rounded-sm border bg-surface font-semibold ${page ? "h-11 border-2 px-3 text-base" : "h-8 px-2.5 text-sm"}`}
          style={{ borderColor: colorVar(p.color) }}
        >
          {p.code}
        </span>
        <h2 id={titleId} className={`min-w-0 truncate font-display font-extrabold tracking-tight ${page ? "text-4xl leading-tight md:text-5xl" : "text-xl"}`}>
          {href ? (
            <Link href={href} className="hover:underline hover:underline-offset-4">
              {p.name}
            </Link>
          ) : (
            p.name
          )}
        </h2>
        <div className="flex items-center gap-1">
          {order ? (
            <>
              <button type="button" aria-label={`Move ${p.name} up`} disabled={order.first || moving} onClick={() => startMove(() => moveProject(p.id, "up"))} className={arrowBtn}>
                <Arrow up />
              </button>
              <button type="button" aria-label={`Move ${p.name} down`} disabled={order.last || moving} onClick={() => startMove(() => moveProject(p.id, "down"))} className={arrowBtn}>
                <Arrow />
              </button>
            </>
          ) : null}
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`settings-${p.id}`}
            onClick={() => setOpen((v) => !v)}
            className="ml-1 rounded-sm px-2.5 py-1.5 text-sm text-muted hover:bg-sunk hover:text-ink aria-expanded:bg-sunk aria-expanded:text-ink"
          >
            Settings
          </button>
        </div>
        <p className="col-start-2 col-end-4 flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
          <span>
            {p.hasStaging ? "Dev, staging, then production" : "Dev, then production"}
            <span className="tabular"> · flags after {p.prodWaitDays} days</span>
          </span>
          {p.repo ? (
            <a href={p.repo} target="_blank" rel="noreferrer" className="tabular truncate underline decoration-line underline-offset-4 hover:text-ink">
              {repoLabel(p.repo)}
            </a>
          ) : null}
          {p.localPath ? (
            <a href={editorUrl(p.localPath)} title={p.localPath} className="underline decoration-line underline-offset-4 hover:text-ink">
              Open in Cursor
            </a>
          ) : null}
        </p>
      </div>
      {open ? <ProjectSettings project={p} onDone={() => setOpen(false)} /> : null}
    </div>
  );
}

function Arrow({ up = false }: { up?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`size-4 ${up ? "" : "rotate-180"}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square">
      <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
    </svg>
  );
}

function ProjectSettings({ project: p, onDone }: { project: Project; onDone: () => void }) {
  const [archiving, startArchive] = useTransition();
  const [state, action, pending] = useActionState(async (prev: FormState, form: FormData) => {
    const res = await updateProject(prev, form);
    if (!res?.error) onDone();
    return res;
  }, undefined);
  const id = (name: string) => `${name}-${p.id}`;

  return (
    <form id={`settings-${p.id}`} onSubmit={keepValues(action)} className="mt-3 grid gap-4 rounded-sm border border-line bg-surface p-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={p.id} />
      <NameAndCode idPrefix={id("p")} name={p.name} code={p.code} />
      <div className="sm:col-span-2">
        <ColorField value={p.color} />
      </div>
      <label className="flex items-start gap-3 text-sm sm:col-span-2">
        <input type="checkbox" name="hasStaging" defaultChecked={p.hasStaging} className="mt-0.5 size-4 accent-[var(--queen)]" />
        <span>
          <span className="font-medium">Staging</span>
          <span className="block text-muted">Code tasks pass through Staging between dev and production.</span>
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm sm:col-span-2">
        <input type="checkbox" name="billable" defaultChecked={p.billable} className="mt-0.5 size-4 accent-[var(--queen)]" />
        <span>
          <span className="font-medium">Billable</span>
          <span className="block text-muted">Finished work shows on the dashboard until it&apos;s marked invoiced.</span>
        </span>
      </label>
      <Field label="Production wait" id={id("wait")} hint="Code waiting longer than this for production gets flagged.">
        <div className="flex items-center gap-2">
          <input id={id("wait")} name="prodWaitDays" type="number" min={1} max={90} required defaultValue={p.prodWaitDays} className={`tabular w-24 ${inputCls}`} />
          <span className="text-sm text-muted">days</span>
        </div>
      </Field>
      <Field label="Repo" id={id("repo")} hint="GitHub, GitLab or Bitbucket get branch and pull request links. Empty to unlink.">
        <input id={id("repo")} name="repo" defaultValue={p.repo ?? ""} placeholder="softsora/gaku" autoComplete="off" spellCheck={false} className={inputCls} />
      </Field>
      <Field label="Folder on this computer" id={id("folder")} hint="Gives the project an Open in Cursor link, and lets the lanes command find it. In the repo, lanes link sets it for you.">
        <input id={id("folder")} name="localPath" defaultValue={p.localPath ?? ""} placeholder="/Users/you/Documents/otasuke" autoComplete="off" spellCheck={false} className={`tabular ${inputCls}`} />
      </Field>

      {state?.error ? (
        <p role="alert" className="text-sm text-danger sm:col-span-2">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <button disabled={pending} className={primaryBtn}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onDone} className={quietBtn}>
          Cancel
        </button>
        <button type="button" disabled={archiving} onClick={() => startArchive(() => setProjectArchived(p.id, true))} className={`ml-auto ${quietBtn}`}>
          {archiving ? "Archiving…" : "Archive project"}
        </button>
      </div>
      <p className="-mt-2 text-xs text-muted sm:col-span-2">Archiving hides the project and its tasks but keeps their history and XP. Delete it from the archived list.</p>
    </form>
  );
}
