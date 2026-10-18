import { addDays, formatLong, weekday } from "@/lib/domain/dates";

const WEEKS = 12;
const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

/** Twelve weeks of finished tasks, Monday to Sunday, one square per day. */
export function Heatmap({ today, counts }: { today: string; counts: Record<string, number> }) {
  const monday = addDays(today, -((weekday(today) + 6) % 7));
  const first = addDays(monday, -(WEEKS - 1) * 7);
  const weeks = Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d)));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const shade = (n: number) => (n === 0 ? "bg-sunk" : n === 1 ? "bg-ink/35" : n <= 3 ? "bg-ink/65" : "bg-ink");

  return (
    <div>
      <div className="flex gap-2">
        <div aria-hidden className="grid grid-rows-7 gap-[3px] pr-1 text-[10px] leading-[14px] text-muted">
          {DAY_LABELS.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-[3px]" role="img" aria-label={`${total} tasks finished in the last ${WEEKS} weeks`}>
          {weeks.flat().map((day) => {
            const n = counts[day] ?? 0;
            const future = day > today;
            const { weekday: name, rest } = formatLong(day);
            return (
              <span
                key={day}
                title={future ? undefined : `${name} ${rest}: ${n} finished`}
                className={`size-3.5 rounded-[1px] ${future ? "bg-transparent" : shade(n)} ${day === today ? "ring-2 ring-queen ring-offset-1 ring-offset-bg" : ""}`}
              />
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        {total === 0 ? "Nothing finished yet. Each dev release, approval or done task fills in its day." : `${total} finished in the last ${WEEKS} weeks.`}
      </p>
    </div>
  );
}

export function SkillTracks({ code, design }: { code: number; design: number }) {
  const max = Math.max(code, design, 1);
  const tracks = [
    { label: "Code", value: code, color: "var(--track-code)" },
    { label: "Design", value: design, color: "var(--track-design)" },
  ];
  return (
    <dl className="space-y-4">
      {tracks.map((t) => (
        <div key={t.label}>
          <div className="flex justify-between text-sm">
            <dt className="font-semibold">{t.label}</dt>
            <dd className="tabular text-muted">{t.value} XP</dd>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden bg-sunk">
            <div className="h-full" style={{ width: `${(t.value / max) * 100}%`, background: t.color }} />
          </div>
        </div>
      ))}
    </dl>
  );
}
