import { getQuickAddProjects } from "@/lib/data/tasks";
import { ymd } from "@/lib/domain/dates";
import { QuickAdd } from "./quick-add";

export async function QuickAddBar() {
  const projects = await getQuickAddProjects();
  return <QuickAdd projects={projects} today={ymd()} />;
}

/** Same footprint as the bar, so nothing jumps when it streams in. */
export function QuickAddSkeleton() {
  return (
    <div aria-hidden className="mb-10">
      <div className="h-[50px] rounded-sm border border-line bg-surface" />
    </div>
  );
}
