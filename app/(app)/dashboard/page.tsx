import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { addDays, formatShort, weekday, ymd } from "@/lib/domain/dates";
import { isOverdue } from "@/lib/domain/due";
import { getActivity, getRoutinesFor, getXpSummary } from "@/lib/data/shell";
import { getToday } from "@/lib/data/today";
import { getGameSummary } from "@/lib/data/game";
import { getDashboard } from "@/lib/data/dashboard";
import { RoutineChecklist } from "@/components/board/routine";
import { getSignals } from "@/lib/data/routines";
import { Heatmap, SkillTracks } from "@/components/board/progress";
import { Achievements } from "@/components/game/streaks-and-badges";
import { WeeklyThree } from "@/components/today/weekly-three";
import { starsDone } from "@/lib/domain/weekly";
import { Area, Panel, Stat } from "@/components/dashboard/panel";
import { NotInProduction } from "@/components/dashboard/not-in-production";
import { WorkspaceBalance } from "@/components/dashboard/balance";
import { Overdue, StuckInReview, Uninvoiced } from "@/components/dashboard/attention";

export const metadata: Metadata = { title: "Dashboard" };

const REVIEW_DAY = 0; // Sunday

export default function DashboardPage() {
  return (
    <Suspense fallback={<div aria-hidden className="h-96 rounded-sm bg-sunk/60" />}>
      <Dashboard />
    </Suspense>
  );
}

/** Level, balance, streaks and the week's loose ends: everything the Sunday review needs on one page. */
async function Dashboard() {
  await connection();
  const day = ymd();
  const [xp, activity, today, game, review] = await Promise.all([
    getXpSummary(),
    getActivity(addDays(day, -7 * 12)),
    getToday(day),
    getGameSummary(day),
    getRoutinesFor(day, weekday(day)).then((r) => r.find((x) => x.key === "review") ?? null),
  ]);
  const dash = await getDashboard(day, { done: starsDone(today.slots), total: today.slots.length });
  const overdue = today.dueSoon.filter((t) => isOverdue(t, day));
  const notInProd = today.awaiting.filter((t) => t.stage === "dev_released" || t.stage === "staging");
  const nextReview = addDays(day, (7 - weekday(day) + REVIEW_DAY) % 7 || 7);
  const loose = overdue.length + dash.stuck.length + dash.uninvoiced.length + notInProd.length;
  const streakNote = (best: number, rest: boolean) => `Best ${best} ${best === 1 ? "day" : "days"}${rest ? " · rest day used" : ""}`;

  return (
    <div className="flex flex-col gap-12">
      <header>
        <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight md:text-5xl">Dashboard</h1>
        <p className="mt-2 text-muted">Week of {formatShort(dash.week, day)}</p>
      </header>

      <section aria-label="This week at a glance" className="-mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Weekly score" value={dash.score.score} unit="/ 100" accent note={`${dash.score.stars} from the three · ${dash.score.balance} from balance`} />
        <Stat label={`Level ${xp.level.level}`} value={xp.level.title} note={`${xp.level.intoLevel} / ${xp.level.needed} XP to the next level`} />
        <Stat label="Deep task streak" value={game.deep.current} unit={game.deep.current === 1 ? "day" : "days"} note={streakNote(game.deep.best, game.deep.restUsedThisWeek)} />
        <Stat
          label="Morning sweep streak"
          value={game.sweep.current}
          unit={game.sweep.current === 1 ? "day" : "days"}
          note={streakNote(game.sweep.best, game.sweep.restUsedThisWeek)}
        />
      </section>

      <Area id="needs-you" title="Needs you" note={loose ? `${loose} ${loose === 1 ? "thing" : "things"} to look at` : undefined}>
        {loose ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {overdue.length ? <Overdue tasks={overdue} today={day} /> : null}
            {dash.stuck.length ? <StuckInReview tasks={dash.stuck} /> : null}
            {dash.uninvoiced.length ? <Uninvoiced tasks={dash.uninvoiced} today={day} /> : null}
            <NotInProduction tasks={notInProd} />
          </div>
        ) : (
          <p className="rounded-sm border border-line bg-surface px-5 py-4 text-muted">
            All clear: nothing overdue, stuck in review, waiting to be invoiced or waiting for production.
          </p>
        )}
      </Area>

      <Area id="this-week" title="This week" note={review ? "It's review day: work down the checklist." : `Next review: ${formatShort(nextReview, day)}`}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {review ? (
            <div className="rounded-sm border border-queen/50 bg-surface p-5 lg:col-span-full">
              <RoutineChecklist routine={review} signals={review.items.some((x) => x.signal) ? await getSignals(day, today) : undefined} />
            </div>
          ) : null}
          <Panel title="This week's three" aside={`${starsDone(today.slots)} / ${today.slots.length} done`}>
            <WeeklyThree slots={today.slots} />
          </Panel>
          <Panel title="Workspace balance" aside="XP this week">
            <WorkspaceBalance rows={dash.balance} />
          </Panel>
        </div>
      </Area>

      <Area id="progress" title="Progress">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="Last 12 weeks" className="lg:col-span-2">
            <Heatmap today={day} counts={activity} />
          </Panel>
          <Panel title="XP by skill" aside={`${xp.total} XP`}>
            <SkillTracks code={xp.byTrack.code} design={xp.byTrack.design} />
          </Panel>
          <Panel title="Achievements" aside={`${game.achievements.filter((a) => a.unlockedAt).length} / ${game.achievements.length}`} className="lg:col-span-full">
            <Achievements list={game.achievements} today={day} />
          </Panel>
        </div>
      </Area>
    </div>
  );
}
