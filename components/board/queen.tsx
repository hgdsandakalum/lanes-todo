/**
 * The deep task's mark, after the logo's dot: two rings, and the dot inside on an indigo ring once a task is picked.
 * An empty slot is a dashed ring, the line form for "waiting".
 */
export function QueenMedallion({ filled, className = "" }: { filled: boolean; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 120" className={className}>
      <circle cx="60" cy="60" r="57" fill="none" stroke="var(--line)" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="48" fill="none" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
      {filled ? (
        <>
          <circle cx="60" cy="60" r="30" fill="var(--queen-fill)" />
          <circle cx="60" cy="60" r="14" fill="var(--pocket)" />
        </>
      ) : (
        <circle cx="60" cy="60" r="28" fill="none" stroke="var(--queen)" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
      )}
    </svg>
  );
}
