"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { keepValues } from "@/components/projects/keep-values";
import { Field, inputCls, primaryBtn, quietBtn } from "@/components/projects/fields";
import { DescriptionField } from "@/components/tasks/markdown";
import { deleteTask, updateTask, type FormState } from "@/lib/actions/tasks";
import { DESCRIPTION_MAX } from "@/lib/domain/quick-add";
import { ymd } from "@/lib/domain/dates";
import { formatMinutes } from "@/lib/domain/estimate";
import { describeRecur } from "@/lib/domain/recur";
import {
  CODE_KINDS,
  codeKind,
  FIELD_LABEL,
  KIND_FIELDS,
  KIND_LABEL,
  PRIORITIES,
  PRIORITY_LABEL,
  shipsToProd,
  stagesFor,
  TYPE_LABEL,
  type CodeKind,
  type ContextField,
  type TaskType,
} from "@/lib/domain/stages";
import type { Task } from "@/lib/db/schema";

const PLACEHOLDER: Record<ContextField, string> = {
  acceptance: "- [ ] Signed-in users land on the page they asked for\n- [ ] Works on mobile Safari",
  repro: "1. Sign out\n2. Open /settings\n3. Sign in",
  expected: "Back on /settings after signing in.",
  actual: "Lands on / and loses the page.",
};

/** Every field of a task. `remindAt` arrives formatted for a datetime-local input, in the app timezone. A good save goes back to `backHref`. */
export function TaskEditor({ task, hasStaging, remindAt, backHref }: { task: Task; hasStaging: boolean; remindAt: string; backHref: string }) {
  const router = useRouter();
  const [type, setType] = useState(task.type as TaskType);
  const [kind, setKind] = useState<CodeKind>(codeKind(task.type, task.kind) ?? "feature");
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [state, action, pending] = useActionState(async (prev: FormState, form: FormData) => {
    const res = await updateTask(prev, form);
    if (!res?.error) router.push(backHref);
    return res;
  }, undefined as FormState);
  const id = (name: string) => `${name}-${task.id}`;
  const stageLost = !stagesFor(type, hasStaging, type === "code" ? kind : null).some((s) => s.key === task.stage);
  const fields = type === "code" ? KIND_FIELDS[kind] : [];

  return (
    <form onSubmit={keepValues(action)} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={task.id} />
      <Field label="Title" id={id("title")} className="sm:col-span-2">
        <input id={id("title")} name="title" defaultValue={task.title} required maxLength={200} className={inputCls} />
      </Field>

      <Field label="Type" id={id("type")}>
        <select id={id("type")} name="type" value={type} onChange={(e) => setType(e.target.value as TaskType)} className={inputCls}>
          {Object.entries(TYPE_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      {type === "code" ? (
        <Field label="Kind of work" id={id("kind")}>
          <select id={id("kind")} name="kind" value={kind} onChange={(e) => setKind(e.target.value as CodeKind)} className={inputCls}>
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
      {stageLost ? <p className="text-sm text-muted sm:col-span-2">This workflow has no stage called that, so saving moves the task back to To do.</p> : null}

      <Field label="Priority" id={id("priority")}>
        <select id={id("priority")} name="priority" defaultValue={task.priority ?? ""} className={inputCls}>
          <option value="">None</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Due" id={id("due")} hint={shipsToProd(type, kind) ? "When it should reach dev. Once dev released, it stops counting as late." : undefined}>
        <input id={id("due")} name="due" type="date" defaultValue={task.due ?? ""} className={inputCls} />
      </Field>
      {type === "code" && task.devReleasedAt ? (
        <Field label="Dev released on" id={id("devReleasedOn")} hint="Set when the stage moved to Dev released. Change it if you released earlier.">
          <input id={id("devReleasedOn")} name="devReleasedOn" type="date" max={ymd()} defaultValue={ymd(task.devReleasedAt)} className={inputCls} />
        </Field>
      ) : null}
      {shipsToProd(type, kind) ? (
        <Field label="Prod date" id={id("prodDate")} hint="The release date the client gives after their QA. Leave empty until then.">
          <input id={id("prodDate")} name="prodDate" type="date" defaultValue={task.prodDate ?? ""} className={inputCls} />
        </Field>
      ) : null}
      <Field label="Estimate" id={id("estimate")} hint="30m, 2h or 1h30m">
        <input id={id("estimate")} name="estimate" defaultValue={task.estimateMin ? formatMinutes(task.estimateMin).replace(" ", "") : ""} placeholder="2h" className={`tabular ${inputCls}`} />
      </Field>
      <Field label="Reminder" id={id("remindAt")} hint="Arrives on your phone once Lanes is deployed.">
        <input id={id("remindAt")} name="remindAt" type="datetime-local" defaultValue={remindAt} className={inputCls} />
      </Field>
      <Field label="Repeat" id={id("recur")} hint="every day, weekdays, every mon, thu, monthly 15. The next one is made when this one closes.">
        <input id={id("recur")} name="recur" defaultValue={describeRecur(task.recur)?.replace(/^Monthly on the (\d+)\w+$/, "monthly $1") ?? ""} placeholder="every fri" className={inputCls} />
      </Field>
      <Field label="Blocked by" id={id("blocker")} hint="Anything outside Lanes that's in the way. Tasks it waits on are set below.">
        <input id={id("blocker")} name="blocker" defaultValue={task.blocker ?? ""} maxLength={500} placeholder="Waiting on API keys from the client" className={inputCls} />
      </Field>

      <DescriptionField id={id("description")} defaultValue={task.description ?? ""} max={DESCRIPTION_MAX} label={type === "code" ? "Technical notes" : "Description"} />
      {fields.map((f) => (
        <DescriptionField key={f} id={id(f)} name={f} defaultValue={task[f] ?? ""} max={10_000} label={FIELD_LABEL[f]} placeholder={PLACEHOLDER[f]} rows={4} />
      ))}

      {type === "code" ? (
        <>
          <Field label="Ticket" id={id("ticket")}>
            <input id={id("ticket")} name="ticket" defaultValue={task.ticket ?? ""} maxLength={50} placeholder="GK-123" className={`tabular ${inputCls}`} />
          </Field>
          <Field label="Branches" id={id("branch")} hint={kind === "bug" || kind === "feature" ? `Leave empty to name it after the ticket, e.g. ${kind === "bug" ? "bugfix" : "feature"}/t-206.` : undefined}>
            <input id={id("branch")} name="branch" defaultValue={task.branch ?? ""} placeholder="feat/gk-login fix/gk-redirect" spellCheck={false} autoCapitalize="off" autoCorrect="off" className={`tabular ${inputCls}`} />
          </Field>
        </>
      ) : null}
      {type === "design" ? (
        <>
          <Field label="Assets" id={id("assets")}>
            <input id={id("assets")} name="assets" type="number" min={0} max={999} defaultValue={task.assets ?? ""} className={inputCls} />
          </Field>
          <Field label="Revision round" id={id("revision")}>
            <input id={id("revision")} name="revision" type="number" min={0} max={999} defaultValue={task.revision ?? ""} className={inputCls} />
          </Field>
        </>
      ) : null}
      <Field label={type === "code" ? "Spec or main link" : type === "design" ? "Figma or Drive" : "Link"} id={id("link")} className="sm:col-span-2">
        <input id={id("link")} name="link" type="url" defaultValue={task.link ?? ""} placeholder="https://" className={inputCls} />
      </Field>

      {state?.error ? (
        <p role="alert" className="text-sm text-danger sm:col-span-2">
          {state.error}
        </p>
      ) : state?.saved ? (
        <p role="status" className="text-sm text-muted sm:col-span-2">
          Saved.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <button disabled={pending} className={primaryBtn}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() =>
            confirming
              ? startDelete(async () => {
                  await deleteTask(task.id);
                  router.push(backHref);
                })
              : setConfirming(true)
          }
          onBlur={() => setConfirming(false)}
          className={`ml-auto ${quietBtn} text-danger hover:text-danger`}
        >
          {deleting ? "Deleting…" : confirming ? "Click again to delete" : "Delete task"}
        </button>
      </div>
    </form>
  );
}
