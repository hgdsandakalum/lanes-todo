import { codeKind, taskKindLabel, type CodeKind, type TaskType } from "@/lib/domain/stages";

/** 16px line icons, drawn square-cut like the rest of the board. */
const PATHS: Record<CodeKind | "design" | "general", React.ReactNode> = {
  // a spark: something new
  feature: <path d="M8 1.5v4M8 10.5v4M1.5 8h4M10.5 8h4M4 4l1.8 1.8M10.2 10.2 12 12M12 4l-1.8 1.8M5.8 10.2 4 12" />,
  // a bug: body, head, legs
  bug: (
    <>
      <rect x="5" y="5.5" width="6" height="8" />
      <path d="M6.5 5.5V3.5h3v2M5 8H2M14 8h-3M5 11.5H2.5M13.5 11.5H11M5 6 3 4M11 6l2-2M8 7.5v6" />
    </>
  ),
  // two arrows passing: reshaping without changing behaviour
  refactor: <path d="M2 5h10M9.5 2.5 12 5 9.5 7.5M14 11H4M6.5 8.5 4 11l2.5 2.5" />,
  // an eye over code
  review: (
    <>
      <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
      <rect x="6.5" y="6.5" width="3" height="3" />
    </>
  ),
  // a check above a launch line: tested, then shipped
  ship: <path d="M3 6.5 6 9.5 13 2.5M2 13.5h12M8 13.5v-2" />,
  // a magnifier with a square lens
  research: (
    <>
      <rect x="2" y="2" width="8" height="8" />
      <path d="m10 10 4.5 4.5" />
    </>
  ),
  // a pen nib
  design: <path d="M8 1.5 13 8l-5 6.5L3 8l5-6.5ZM8 8v6.5M8 8a1 1 0 1 0 0-.01" />,
  // a plain square
  general: <rect x="3" y="3" width="10" height="10" />,
};

export function KindIcon({ type, kind, className = "size-4" }: { type: TaskType; kind?: string | null; className?: string }) {
  const k = codeKind(type, kind) ?? (type as "design" | "general");
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" className={`shrink-0 ${className}`} role="img" aria-label={taskKindLabel(type, kind)}>
      {PATHS[k]}
    </svg>
  );
}
