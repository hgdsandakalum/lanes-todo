import { getXpSummary } from "@/lib/data/shell";
import { XpPulse } from "@/components/game/xp-pulse";

/** The one loud element in the shell: the cyan accent on the black frame. */
export async function LevelBar() {
  const { level } = await getXpSummary();
  return <LevelBarView level={level.level} title={level.title} into={level.intoLevel} needed={level.needed} />;
}

export function LevelBarView({ level, title, into, needed }: { level: number; title: string; into: number; needed: number }) {
  const pct = Math.round((into / needed) * 100);
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-3">
        <p className="flex items-baseline gap-2 leading-none">
          <span className="sr-only">Level </span>
          <span className="font-display text-[26px] font-extrabold tracking-tight md:text-[34px]">{level}</span>
          <span className="text-sm font-medium text-rail-muted">{title}</span>
        </p>
        <p className="flex items-baseline gap-2">
          <XpPulse />
          <span className="tabular text-xs text-rail-muted">
            {into} / {needed} XP
          </span>
        </p>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden bg-rail-line"
        role="progressbar"
        aria-label="Progress to next level"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-queen transition-[width] duration-700 ease-out"
          style={{ width: `max(${pct}%, 0.5rem)` }}
        />
      </div>
    </div>
  );
}

export function LevelBarSkeleton() {
  return <LevelBarView level={1} title="…" into={0} needed={100} />;
}
