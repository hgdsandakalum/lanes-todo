"use client";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * A task description rendered from Markdown (GitHub flavour: tables, task lists, strikethrough, bare links).
 * Raw HTML is never rendered and unsafe link schemes (javascript:) are dropped by react-markdown's default URL check.
 */
export function TaskMarkdown({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`md ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, title, children }) => (
            <a href={href} title={title} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          // task-list boxes show state only; the description is edited as text
          input: ({ type, checked }) => <input type={type} checked={checked} disabled readOnly />,
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}

const DESCRIPTION_HINT = "Notes, steps, links. Markdown works: **bold**, - lists, - [ ] checklists, `code`, ```code blocks```, [link](https://…)";

/** A Markdown field in the task editor (description, acceptance criteria, repro steps…) with a Write / Preview switch. */
export function DescriptionField({
  id,
  defaultValue,
  max,
  name = "description",
  label = "Description",
  placeholder = DESCRIPTION_HINT,
  rows = 6,
}: {
  id: string;
  defaultValue: string;
  max: number;
  name?: string;
  label?: string;
  placeholder?: string;
  rows?: number;
}) {
  const [text, setText] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  const tab = "rounded-sm px-2 py-0.5 text-sm text-muted hover:text-ink aria-pressed:bg-sunk aria-pressed:text-ink";
  return (
    <div className="sm:col-span-2">
      <div className="mb-1 flex items-center gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span className="ml-auto flex gap-1" role="group" aria-label={`${label}: write or preview`}>
          <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)} className={tab}>
            Write
          </button>
          <button type="button" aria-pressed={preview} onClick={() => setPreview(true)} className={tab}>
            Preview
          </button>
        </span>
      </div>
      {/* the textarea stays mounted while previewing, so its text is still submitted */}
      <textarea
        id={id}
        name={name}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={max}
        rows={rows}
        placeholder={placeholder}
        className={`w-full rounded-sm border border-line bg-bg px-3 py-2 text-sm leading-relaxed outline-none focus:border-queen ${preview ? "hidden" : ""}`}
      />
      {preview ? (
        <div className="min-h-[9.5rem] rounded-sm border border-line bg-bg px-3 py-2">
          {text.trim() ? <TaskMarkdown text={text} /> : <p className="text-sm text-muted">Nothing to preview yet.</p>}
        </div>
      ) : null}
    </div>
  );
}
