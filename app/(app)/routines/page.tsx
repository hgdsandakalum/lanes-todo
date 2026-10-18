import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { listRoutines } from "@/lib/data/routines";
import { NewRoutine, RoutineCard } from "@/components/routines/routine-editor";

export const metadata: Metadata = { title: "Routines" };

export default function RoutinesPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Routines</h1>
        <p className="mt-2 max-w-prose text-muted">Checklists that show up on Today on the days they run. Ticking every item in one earns XP.</p>
      </header>
      <Suspense fallback={<div aria-hidden className="h-60 rounded-sm bg-sunk/60" />}>
        <Routines />
      </Suspense>
    </div>
  );
}

async function Routines() {
  await connection();
  const routines = await listRoutines();
  return (
    <div className="flex flex-col gap-6">
      <ul className="divide-y divide-line/70 border-y border-line/70">
        {routines.map((r) => (
          <RoutineCard key={r.key} routine={r} />
        ))}
      </ul>
      <NewRoutine />
    </div>
  );
}
