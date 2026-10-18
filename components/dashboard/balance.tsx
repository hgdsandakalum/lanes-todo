import { colorVar } from "@/lib/domain/palette";

type Row = { id: string; name: string; color: string; xp: number; moves: number };

/**
 * XP earned in each workspace this week, one bar per workspace in its own colour, scaled to the
 * busiest. Names and values are text beside the bars, so nothing depends on colour alone.
 */
export function WorkspaceBalance({ rows }: { rows: Row[] }) {
  const max = Math.max(...rows.map((r) => r.xp), 1);
  return (
    <dl className="space-y-4">
      {rows.map((r) => (
        <div key={r.id} title={`${r.name}: ${r.xp} XP, ${r.moves} ${r.moves === 1 ? "move" : "moves"} this week`}>
          <div className="flex justify-between gap-3 text-sm">
            <dt className="font-semibold">{r.name}</dt>
            <dd className="tabular text-muted">{r.moves === 0 ? "Nothing moved" : `${r.xp} XP · ${r.moves} ${r.moves === 1 ? "move" : "moves"}`}</dd>
          </div>
          <div className="mt-1.5 h-1.5 bg-sunk">
            <div className="h-full" style={{ width: `${(r.xp / max) * 100}%`, background: colorVar(r.color) }} />
          </div>
        </div>
      ))}
    </dl>
  );
}
