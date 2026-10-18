"use client";
import { useState, useTransition } from "react";
import { deleteProject, setProjectArchived } from "@/lib/actions/projects";
import type { Project } from "@/lib/db/schema";
import { colorVar } from "@/lib/domain/palette";
import { quietBtn } from "./fields";

export function ArchivedProjects({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;
  return (
    <section aria-labelledby="archived" className="border-t border-line pt-5">
      <h2 id="archived" className="font-display text-lg font-extrabold tracking-tight">
        Archived
      </h2>
      <ul className="mt-2 divide-y divide-line/70">
        {projects.map((p) => (
          <ArchivedRow key={p.id} project={p} />
        ))}
      </ul>
    </section>
  );
}

function ArchivedRow({ project: p }: { project: Project }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function remove() {
    if (!confirming) return setConfirming(true);
    start(async () => {
      const res = await deleteProject(p.id);
      if (res?.error) {
        setError(res.error);
        setConfirming(false);
      }
    });
  }

  return (
    <li className="py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="tabular rounded-sm border px-2 py-0.5 text-sm font-semibold text-muted" style={{ borderColor: colorVar(p.color) }}>
          {p.code}
        </span>
        <span className="text-muted">{p.name}</span>
        <span className="ml-auto flex gap-1">
          <button type="button" disabled={pending} onClick={() => start(() => setProjectArchived(p.id, false))} className={quietBtn}>
            Restore
          </button>
          <button type="button" disabled={pending} onClick={remove} onBlur={() => setConfirming(false)} className={`${quietBtn} text-danger hover:text-danger`}>
            {confirming ? "Click again to delete for good" : "Delete"}
          </button>
        </span>
      </div>
      {error ? (
        <p role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </li>
  );
}
