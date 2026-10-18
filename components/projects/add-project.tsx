"use client";
import { keepValues } from "@/components/projects/keep-values";
import { useActionState, useState } from "react";
import { createProject } from "@/lib/actions/projects";
import type { FormState } from "@/lib/actions/tasks";
import { ColorField, NameAndCode, primaryBtn, quietBtn } from "./fields";

export function AddProject({ workspaceId, workspaceName }: { workspaceId: string; workspaceName: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(async (prev: FormState, form: FormData) => {
    const res = await createProject(prev, form);
    if (!res?.error) setOpen(false);
    return res;
  }, undefined);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-sm border border-dashed border-line px-4 py-2.5 text-sm font-medium hover:border-ink">
        Add a project to {workspaceName}
      </button>
    );
  }
  return (
    <form onSubmit={keepValues(action)} className="grid gap-4 rounded-sm border border-line bg-surface p-4 sm:grid-cols-2">
      <h2 className="font-display text-lg font-extrabold tracking-tight sm:col-span-2">New project in {workspaceName}</h2>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <NameAndCode idPrefix="new-project" />
      <div className="sm:col-span-2">
        <ColorField />
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-danger sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      <p className="text-sm text-muted sm:col-span-2">Staging, the production wait and the repo are in the project&apos;s settings once it exists.</p>
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={pending} className={primaryBtn}>
          {pending ? "Adding…" : "Add project"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={quietBtn}>
          Cancel
        </button>
      </div>
    </form>
  );
}
