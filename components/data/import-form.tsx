"use client";
import { useActionState, useRef, useState, useTransition } from "react";
import { previewImport, runImport, type ImportResult } from "@/lib/actions/import";

/** Choose a file, see what it would add, then confirm. The same file is sent again to import, and checked again. */
export function ImportForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [preview, check, checking] = useActionState(previewImport, undefined as ImportResult | undefined);
  const [result, run, running] = useActionState(runImport, undefined as ImportResult | undefined);
  const [chosen, setChosen] = useState(false);
  const [, start] = useTransition();
  const send = (fn: (f: FormData) => void) => ref.current && start(() => fn(new FormData(ref.current!)));
  const shown = result ?? preview;

  return (
    <form ref={ref} onSubmit={(e) => e.preventDefault()} className="mt-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="import-file" className="sr-only">
          CSV or JSON file
        </label>
        <input
          id="import-file"
          name="file"
          type="file"
          accept=".csv,.json,text/csv,application/json"
          onChange={(e) => {
            setChosen(!!e.target.files?.length);
            if (e.target.files?.length) send(check);
          }}
          className="text-sm file:mr-3 file:rounded-sm file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-sm file:text-ink"
        />
        {checking ? <span className="text-sm text-muted">Checking…</span> : null}
      </div>

      {shown?.error ? (
        <p role="alert" className="text-sm text-danger">
          {shown.error}
        </p>
      ) : shown ? (
        <div role="status" className="rounded-sm border border-line bg-surface p-4 text-sm">
          {result?.done ? (
            <p className="font-medium text-queen">
              Added {result.ok} {result.ok === 1 ? "task" : "tasks"}.
            </p>
          ) : (
            <p className="font-medium">
              Ready to add {shown.ok} {shown.ok === 1 ? "task" : "tasks"}
              {shown.sample?.length ? <span className="font-normal text-muted">, starting with {shown.sample.slice(0, 3).join(", ")}</span> : null}.
            </p>
          )}
          {shown.skipped?.length ? (
            <>
              <p className="mt-3 text-muted">
                {shown.skipped.length} {shown.skipped.length === 1 ? "row" : "rows"} skipped:
              </p>
              <ul className="mt-1 max-h-48 overflow-y-auto">
                {shown.skipped.map((s) => (
                  <li key={`${s.line}-${s.reason}`} className="tabular text-muted">
                    Line {s.line}: {s.reason}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {!result?.done && shown.ok ? (
            <button type="button" disabled={running || !chosen} onClick={() => send(run)} className="mt-4 rounded-sm bg-ink px-4 py-2 text-sm font-semibold text-bg disabled:opacity-60">
              {running ? "Importing…" : `Import ${shown.ok} ${shown.ok === 1 ? "task" : "tasks"}`}
            </button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
