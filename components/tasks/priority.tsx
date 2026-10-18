import { PRIORITY_LABEL, type Priority } from "@/lib/domain/stages";

/** Priority as filled bars, 4 for urgent down to 1 for low: shape carries it, colour only marks urgent. */
const BARS: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

export function PriorityMark({ priority, withLabel = false }: { priority: Priority; withLabel?: boolean }) {
  const n = BARS[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 ${priority === "urgent" ? "text-danger" : ""}`} title={`${PRIORITY_LABEL[priority]} priority`}>
      <svg viewBox="0 0 14 12" className="h-3 w-3.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 3.5} y={9 - i * 3} width="2.5" height={3 + i * 3} fill="currentColor" opacity={i < n ? 1 : 0.22} />
        ))}
      </svg>
      {withLabel ? PRIORITY_LABEL[priority] : <span className="sr-only">{PRIORITY_LABEL[priority]} priority</span>}
    </span>
  );
}
