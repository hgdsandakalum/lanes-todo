import Link from "next/link";
import type { TodayTask } from "@/lib/data/today";
import { formatShort } from "@/lib/domain/dates";
import { stageLabel, type TaskType } from "@/lib/domain/stages";
import { formatMoney } from "@/lib/domain/subscriptions";
import { ProjectTag } from "@/components/tasks/project-tag";
import { CardLink, cardList, TaskCard } from "@/components/tasks/task-card";

/** Open tasks that are overdue or due within the next few days, soonest first; nothing shows when there are none. */
export function DueSoon({ tasks, today }: { tasks: TodayTask[]; today: string }) {
  if (!tasks.length) return null;
  return (
    <section aria-labelledby="due" className="border-t border-line pt-5">
      <h2 id="due" className="font-display text-lg font-extrabold tracking-tight">
        Due soon
      </h2>
      <ul className={`mt-3 ${cardList}`}>
        {tasks.map((t) => {
          const overdue = t.due! < today;
          return (
            <TaskCard key={t.id} color={t.projectColor} className="text-sm">
              <p className="flex items-baseline gap-2">
                <ProjectTag code={t.projectCode} color={t.projectColor} title={t.projectName} />
                <CardLink id={t.id} className="truncate font-medium">
                  {t.title}
                </CardLink>
              </p>
              <p className="mt-1 flex flex-wrap gap-x-3 text-muted">
                <span className={`tabular ${overdue ? "font-semibold text-danger" : ""}`}>
                  {overdue ? `Was due ${formatShort(t.due!, today)}` : `Due ${formatShort(t.due!, today)}`}
                </span>
                <span>{stageLabel(t.type as TaskType, t.stage, t.kind)}</span>
              </p>
            </TaskCard>
          );
        })}
      </ul>
    </section>
  );
}

type Waiting = TodayTask & { waited: number; flagged: boolean };

/** Code that's dev released but not yet in production, longest wait first; past the project's limit is flagged. Hidden when empty. */
export function AwaitingProduction({ tasks }: { tasks: Waiting[] }) {
  if (!tasks.length) return null;
  return (
    <section aria-labelledby="awaiting" className="border-t border-line pt-5">
      <h2 id="awaiting" className="font-display text-lg font-extrabold tracking-tight">
        Awaiting production
      </h2>
      <ul className={`mt-3 ${cardList}`}>
        {tasks.map((t) => (
          <TaskCard key={t.id} color={t.projectColor} className="text-sm">
            <p className="flex items-baseline gap-2">
              <ProjectTag code={t.projectCode} color={t.projectColor} title={t.projectName} />
              <CardLink id={t.id} className="truncate font-medium">
                {t.title}
              </CardLink>
            </p>
            <p className={`tabular mt-1 ${t.flagged ? "text-danger" : "text-muted"}`}>
              Dev released {t.waited === 0 ? "today" : t.waited === 1 ? "yesterday" : `${t.waited} days ago`}
              {t.stage === "staging" ? ", now in staging" : ""}
              {t.flagged ? `, over the ${t.prodWaitDays}-day limit` : ""}
            </p>
          </TaskCard>
        ))}
      </ul>
    </section>
  );
}

/** Subscriptions renewing within the week or overdue; nothing shows when there are none. */
export function RenewalsDue({
  subs,
  today,
}: {
  subs: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    nextDue: string;
  }[];
  today: string;
}) {
  if (!subs.length) return null;
  return (
    <section aria-labelledby="renewals" className="border-t border-line pt-5">
      <h2 id="renewals" className="font-display text-lg font-extrabold tracking-tight">
        <Link href="/subscriptions" className="hover:underline hover:underline-offset-4">
          Renewing soon
        </Link>
      </h2>
      <ul className="mt-2 divide-y divide-line/70">
        {subs.map((x) => {
          const overdue = x.nextDue < today;
          return (
            <li key={x.id} className="grid grid-cols-[6.5rem_minmax(0,1fr)_auto] items-baseline gap-3 py-2.5 text-sm">
              <span className={`tabular ${overdue ? "font-semibold text-danger" : "text-muted"}`}>
                {overdue ? `Was ${formatShort(x.nextDue, today)}` : formatShort(x.nextDue, today)}
              </span>
              <span className="truncate font-medium">{x.name}</span>
              <span className="tabular text-muted">{formatMoney(x.amount, x.currency)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
