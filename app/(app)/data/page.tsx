import type { Metadata } from "next";
import { ImportForm } from "@/components/data/import-form";

export const metadata: Metadata = { title: "Import & export" };

const btn = "inline-block rounded-sm border border-line px-4 py-2 text-sm font-semibold hover:border-ink";

export default function DataPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <header>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Import &amp; export</h1>
        <p className="mt-2 text-muted">Your data, in files you can keep. Imports only ever add tasks; nothing already here is changed or deleted.</p>
      </header>

      <section aria-labelledby="export" className="border-t border-line pt-5">
        <h2 id="export" className="font-display text-xl font-extrabold tracking-tight">
          Export
        </h2>
        <dl className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-[auto_minmax(0,1fr)]">
          <dt>
            <a href="/api/export?format=json" className={btn} download>
              Full backup (JSON)
            </a>
          </dt>
          <dd className="text-sm text-muted">Every table: projects, tasks, checklists, labels, references, time, XP, streak history, reviews, templates, subscriptions and notes. Keep one before big changes.</dd>
          <dt>
            <a href="/api/export?format=csv" className={btn} download>
              Tasks (CSV)
            </a>
          </dt>
          <dd className="text-sm text-muted">One row per task, for a spreadsheet. The same columns import back in.</dd>
        </dl>
      </section>

      <section aria-labelledby="import" className="border-t border-line pt-5">
        <h2 id="import" className="font-display text-xl font-extrabold tracking-tight">
          Import
        </h2>
        <p className="mt-2 text-sm text-muted">
          A CSV needs <code className="text-ink">title</code> and <code className="text-ink">project</code> (a code like GK) columns. It can also have type, kind, stage, priority, due (YYYY-MM-DD), estimate_minutes, labels, branches, ticket, link and description. Finished tasks in a CSV are skipped, so your XP and streaks only count work done here. A Lanes JSON backup adds the tasks it has that aren&apos;t here yet, with their checklists, labels and references.
        </p>
        <ImportForm />
      </section>
    </div>
  );
}
