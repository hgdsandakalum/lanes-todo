import { formatShort, ymd } from "@/lib/domain/dates";

type Release = { id: string; name: string; releasedAt: Date; tasks: { id: string; title: string }[] };

/** Releases newest first, each with the tasks it shipped. */
export function ReleaseHistory({ releases, today }: { releases: Release[]; today: string }) {
  if (!releases.length) return <p className="text-sm text-muted">Nothing shipped yet.</p>;
  return (
    <>
      <ol className="divide-y divide-line/70">
        {releases.map((r) => (
          <li key={r.id} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4">
            <span className="tabular text-sm text-muted">{formatShort(ymd(r.releasedAt), today)}</span>
            <div className="min-w-0">
              <p className="font-medium">
                {r.name}{" "}
                <span className="tabular text-sm font-normal text-muted">
                  {r.tasks.length} {r.tasks.length === 1 ? "task" : "tasks"}
                </span>
              </p>
              {r.tasks.length > 0 ? <p className="mt-0.5 text-sm text-muted">{r.tasks.map((t) => t.title).join(", ")}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
