import Link from "next/link";
import type { TaskType } from "@/lib/domain/stages";

export type View = "list" | "board";
export type TypeFilter = TaskType | "all";

const seg = "px-3 py-1.5 text-sm text-muted hover:text-ink aria-[current=true]:bg-ink aria-[current=true]:font-semibold aria-[current=true]:text-bg";

/** List/board and type filter as links, so the choice lives in the URL and survives a reload. */
export function ViewSwitch({ base, view, type, counts }: { base: string; view: View; type: TypeFilter; counts: Record<TypeFilter, number> }) {
  const href = (v: View, t: TypeFilter) => {
    const q = new URLSearchParams();
    if (v !== "list") q.set("view", v);
    if (t !== "all") q.set("type", t);
    return q.size ? `${base}?${q}` : base;
  };
  const types: [TypeFilter, string][] = [
    ["all", "All"],
    ["code", "Code"],
    ["design", "Design"],
    ["general", "General"],
  ];
  return (
    <div className="flex flex-wrap items-center gap-3">
      <nav aria-label="View" className="flex rounded-sm border border-line">
        {(["list", "board"] as const).map((v) => (
          <Link key={v} href={href(v, type)} aria-current={v === view} className={seg} scroll={false}>
            {v === "list" ? "List" : "Board"}
          </Link>
        ))}
      </nav>
      <nav aria-label="Task type" className="flex flex-wrap rounded-sm border border-line">
        {types.map(([t, label]) => (
          <Link key={t} href={href(view, t)} aria-current={t === type} className={seg} scroll={false}>
            {label} <span className="tabular opacity-70">{counts[t]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
