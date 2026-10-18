/** A boxed group on the dashboard: one subject per panel, with an optional count or note on the right of its title. */
export function Panel({
  title,
  aside,
  tone,
  className = "",
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  tone?: "danger";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-sm border border-line bg-surface p-5 ${className}`} aria-label={title}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="shrink-0 font-semibold">{title}</h3>
        {aside != null ? <span className={`tabular text-sm ${tone === "danger" ? "font-semibold text-danger" : "text-muted"}`}>{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

/** A headline number: label on top, the number big, one line of context under it. */
export function Stat({
  label,
  value,
  unit,
  note,
  accent = false,
  danger = false,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  note?: React.ReactNode;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-sm border border-line bg-surface px-5 py-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 leading-none">
        <span className={`tabular font-display text-4xl font-extrabold tracking-tight ${accent ? "text-queen" : danger ? "text-danger" : ""}`}>{value}</span>
        {unit ? <span className="tabular text-sm text-muted"> {unit}</span> : null}
      </p>
      {note ? <p className="mt-2 text-xs text-muted">{note}</p> : null}
    </div>
  );
}

/** The dashboard's area headings: Needs you, This week, Progress. */
export function Area({ id, title, note, children }: { id: string; title: string; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={id} className="font-display text-2xl font-extrabold tracking-tight">
          {title}
        </h2>
        {note ? <div className="text-sm text-muted">{note}</div> : null}
      </div>
      {children}
    </section>
  );
}
