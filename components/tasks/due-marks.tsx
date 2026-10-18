import type { Mark, Tone } from "@/lib/domain/due";

const TONE: Record<Tone, string | undefined> = { danger: "text-danger", warn: "font-medium text-warn", muted: "text-muted", plain: undefined };

/** A task's date marks (see lib/domain/due.ts), each in its tone. */
export function DueMarks({ marks }: { marks: Mark[] }) {
  return marks.map((m) => (
    <span key={m.text} className={TONE[m.tone]}>
      {m.text}
    </span>
  ));
}

export const toneClass = (tone: Tone) => TONE[tone];
