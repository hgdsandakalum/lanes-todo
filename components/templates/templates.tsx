"use client";
import { useActionState, useState, useTransition } from "react";
import { keepValues } from "@/components/projects/keep-values";
import { Field, inputCls, primaryBtn, quietBtn } from "@/components/projects/fields";
import { KindIcon } from "@/components/tasks/kind-icon";
import { createFromTemplate, deleteTemplate, saveTemplate } from "@/lib/actions/templates";
import type { FormState } from "@/lib/actions/tasks";
import { CODE_KINDS, KIND_LABEL, TYPE_LABEL, taskKindLabel, type TaskType } from "@/lib/domain/stages";
import type { Template } from "@/lib/db/schema";

type ProjectOption = { id: string; code: string; name: string };

export function TemplateCard({ template: t, projects }: { template: Template; projects: ProjectOption[] }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(createFromTemplate, undefined as FormState);
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();
  return (
    <section className="rounded-sm border border-line bg-surface p-4" aria-labelledby={`tpl-${t.id}`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <KindIcon type={t.type as TaskType} kind={t.kind} className="size-4 self-center text-muted" />
        <h2 id={`tpl-${t.id}`} className="font-display text-lg font-extrabold tracking-tight">
          {t.name}
        </h2>
        <span className="text-sm text-muted">
          {taskKindLabel(t.type as TaskType, t.kind)} · {t.checklist.length} items
        </span>
        <button type="button" onClick={() => setEditing((v) => !v)} aria-expanded={editing} className={`ml-auto ${quietBtn}`}>
          {editing ? "Close" : "Edit"}
        </button>
      </div>
      {editing ? (
        <div className="mt-4">
          <TemplateForm template={t} onSaved={() => setEditing(false)} />
          <button
            type="button"
            disabled={deleting}
            onClick={() => (confirming ? startDelete(() => deleteTemplate(t.id)) : setConfirming(true))}
            onBlur={() => setConfirming(false)}
            className={`mt-2 ${quietBtn} text-danger hover:text-danger`}
          >
            {confirming ? "Click again to delete" : "Delete template"}
          </button>
        </div>
      ) : (
        <>
          {t.checklist.length ? (
            <ul className="mt-3 columns-1 gap-8 text-sm text-muted sm:columns-2">
              {t.checklist.map((item, i) => (
                <li key={i} className="break-inside-avoid py-0.5">
                  ☐ {item}
                </li>
              ))}
            </ul>
          ) : null}
          <form onSubmit={keepValues(action)} className="mt-4 flex flex-wrap items-center gap-2">
            <input type="hidden" name="templateId" value={t.id} />
            <label htmlFor={`tpl-title-${t.id}`} className="sr-only">
              Title of the new task
            </label>
            <input id={`tpl-title-${t.id}`} name="title" placeholder={t.title} className={`w-0 min-w-40 flex-1 ${inputCls}`} />
            <label htmlFor={`tpl-project-${t.id}`} className="sr-only">
              Project
            </label>
            <select id={`tpl-project-${t.id}`} name="projectId" required defaultValue="" className="rounded-sm border border-line bg-bg px-2 py-2 text-sm">
              <option value="" disabled>
                Project…
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} {p.name}
                </option>
              ))}
            </select>
            <button disabled={pending} className={primaryBtn}>
              {pending ? "Creating…" : "Start a task"}
            </button>
          </form>
          {state?.error ? (
            <p role="alert" className="mt-2 text-sm text-danger">
              {state.error}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

export function NewTemplate() {
  const [open, setOpen] = useState(false);
  return open ? (
    <section className="rounded-sm border border-line bg-surface p-4" aria-label="New template">
      <TemplateForm onSaved={() => setOpen(false)} onCancel={() => setOpen(false)} />
    </section>
  ) : (
    <button type="button" onClick={() => setOpen(true)} className="w-fit rounded-sm border border-dashed border-line px-4 py-2 text-sm text-muted hover:border-ink hover:text-ink">
      New template
    </button>
  );
}

function TemplateForm({ template: t, onSaved, onCancel }: { template?: Template; onSaved: () => void; onCancel?: () => void }) {
  const [type, setType] = useState<TaskType>((t?.type as TaskType) ?? "code");
  const [state, action, pending] = useActionState(async (prev: FormState, form: FormData) => {
    const res = await saveTemplate(prev, form);
    if (!res?.error) onSaved();
    return res;
  }, undefined);
  const id = (n: string) => `${n}-${t?.id ?? "new"}`;
  return (
    <form onSubmit={keepValues(action)} className="grid gap-4 sm:grid-cols-2">
      {t ? <input type="hidden" name="id" value={t.id} /> : null}
      <Field label="Template name" id={id("name")}>
        <input id={id("name")} name="name" required maxLength={60} defaultValue={t?.name} placeholder="Hotfix" className={inputCls} />
      </Field>
      <Field label="Task title" id={id("title")}>
        <input id={id("title")} name="title" required maxLength={200} defaultValue={t?.title} placeholder="Hotfix" className={inputCls} />
      </Field>
      <Field label="Type" id={id("type")}>
        <select id={id("type")} name="type" value={type} onChange={(e) => setType(e.target.value as TaskType)} className={inputCls}>
          {Object.entries(TYPE_LABEL).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </Field>
      {type === "code" ? (
        <Field label="Kind of work" id={id("kind")}>
          <select id={id("kind")} name="kind" defaultValue={t?.kind ?? "feature"} className={inputCls}>
            {CODE_KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <div className="max-sm:hidden" />
      )}
      <Field label="Checklist, one item per line" id={id("checklist")} className="sm:col-span-2">
        <textarea id={id("checklist")} name="checklist" rows={8} defaultValue={t?.checklist.join("\n")} className={`${inputCls} leading-relaxed`} />
      </Field>
      <Field label="Description (Markdown, optional)" id={id("description")} className="sm:col-span-2">
        <textarea id={id("description")} name="description" rows={3} defaultValue={t?.description ?? ""} className={inputCls} />
      </Field>
      {state?.error ? (
        <p role="alert" className="text-sm text-danger sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={pending} className={primaryBtn}>
          {pending ? "Saving…" : "Save template"}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className={quietBtn}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
