import { colorVar, PALETTE } from "@/lib/domain/palette";

export const inputCls = "w-full rounded-sm border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-queen";
export const primaryBtn = "rounded-full bg-queen-fill px-5 py-2 text-sm font-semibold text-queen-ink hover:brightness-110 disabled:opacity-60";
export const quietBtn = "rounded-full px-3.5 py-2 text-sm text-muted hover:bg-sunk hover:text-ink disabled:opacity-60";

export function Field({ label, id, hint, children, className = "" }: { label: string; id: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/** Name and code side by side; the code is what quick add takes after #. */
export function NameAndCode({ idPrefix, name = "", code = "" }: { idPrefix: string; name?: string; code?: string }) {
  return (
    <>
      <Field label="Name" id={`${idPrefix}-name`}>
        <input id={`${idPrefix}-name`} name="name" defaultValue={name} required maxLength={60} autoComplete="off" className={inputCls} />
      </Field>
      <Field label="Code" id={`${idPrefix}-code`} hint="2 to 5 letters or digits. Quick add uses it as #code.">
        <input
          id={`${idPrefix}-code`}
          name="code"
          defaultValue={code}
          required
          maxLength={6}
          autoComplete="off"
          spellCheck={false}
          className={`tabular uppercase ${inputCls}`}
        />
      </Field>
    </>
  );
}

/** The palette as square swatches; a real radio group underneath, so keyboard and screen readers work. */
export function ColorField({ name = "color", value }: { name?: string; value?: string }) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">Colour</legend>
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((key, i) => (
          <label key={key} className="relative cursor-pointer" title={key}>
            <input type="radio" name={name} value={key} defaultChecked={value ? value === key : i === 0} className="peer sr-only" />
            <span className="sr-only">{key}</span>
            <span
              aria-hidden
              className="block size-8 border-2 border-transparent outline-offset-2 peer-checked:border-ink peer-focus-visible:outline-2 peer-focus-visible:outline-queen"
              style={{ background: `color-mix(in srgb, ${colorVar(key)} 30%, var(--bg))`, boxShadow: `inset 0 0 0 4px ${colorVar(key)}` }}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
