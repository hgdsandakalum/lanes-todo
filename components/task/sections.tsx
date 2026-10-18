"use client";
import Link from "next/link";
import { useActionState, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { inputCls, quietBtn } from "@/components/projects/fields";
import { announceXp } from "@/components/game/xp-pulse";
import { KindIcon } from "@/components/tasks/kind-icon";
import { StageSelect } from "@/components/tasks/stage-select";
import {
  addChecklistItems,
  addDependency,
  addRef,
  addSubtask,
  deleteChecklistItem,
  deleteRef,
  logTime,
  removeDependency,
  setChecklistItem,
  setTaskLabels,
  startTimer,
  stopTimer,
} from "@/lib/actions/task-detail";
import type { FormState } from "@/lib/actions/tasks";
import { applyTemplate } from "@/lib/actions/templates";
import { formatMinutes, parseDuration } from "@/lib/domain/estimate";
import { colorVar } from "@/lib/domain/palette";
import { FINISHED_FOR_ME, stageLabel, type Stage, type TaskType } from "@/lib/domain/stages";
import type { ChecklistItem, TaskRef } from "@/lib/db/schema";

const smallBtn = "rounded-sm border border-line px-3 py-1.5 text-sm hover:border-ink disabled:opacity-60";
const linkCls = "underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink";

function Heading({ id, children, aside }: { id: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 id={id} className="font-display text-lg font-extrabold tracking-tight">
        {children}
      </h2>
      {aside ? <span className="tabular text-sm text-muted">{aside}</span> : null}
    </div>
  );
}

function ErrorLine({ state }: { state: FormState }) {
  return state?.error ? (
    <p role="alert" className="mt-2 text-sm text-danger">
      {state.error}
    </p>
  ) : null;
}

/** A one-line add form that clears itself after a save. */
function AddLine({ label, placeholder, submit, multiline = false }: { label: string; placeholder: string; submit: (text: string) => Promise<FormState>; multiline?: boolean }) {
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const [state, action, pending] = useActionState(async (_: FormState, text: string) => {
    const res = await submit(text);
    if (!res?.error && ref.current) ref.current.value = "";
    return res;
  }, undefined);
  const [, start] = useTransition();
  const send = () => start(() => action(ref.current?.value ?? ""));
  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={`add-${label}`}>
          {label}
        </label>
        {multiline ? (
          <textarea
            ref={ref}
            id={`add-${label}`}
            rows={1}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            className={`${inputCls} field-sizing-content resize-none`}
          />
        ) : (
          <input ref={ref} id={`add-${label}`} placeholder={placeholder} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), send())} className={inputCls} />
        )}
        <button type="button" disabled={pending} onClick={send} className={smallBtn}>
          Add
        </button>
      </div>
      <ErrorLine state={state} />
    </div>
  );
}

// ---- checklist

export function Checklist({ taskId, items, templates }: { taskId: string; items: ChecklistItem[]; templates: { id: string; name: string; count: number }[] }) {
  const done = items.filter((i) => i.doneAt).length;
  const [tplState, applyTpl, applying] = useActionState((_: FormState, id: string) => applyTemplate(taskId, id), undefined);
  const [, startTpl] = useTransition();
  return (
    <section aria-labelledby="checklist">
      <Heading id="checklist" aside={items.length ? `${done} of ${items.length}` : undefined}>
        Checklist
      </Heading>
      {items.length ? (
        <ul className="flex flex-col">
          {items.map((i) => (
            <CheckRow key={i.id} item={i} />
          ))}
        </ul>
      ) : null}
      <AddLine label="New checklist item" placeholder="Add an item (Shift+Enter for several)" submit={(t) => addChecklistItems(taskId, t)} multiline />
      {templates.length ? (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <label htmlFor="tpl-pick" className="sr-only">
            Add from a template
          </label>
          <select
            id="tpl-pick"
            value=""
            disabled={applying}
            onChange={(e) => {
              const id = e.target.value;
              if (id) startTpl(() => applyTpl(id));
            }}
            className="cursor-pointer rounded-sm border border-transparent bg-transparent px-1 py-1 text-sm text-muted hover:border-line hover:text-ink"
          >
            <option value="">Add from a template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.count})
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <ErrorLine state={tplState} />
    </section>
  );
}

function CheckRow({ item }: { item: ChecklistItem }) {
  const [checked, setChecked] = useOptimistic(item.doneAt != null);
  const [, start] = useTransition();
  return (
    <li className="group flex items-start gap-3 py-1.5">
      <input
        type="checkbox"
        id={`ci-${item.id}`}
        checked={checked}
        onChange={(e) => {
          const next = e.target.checked;
          start(async () => {
            setChecked(next);
            announceXp(await setChecklistItem(item.id, next));
          });
        }}
        className="mt-1 size-4 shrink-0 accent-[var(--queen)]"
      />
      <label htmlFor={`ci-${item.id}`} className={`min-w-0 flex-1 text-sm leading-6 ${checked ? "text-muted line-through" : ""}`}>
        {item.text}
      </label>
      <button
        type="button"
        onClick={() => start(() => deleteChecklistItem(item.id))}
        aria-label={`Remove ${item.text}`}
        className="rounded-sm px-1.5 text-sm text-muted opacity-60 hover:text-danger group-hover:opacity-100 focus:opacity-100"
      >
        ×
      </button>
    </li>
  );
}

// ---- subtasks

type Sub = { id: string; title: string; type: string; kind: string | null; stage: string };

export function Subtasks({ taskId, subtasks, stagesOf, canHave }: { taskId: string; subtasks: Sub[]; stagesOf: Record<string, Stage[]>; canHave: boolean }) {
  const done = subtasks.filter((t) => FINISHED_FOR_ME.has(t.stage)).length;
  if (!canHave) return null;
  return (
    <section aria-labelledby="subtasks">
      <Heading id="subtasks" aside={subtasks.length ? `${done} of ${subtasks.length}` : undefined}>
        Subtasks
      </Heading>
      {subtasks.length ? (
        <ul className="flex flex-col divide-y divide-line/70">
          {subtasks.map((t) => (
            <li key={t.id} className="grid grid-cols-[auto_minmax(0,1fr)_9rem] items-center gap-3 py-2">
              <KindIcon type={t.type as TaskType} kind={t.kind} className="size-4 text-muted" />
              <Link href={`/t/${t.id.replace(/^t_/, "")}`} className={`truncate text-sm ${FINISHED_FOR_ME.has(t.stage) ? "text-muted line-through" : ""} hover:underline`}>
                {t.title}
              </Link>
              <StageSelect taskId={t.id} title={t.title} stage={t.stage} stages={stagesOf[t.id]} />
            </li>
          ))}
        </ul>
      ) : null}
      <AddLine label="New subtask" placeholder="Add a subtask (quick-add shortcuts work)" submit={(t) => addSubtask(taskId, t)} />
    </section>
  );
}

// ---- labels

export function Labels({ taskId, labels, all }: { taskId: string; labels: { name: string; color: string }[]; all: { name: string }[] }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(async (_: FormState, text: string) => {
    const res = await setTaskLabels(taskId, text);
    if (!res?.error) setEditing(false);
    return res;
  }, undefined);
  const [, start] = useTransition();
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!editing ? (
        <>
          {labels.map((l) => (
            <LabelChip key={l.name} {...l} />
          ))}
          <button type="button" onClick={() => setEditing(true)} className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink">
            {labels.length ? "Edit labels" : "Add labels"}
          </button>
        </>
      ) : (
        <div className="w-full">
          <div className="flex gap-2">
            <label htmlFor="labels-input" className="sr-only">
              Labels, separated by spaces
            </label>
            <input
              ref={ref}
              id="labels-input"
              list="label-names"
              autoFocus
              defaultValue={labels.map((l) => l.name).join(" ")}
              placeholder="backend auth mobile"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), start(() => action(ref.current!.value)))}
              className={inputCls}
            />
            <datalist id="label-names">
              {all.map((l) => (
                <option key={l.name} value={l.name} />
              ))}
            </datalist>
            <button type="button" disabled={pending} onClick={() => start(() => action(ref.current!.value))} className={smallBtn}>
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className={quietBtn}>
              Cancel
            </button>
          </div>
          <ErrorLine state={state} />
        </div>
      )}
    </div>
  );
}

export function LabelChip({ name, color }: { name: string; color: string }) {
  return (
    <span className="rounded-sm border px-1.5 text-xs leading-5 text-ink" style={{ borderColor: colorVar(color) }}>
      {name}
    </span>
  );
}

// ---- references

const REF_LABEL: Record<TaskRef["kind"], string> = { pr: "Pull request", issue: "Issue", commit: "Commit", link: "Link" };

/** Where a reference points: full URLs as they are; #12 and SHAs against the project's repo (GitHub, GitLab, Bitbucket shapes). */
function refHref(ref: TaskRef, repo: string | null): string | null {
  if (ref.ref.startsWith("http")) return ref.ref;
  if (!repo) return null;
  const host = new URL(repo).host;
  const n = ref.ref.replace("#", "");
  if (ref.kind === "commit") return host.includes("gitlab") ? `${repo}/-/commit/${n}` : host === "bitbucket.org" ? `${repo}/commits/${n}` : `${repo}/commit/${n}`;
  if (ref.kind === "pr") return host.includes("gitlab") ? `${repo}/-/merge_requests/${n}` : host === "bitbucket.org" ? `${repo}/pull-requests/${n}` : `${repo}/pull/${n}`;
  return host.includes("gitlab") ? `${repo}/-/issues/${n}` : `${repo}/issues/${n}`;
}

/** A short name for a reference: "#12", a 7-character SHA, or the URL's tail. */
function refName(ref: TaskRef) {
  if (!ref.ref.startsWith("http")) return ref.kind === "commit" ? ref.ref.slice(0, 7) : ref.ref;
  const u = new URL(ref.ref);
  const m = u.pathname.match(/\/(?:pull|merge_requests|pull-requests|issues)\/(\d+)/) ?? u.pathname.match(/\/commits?\/([0-9a-f]{7})/);
  return m ? (ref.kind === "commit" ? m[1] : `#${m[1]}`) : `${u.host}${u.pathname}`.replace(/\/$/, "");
}

export function References({ taskId, refs, repo }: { taskId: string; refs: TaskRef[]; repo: string | null }) {
  const [kind, setKind] = useState<TaskRef["kind"]>("pr");
  const [state, action, pending] = useActionState(async (_: FormState, form: FormData) => {
    const res = await addRef(taskId, kind, String(form.get("ref") ?? ""), String(form.get("title") ?? ""));
    return res;
  }, undefined);
  const [, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    if (state?.saved) formRef.current?.reset();
  }, [state]);
  return (
    <section aria-labelledby="refs">
      <Heading id="refs">Pull requests &amp; commits</Heading>
      {refs.length ? (
        <ul className="flex flex-col gap-1.5">
          {refs.map((r) => {
            const href = refHref(r, repo);
            return (
              <li key={r.id} className="group flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="w-24 shrink-0 text-muted">{REF_LABEL[r.kind]}</span>
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer" className={`tabular ${linkCls}`}>
                    {refName(r)}
                  </a>
                ) : (
                  <span className="tabular">{refName(r)}</span>
                )}
                {r.title ? <span className="min-w-0 truncate text-muted">{r.title}</span> : null}
                <button
                  type="button"
                  onClick={() => start(() => deleteRef(r.id))}
                  aria-label={`Remove ${refName(r)}`}
                  className="ml-auto px-1.5 text-muted opacity-60 hover:text-danger group-hover:opacity-100 focus:opacity-100"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {/* The add form opens on request: four fields are a lot to show on every task. */}
      {!adding ? (
        <button type="button" onClick={() => setAdding(true)} className={`${refs.length ? "mt-3" : ""} text-sm text-muted ${linkCls}`}>
          Add a PR, issue, commit or link
        </button>
      ) : (
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            start(() => action(f));
          }}
          className="mt-3 grid grid-cols-[8.5rem_minmax(0,1fr)] gap-2 sm:grid-cols-[8.5rem_minmax(0,1fr)_minmax(0,1fr)_auto]"
        >
          <label htmlFor="ref-kind" className="sr-only">
            Kind of reference
          </label>
          <select id="ref-kind" value={kind} onChange={(e) => setKind(e.target.value as TaskRef["kind"])} className={inputCls}>
            {Object.entries(REF_LABEL).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
          <label htmlFor="ref-value" className="sr-only">
            URL, #number or SHA
          </label>
          <input
            id="ref-value"
            name="ref"
            required
            autoFocus
            placeholder={kind === "commit" ? (repo ? "SHA or URL" : "URL") : kind === "link" ? "https://" : repo ? "#12 or URL" : "URL"}
            spellCheck={false}
            className={`tabular ${inputCls}`}
          />
          <label htmlFor="ref-title" className="sr-only">
            Title (optional)
          </label>
          <input id="ref-title" name="title" placeholder="Title (optional)" maxLength={200} className={`col-span-2 sm:col-span-1 ${inputCls}`} />
          <button disabled={pending} className={`col-span-2 sm:col-span-1 ${smallBtn}`}>
            Add
          </button>
        </form>
      )}
      <ErrorLine state={state} />
    </section>
  );
}

// ---- dependencies

type Dep = { id: string; title: string; stage: string; type: string; kind: string | null };

export function Dependencies({
  taskId,
  blockedBy,
  blocks,
  candidates,
}: {
  taskId: string;
  blockedBy: Dep[];
  blocks: Dep[];
  candidates: { id: string; title: string; projectCode: string }[];
}) {
  const [state, action, pending] = useActionState((_: FormState, id: string) => addDependency(taskId, id), undefined);
  const [, start] = useTransition();
  const [pick, setPick] = useState("");
  const open = blockedBy.filter((d) => !FINISHED_FOR_ME.has(d.stage));
  return (
    <section aria-labelledby="deps">
      <Heading id="deps" aside={open.length ? `waiting on ${open.length}` : undefined}>
        Dependencies
      </Heading>
      {blockedBy.length ? (
        <>
          <h3 className="text-sm font-medium">Waits on</h3>
          <ul className="mb-3 mt-1 flex flex-col gap-1">
            {blockedBy.map((d) => (
              <li key={d.id} className="group flex items-baseline gap-2 text-sm">
                <DepLink dep={d} />
                <button
                  type="button"
                  onClick={() => start(() => removeDependency(taskId, d.id))}
                  aria-label={`Stop waiting on ${d.title}`}
                  className="ml-auto px-1.5 text-muted opacity-60 hover:text-danger group-hover:opacity-100 focus:opacity-100"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {blocks.length ? (
        <>
          <h3 className="text-sm font-medium">Holds up</h3>
          <ul className="mb-3 mt-1 flex flex-col gap-1">
            {blocks.map((d) => (
              <li key={d.id} className="text-sm">
                <DepLink dep={d} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <div className="mt-2 flex gap-2">
        <label htmlFor="dep-pick" className="sr-only">
          A task this one waits on
        </label>
        <select id="dep-pick" value={pick} onChange={(e) => setPick(e.target.value)} className={`w-0 flex-1 ${inputCls}`}>
          <option value="">Waits on…</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.projectCode} · {c.title}
            </option>
          ))}
        </select>
        <button type="button" disabled={pending || !pick} onClick={() => start(() => action(pick))} className={smallBtn}>
          Add
        </button>
      </div>
      <ErrorLine state={state} />
    </section>
  );
}

function DepLink({ dep }: { dep: Dep }) {
  const done = FINISHED_FOR_ME.has(dep.stage);
  return (
    <>
      <Link href={`/t/${dep.id.replace(/^t_/, "")}`} className={`min-w-0 truncate ${done ? "text-muted line-through" : ""} hover:underline`}>
        {dep.title}
      </Link>
      <span className="shrink-0 text-muted">{stageLabel(dep.type as TaskType, dep.stage, dep.kind)}</span>
    </>
  );
}

// ---- time

export function TimeSection({
  taskId,
  estimate,
  entries,
  runningHere,
  runningElsewhere,
}: {
  taskId: string;
  estimate: number | null;
  entries: { startedAt: Date; endedAt: Date | null }[];
  runningHere: Date | null;
  runningElsewhere: string | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!runningHere) return;
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, [runningHere]);
  const spent = entries.reduce((n, e) => n + Math.max(0, ((e.endedAt?.getTime() ?? now) - e.startedAt.getTime()) / 6e4), 0);
  const [pending, start] = useTransition();
  const [state, action] = useActionState(async (_: FormState, text: string) => {
    const min = parseDuration(text);
    return min == null ? { error: "Log time like 30m, 1h or 1h30m." } : logTime(taskId, min);
  }, undefined);
  const over = estimate != null && spent > estimate;
  return (
    <section aria-labelledby="time">
      <Heading id="time">Time</Heading>
      <p className="tabular text-2xl font-semibold">
        {formatMinutes(spent)}
        <span className="text-base font-normal text-muted"> {estimate != null ? `of ${formatMinutes(estimate)} estimated` : "spent"}</span>
      </p>
      {estimate != null ? (
        <div className="mt-2 h-1.5 w-full bg-sunk" aria-hidden>
          <div className={`h-full ${over ? "bg-danger" : "bg-queen"}`} style={{ width: `${Math.min(100, (spent / estimate) * 100)}%` }} />
        </div>
      ) : null}
      {over ? <p className="mt-1 text-sm text-danger">{formatMinutes(spent - estimate!)} over the estimate.</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {runningHere ? (
          <button type="button" disabled={pending} onClick={() => start(() => stopTimer())} className={`${smallBtn} border-queen text-queen`}>
            Stop timer
          </button>
        ) : (
          <button type="button" disabled={pending} onClick={() => start(() => startTimer(taskId))} className={smallBtn}>
            Start timer
          </button>
        )}
        <LogTime onLog={(t) => start(() => action(t))} />
      </div>
      {runningElsewhere && !runningHere ? <p className="mt-2 text-sm text-muted">Starting this stops the timer on {runningElsewhere}.</p> : null}
      <ErrorLine state={state} />
    </section>
  );
}

function LogTime({ onLog }: { onLog: (text: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <span className="flex items-center gap-1">
      <label htmlFor="log-time" className="sr-only">
        Time worked
      </label>
      <input
        ref={ref}
        id="log-time"
        placeholder="45m"
        className="tabular w-20 rounded-sm border border-line bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-queen"
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onLog(ref.current!.value), (ref.current!.value = ""))}
      />
      <button type="button" onClick={() => (onLog(ref.current!.value), (ref.current!.value = ""))} className={`whitespace-nowrap ${quietBtn}`}>
        Log time
      </button>
    </span>
  );
}
