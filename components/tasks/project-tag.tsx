import { colorVar } from "@/lib/domain/palette";

/** A project's code as a small square-cut tag in its colour. */
export function ProjectTag({ code, color, title }: { code: string; color: string; title?: string }) {
  return (
    <span title={title} className="tabular inline-flex h-5 shrink-0 items-center rounded-sm border px-1.5 text-xs font-semibold text-ink" style={{ borderColor: colorVar(color) }}>
      {code}
    </span>
  );
}
