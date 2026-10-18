/** 14px line icons for a card's details, drawn square-cut like the kind icons, so each number says what it counts. */
const PATHS = {
  // a calendar page: the due date
  due: (
    <>
      <rect x="2" y="3" width="12" height="11" />
      <path d="M2 6.5h12M5 1.5v3M11 1.5v3" />
    </>
  ),
  // an arrow up into a box: handed over to dev
  dev: <path d="M8 10V2M4.5 5.5 8 2l3.5 3.5M2 9v5h12V9" />,
  // an hourglass: waiting on someone else
  wait: <path d="M3.5 1.5h9M3.5 14.5h9M4.5 1.5c0 4 7 4.5 7 6.5s-7 2.5-7 6.5M11.5 1.5c0 4-7 4.5-7 6.5s7 2.5 7 6.5" />,
  // a flag: the production date
  prod: <path d="M3 14.5V1.5M3 2.5h10l-2 3.5 2 3.5H3" />,
  // a ticked box: subtasks and checklist done
  progress: (
    <>
      <rect x="2" y="2" width="12" height="12" />
      <path d="m5 8 2.2 2.2L11.5 5.8" />
    </>
  ),
  // a ticket with a notch: the ticket ID
  ticket: <path d="M1.5 4h13v2.5a1.5 1.5 0 0 0 0 3V12h-13V9.5a1.5 1.5 0 0 0 0-3ZM10 4v8" />,
  // a branch splitting off a line
  branch: (
    <>
      <path d="M4.5 2v12M4.5 10c0-3 7-2 7-5.5" />
      <rect x="10" y="2" width="3" height="3" />
    </>
  ),
  // two chain links
  link: <path d="M6.5 9.5 9.5 6.5M7 4.5 8.5 3a2.5 2.5 0 0 1 3.5 3.5L10.5 8M9 11.5 7.5 13A2.5 2.5 0 0 1 4 9.5L5.5 8" />,
  // a clock: the estimate
  estimate: (
    <>
      <rect x="2" y="2" width="12" height="12" />
      <path d="M8 4.5V8h3" />
    </>
  ),
  // a bug: what QA sent back
  bug: (
    <>
      <rect x="5" y="5.5" width="6" height="8" />
      <path d="M6.5 5.5V3.5h3v2M5 8H2M14 8h-3M5 11.5H2.5M13.5 11.5H11" />
    </>
  ),
} satisfies Record<string, React.ReactNode>;

export type MetaIcon = keyof typeof PATHS;

export function Icon({ name, className = "size-3.5" }: { name: MetaIcon; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden className={`shrink-0 ${className}`}>
      {PATHS[name]}
    </svg>
  );
}

/** One detail in a card's meta row: an icon, the text, and what it means on hover (and for screen readers, via `label`). */
export function Meta({ icon, title, label, className = "", children }: { icon: MetaIcon; title?: string; label?: string; className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} title={title}>
      <Icon name={icon} />
      {label ? <span className="sr-only">{label}: </span> : null}
      {children}
    </span>
  );
}
