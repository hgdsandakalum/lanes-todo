import type { Mark, Tone } from "@/lib/domain/due";
import { Meta } from "./meta";

const TONE: Record<Tone, string | undefined> = { danger: "text-danger", warn: "font-medium text-warn", muted: "text-muted", plain: undefined };

/** A task's date marks (see lib/domain/due.ts), each with its icon, in its tone, explained on hover. */
export function DueMarks({ marks }: { marks: Mark[] }) {
  return marks.map((m) => (
    <Meta key={m.text} icon={m.icon} title={m.title} className={TONE[m.tone]}>
      {m.text}
    </Meta>
  ));
}

export const toneClass = (tone: Tone) => TONE[tone];
