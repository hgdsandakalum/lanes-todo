import { formatShort, ymd } from "@/lib/domain/dates";

type Achievement = { key: string; title: string; how: string; available: boolean; unlockedAt: Date | null };

/** Earned badges, newest first; the ones still to earn fold away under a count. */
export function Achievements({ list, today }: { list: Achievement[]; today: string }) {
  const earned = list.filter((a) => a.unlockedAt).sort((a, b) => b.unlockedAt!.getTime() - a.unlockedAt!.getTime());
  const open = list.filter((a) => !a.unlockedAt);
  return (
    <div>
      {earned.length ? (
        <ul className="divide-y divide-line/70">
          {earned.map((a) => (
            <Badge key={a.key} a={a} today={today} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">None earned yet.</p>
      )}
      {open.length ? (
        <details className="group mt-3">
          <summary className="w-fit cursor-pointer list-none text-sm text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
            {open.length} still to earn{" "}
            <span aria-hidden className="inline-block transition-transform group-open:rotate-90">
              ›
            </span>
          </summary>
          <ul className="mt-1 divide-y divide-line/70">
            {open.map((a) => (
              <Badge key={a.key} a={a} today={today} />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function Badge({ a, today }: { a: Achievement; today: string }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span aria-hidden className={`mt-1 size-3 shrink-0 rounded-full border-2 ${a.unlockedAt ? "border-progress bg-progress" : "border-line"}`} />
      <span className="min-w-0">
        <span className={`block text-sm ${a.unlockedAt ? "font-medium" : a.available ? "" : "text-muted"}`}>
          {a.title}
          <span className="sr-only">{a.unlockedAt ? ", earned" : ", not earned yet"}</span>
        </span>
        <span className="block text-xs text-muted">
          {a.unlockedAt ? `Earned ${formatShort(ymd(a.unlockedAt), today).replace(/^(Today|Yesterday)$/, (w) => w.toLowerCase())}` : a.how}
        </span>
      </span>
    </li>
  );
}
