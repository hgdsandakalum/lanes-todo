import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { listTemplates } from "@/lib/data/templates";
import { getQuickAddProjects } from "@/lib/data/tasks";
import { TemplateCard, NewTemplate } from "@/components/templates/templates";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Templates</h1>
        <p className="mt-2 max-w-prose text-muted">Reusable checklists for work you repeat. Start a task from one here, or add one to any task&apos;s checklist from the task&apos;s page.</p>
      </header>
      <Suspense fallback={<div aria-hidden className="h-60 rounded-sm bg-sunk/60" />}>
        <Templates />
      </Suspense>
    </div>
  );
}

async function Templates() {
  await connection();
  const [templates, projects] = await Promise.all([listTemplates(), getQuickAddProjects()]);
  return (
    <div className="flex flex-col gap-6">
      {templates.map((t) => (
        <TemplateCard key={t.id} template={t} projects={projects} />
      ))}
      <NewTemplate />
    </div>
  );
}
