"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createTask, type FormState } from "@/lib/actions/tasks";
import { parseQuickAdd } from "@/lib/domain/quick-add";
import { formatShort } from "@/lib/domain/dates";
import { PRIORITY_LABEL, taskKindLabel } from "@/lib/domain/stages";
import { formatMinutes } from "@/lib/domain/estimate";
import { colorVar } from "@/lib/domain/palette";

export type QuickAddProject = { id: string; code: string; name: string; color: string; workspaceSlug: string; isPrimary: boolean };

/** True when a key press is meant for a field, not for a page shortcut. */
const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/**
 * One line, anywhere in the app. Without a #project it adds to the open project, else the open workspace's first project,
 * or the primary workspace's (SoftSora) when no workspace is open. Must render inside <Suspense> (it reads the URL).
 */
export function QuickAdd({ projects, today }: { projects: QuickAddProject[]; today: string }) {
  const [, slug, code] = usePathname().match(/^\/w\/([^/]+)(?:\/([^/]+))?/) ?? [];
  const inWorkspace = projects.filter((p) => p.workspaceSlug === slug);
  const fallback =
    inWorkspace.find((p) => p.code.toLowerCase() === code?.toLowerCase()) ?? inWorkspace[0] ?? projects.find((p) => p.isPrimary) ?? projects[0];
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState<FormState>(undefined);
  const [state, action, pending] = useActionState(async (prev: FormState, form: FormData) => {
    const res = await createTask(prev, form);
    if (!res?.error) setText("");
    return res;
  }, undefined);

  // N jumps to quick add from anywhere that isn't a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "n" || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const parsed = text.trim() ? parseQuickAdd(text, today) : null;
  const q = parsed?.ok ? parsed.value : null;
  const target = q?.project ? projects.find((p) => p.code.toUpperCase() === q.project) : fallback;
  const error =
    parsed && !parsed.ok
      ? parsed.error
      : q?.project && !target
        ? `No active project uses #${q.project.toLowerCase()}.`
        : state !== dismissed
          ? state?.error
          : undefined;

  return (
    <form action={action} className="relative mb-10">
      <label htmlFor="quick-add" className="sr-only">
        Add a task
      </label>
      <div className="flex items-stretch rounded-sm border border-line bg-surface focus-within:border-queen">
        <span aria-hidden className="grid w-11 shrink-0 place-items-center border-r border-line font-display text-lg text-muted">
          +
        </span>
        <input
          ref={input}
          id="quick-add"
          name="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setDismissed(state);
          }}
          placeholder="Add a task: Fix login redirect #gk @code !fri"
          autoComplete="off"
          spellCheck={false}
          maxLength={400}
          aria-keyshortcuts="n"
          aria-describedby="quick-add-help"
          aria-invalid={error ? true : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="min-w-0 flex-1 bg-transparent px-3 py-3 outline-none placeholder:text-muted/70 focus-visible:outline-none"
        />
        <input type="hidden" name="projectId" value={fallback?.id ?? ""} />
        <button
          disabled={pending || !q || !target}
          className="shrink-0 border-l border-line px-4 text-sm font-semibold hover:bg-sunk disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      {/* Hints float under the bar while it's in use, so they never push the page down. */}
      <div
        id="quick-add-help"
        aria-live="polite"
        className={`absolute inset-x-0 top-full z-30 mt-1 rounded-sm border border-line bg-surface px-3 py-2 text-sm shadow-lg shadow-black/40 ${error || (focused && (q || !text.trim())) ? "" : "sr-only"}`}
      >
        {error ? (
          <p className="text-danger">{error}</p>
        ) : q && target ? (
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted">
            Adds to
            <span className="rounded-sm border px-1.5 text-xs font-semibold text-ink" style={{ borderColor: colorVar(target.color) }}>
              {target.code}
            </span>
            <span className="text-ink">{target.name}</span>
            as {taskKindLabel(q.type ?? "general", q.kind).toLowerCase()}
            {q.priority ? <>, <span className="text-ink">{PRIORITY_LABEL[q.priority].toLowerCase()}</span> priority</> : null}
            {q.estimate ? <>, about <span className="tabular text-ink">{formatMinutes(q.estimate)}</span></> : null}
            {q.labels ? <>, labelled <span className="text-ink">{q.labels.join(", ")}</span></> : null}
            {q.due ? <>, due <span className="text-ink">{formatShort(q.due, today)}</span></> : null}
            {q.branches ? (
              <>
                , on {q.branches.length === 1 ? "branch" : "branches"} <span className="tabular text-ink">{q.branches.join(", ")}</span>
              </>
            ) : null}
          </p>
        ) : (
          <p className="text-muted">
            <Kbd>#gk</Kbd> project, <Kbd>@code</Kbd> or <Kbd>@design</Kbd> type, <Kbd>!fri</Kbd> due date,{" "}
            <Kbd>^feat/login</Kbd> branch, <Kbd>@bug</Kbd> kind, <Kbd>*high</Kbd> priority, <Kbd>+label</Kbd>, <Kbd>~2h</Kbd> estimate.
            <span className="max-md:hidden">
              {" "}
              Press <Kbd>N</Kbd> to jump here, <Kbd>/</Kbd> to search.
            </span>
          </p>
        )}
      </div>
    </form>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded-sm border border-line px-1 font-sans text-xs text-ink">{children}</kbd>;
}
