"use client";
import { useState } from "react";
import type { TodayTask } from "@/lib/data/today";

/** A dropdown of tasks grouped by workspace; the confirm button shows once a task is chosen. */
export function TaskPicker({
  id,
  label,
  tasks,
  action,
  pending,
  grouped = true,
}: {
  id: string;
  label: string;
  tasks: TodayTask[];
  action: { label: string; run: (taskId: string) => void };
  pending: boolean;
  grouped?: boolean;
}) {
  const [value, setValue] = useState("");
  const groups = new Map<string, TodayTask[]>();
  for (const t of tasks) groups.set(t.workspaceName, [...(groups.get(t.workspaceName) ?? []), t]);
  const option = (t: TodayTask) => (
    <option key={t.id} value={t.id}>
      {t.projectCode} {t.title}
    </option>
  );

  return (
    <div className="relative flex min-w-0 flex-wrap gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => setValue(e.target.value)} className="w-0 min-w-0 flex-1 basis-48 rounded-sm border border-line bg-bg px-2 py-2 text-sm">
        <option value="" disabled>
          {label}
        </option>
        {grouped
          ? [...groups].map(([name, list]) => (
              <optgroup key={name} label={name}>
                {list.map(option)}
              </optgroup>
            ))
          : tasks.map(option)}
      </select>
      {value ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            action.run(value);
            setValue("");
          }}
          className="rounded-sm bg-ink px-3 py-2 text-sm font-semibold text-bg disabled:opacity-50"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
