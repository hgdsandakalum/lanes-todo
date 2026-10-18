import Link from "next/link";
import { colorVar } from "@/lib/domain/palette";

export const taskHref = (id: string) => `/t/${id.replace(/^t_/, "")}`;

/** Lists of task cards: a small gap between each. */
export const cardList = "flex flex-col gap-2";

/** Controls inside a card (stage, buttons, links) sit above the card's link so they work on their own. */
export const aboveCard = "relative z-10";

/**
 * A task as a card: a raised surface, edged on the left in its project's colour. Put one CardLink inside;
 * it stretches over the whole card, so a click anywhere opens the task. A `waiting` card (your part done, with QA
 * or the client) is sunk and dashed, the board's line form for waiting.
 */
export function TaskCard({ color, waiting = false, className = "", children }: { color?: string; waiting?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <li
      data-waiting={waiting || undefined}
      className={`relative rounded-sm border border-l-[3px] border-line px-4 py-3 ${waiting ? "border-dashed bg-sunk" : "bg-surface"} outline-offset-2 outline-queen transition-colors hover:border-muted/60 hover:bg-[color-mix(in_srgb,var(--surface)_80%,var(--ink)_4%)] has-[a[data-card]:focus-visible]:outline-2 ${className}`}
      style={color ? { borderLeftColor: colorVar(color) } : undefined}
    >
      {children}
    </li>
  );
}

/** The task's title, linking to its page across the whole card. */
export function CardLink({ id, className = "", children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={taskHref(id)} data-card className={`min-w-0 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none ${className}`}>
      {children}
    </Link>
  );
}
