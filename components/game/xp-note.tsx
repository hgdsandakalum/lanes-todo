"use client";

/**
 * "+30 XP" next to whatever earned it, rising and fading out. `id` changes per award so the
 * animation replays; screen readers hear it once through the live region.
 */
export function XpNote({ amount, id }: { amount: number; id: number }) {
  if (amount === 0) return <span aria-live="polite" className="sr-only" />;
  return (
    <span aria-live="polite" className="pointer-events-none text-sm font-semibold">
      <span key={id} className={`xp-note tabular inline-block ${amount > 0 ? "text-progress" : "text-muted"}`}>
        {amount > 0 ? `+${amount}` : `−${-amount}`} XP
      </span>
    </span>
  );
}
