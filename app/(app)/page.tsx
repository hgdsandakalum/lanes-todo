import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { formatLong, weekday, ymd } from "@/lib/domain/dates";
import { getRoutinesFor } from "@/lib/data/shell";
import { getToday } from "@/lib/data/today";
import { getDayReview, getPlan } from "@/lib/data/plan";
import { DayPlan, EndOfDay } from "@/components/today/day-plan";
import { RoutineChecklist } from "@/components/board/routine";
import { DeepTask } from "@/components/today/deep-task";
import { AwaitingProduction, DueSoon, RenewalsDue } from "@/components/today/lists";
import { getRenewalsDue } from "@/lib/data/subscriptions";
import { getSignals } from "@/lib/data/routines";

export const metadata: Metadata = { title: "Today" };

/** Sections in the side column are divided by a single hairline. */
const ruled = "border-t border-line pt-5";

export default function HomePage() {
  return (
    <Suspense fallback={<BoardSkeleton />}>
      <Board />
    </Suspense>
  );
}

async function Board() {
  await connection();
  const day = ymd();
  const { weekday: name, rest } = formatLong(day);
  // Today shows only what to do now; XP, streaks and badges live on the dashboard.
  const [routines, today, plan, review, renewals] = await Promise.all([
    getRoutinesFor(day, weekday(day)),
    getToday(day),
    getPlan(day),
    getDayReview(day),
    getRenewalsDue(day),
  ]);
  const signals = routines.some((r) => r.items.some((x) => x.signal)) ? await getSignals(day, today) : undefined;

  return (
    <div className="flex flex-col gap-14">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-12 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* On a phone the date and the queen fill the first screen; everything else is one scroll below. */}
        <div className="flex flex-col gap-6 max-md:min-h-[calc(100svh-11rem)] lg:col-start-1">
          <header>
            <h1 className="font-display text-[2.75rem] font-extrabold leading-none tracking-tight md:text-6xl">{name}</h1>
            <p className="mt-2 text-muted">{rest}</p>
          </header>

          <DeepTask deep={today.deep} carry={today.carry} pickable={today.pickable} today={day} />
        </div>

        <aside className="flex flex-col gap-8 lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-label="Today">
          <section aria-labelledby="routine" className={ruled}>
            <h2 id="routine" className="sr-only">
              Today&apos;s routine
            </h2>
            {routines.length === 0 ? (
              <p className="text-muted">No routine today.</p>
            ) : (
              <div className="flex flex-col gap-6">
                {routines.map((r) => (
                  <RoutineChecklist key={r.key} routine={r} signals={signals} />
                ))}
              </div>
            )}
          </section>

          <AwaitingProduction tasks={today.awaiting} />

          <RenewalsDue subs={renewals} today={day} />
        </aside>

        <div className="flex flex-col gap-12 lg:col-start-1 lg:row-start-2">
          <DayPlan plan={plan} pickable={today.pickable} />
          <DueSoon tasks={today.dueSoon} today={day} />
          <EndOfDay data={review} />
        </div>
      </div>

    </div>
  );
}

function BoardSkeleton() {
  return (
    <div aria-hidden className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-12">
      <div className="flex flex-col gap-6">
        <div className="h-14 w-64 rounded-xl bg-sunk" />
        <div className="h-48 rounded-3xl bg-sunk/70" />
      </div>
      <div className="h-80 rounded-xl bg-sunk/50" />
    </div>
  );
}
