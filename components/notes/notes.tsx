"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createNote, deleteNote, destroyNote, moveNote, restoreNote, saveNote, setNotePinned } from "@/lib/actions/notes";
import type { Folder, NoteRow, getNotesPage } from "@/lib/data/notes";
import { colorVar } from "@/lib/domain/palette";
import { ALL, DELETED, TRASH_DAYS, UNFILED } from "@/lib/domain/notes";
import { ProjectTag } from "@/components/tasks/project-tag";
import { NoteBody } from "./note-body";
import { uploadImage } from "./upload";

type Data = Awaited<ReturnType<typeof getNotesPage>>;
type View = "folders" | "list" | "note";

const href = (folder: string, note?: string) => `/notes?f=${encodeURIComponent(folder)}${note ? `&n=${encodeURIComponent(note)}` : ""}`;
/** On wide screens all three panes show; narrower, only the one for the current step. */
const pane = (on: boolean) => (on ? "flex" : "hidden xl:flex");
const iconBtn = "grid size-9 shrink-0 place-items-center rounded-sm text-muted hover:bg-sunk hover:text-ink disabled:opacity-40 aria-pressed:text-queen";
const backLink = "inline-flex min-w-0 shrink items-center gap-1 whitespace-nowrap py-1 text-sm text-muted hover:text-ink xl:hidden [&>span]:truncate";

/** Apple Notes-style notes: folders, the notes in one, and the open note. */
export function NotesApp({ data, open, view }: { data: Data; open: NoteRow | null; view: View }) {
  return (
    <div className="grid min-h-[28rem] grid-cols-1 overflow-hidden rounded-sm border border-line xl:h-[calc(100dvh-17rem)] xl:grid-cols-[14rem_20rem_minmax(0,1fr)]">
      <Folders data={data} className={pane(view === "folders")} />
      <List data={data} open={open} className={pane(view === "list")} />
      <section aria-label="Open note" className={`${pane(view === "note")} min-h-0 flex-col bg-bg`}>
        {open ? <Editor key={open.id} note={open} data={data} /> : <Empty data={data} />}
      </section>
    </div>
  );
}

function Folders({ data, className }: { data: Data; className: string }) {
  return (
    <nav aria-label="Note folders" className={`${className} min-h-0 flex-col gap-4 overflow-y-auto border-line bg-sunk p-3 xl:border-r`}>
      <ul>
        {data.top.map((f) => (
          <FolderLink key={f.key} folder={f} current={data.folder} icon={<FolderIcon />} />
        ))}
      </ul>
      {data.tree.map((w) => (
        <div key={w.key}>
          <ul>
            <FolderLink folder={w} current={data.folder} icon={<span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: colorVar(w.color!) }} />} />
            {w.children?.map((p) => (
              <FolderLink key={p.key} folder={p} current={data.folder} indent icon={<ProjectTag code={p.code!} color={p.color!} />} />
            ))}
          </ul>
        </div>
      ))}
      {data.trash.count ? (
        <ul className="mt-auto border-t border-line pt-3">
          <FolderLink folder={data.trash} current={data.folder} icon={<TrashIcon className="size-4 text-muted" />} />
        </ul>
      ) : null}
    </nav>
  );
}

function FolderLink({ folder: f, current, icon, indent = false }: { folder: Folder; current: string; icon: React.ReactNode; indent?: boolean }) {
  const on = f.key === current;
  return (
    <li>
      <Link
        href={href(f.key)}
        aria-current={on ? "page" : undefined}
        className={`flex min-h-9 items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-sm hover:bg-surface aria-[current=page]:bg-surface aria-[current=page]:font-semibold ${indent ? "pl-6" : ""}`}
      >
        {icon}
        <span className="min-w-0 flex-1 truncate">{f.name}</span>
        <span className="tabular text-xs text-muted">{f.count || ""}</span>
      </Link>
    </li>
  );
}

function List({ data, open, className }: { data: Data; open: NoteRow | null; className: string }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = needle ? data.notes.filter((n) => n.body.toLowerCase().includes(needle)) : data.notes;
  const groups = [...new Set(shown.map((n) => n.group))];

  return (
    <section aria-labelledby="notes-folder" className={`${className} min-h-0 flex-col border-line bg-surface xl:border-r`}>
      <div className="flex flex-col gap-2 border-b border-line p-3">
        <Link href="/notes" className={backLink}>
          <Chevron /> Folders
        </Link>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <h2 id="notes-folder" className="truncate font-display text-lg font-extrabold tracking-tight">
              {data.name}
            </h2>
            <p className="tabular text-xs text-muted">
              {data.notes.length} {data.notes.length === 1 ? "note" : "notes"}
              {data.folder === DELETED ? `, cleared after ${TRASH_DAYS} days` : ""}
            </p>
          </div>
          {data.folder !== DELETED ? <NewNote folder={data.folder} /> : null}
        </div>
        <label className="sr-only" htmlFor="notes-search">
          Search {data.name}
        </label>
        <input
          id="notes-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="w-full rounded-sm border border-line bg-bg px-3 py-1.5 text-sm outline-none focus:border-queen"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {shown.length === 0 ? (
          <p className="p-3 text-sm text-muted">{needle ? "No notes match." : data.folder === DELETED ? "Nothing deleted." : "No notes yet."}</p>
        ) : (
          groups.map((g) => (
            <div key={g} className="mb-3">
              <h3 className="px-2.5 pb-1 pt-2 text-xs font-semibold text-muted">{g}</h3>
              <ul>
                {shown
                  .filter((n) => n.group === g)
                  .map((n) => (
                    <li key={n.id}>
                      <Link
                        href={href(data.folder, n.id)}
                        aria-current={open?.id === n.id ? "true" : undefined}
                        className="block rounded-sm px-2.5 py-2 hover:bg-bg aria-[current=true]:bg-[color-mix(in_srgb,var(--queen)_16%,transparent)]"
                      >
                        <span className="flex items-center gap-1.5">
                          {n.pinned ? <PinIcon className="size-3.5 shrink-0 text-queen" /> : null}
                          <span className="truncate font-semibold">{n.title}</span>
                        </span>
                        <span className="flex gap-2 text-sm text-muted">
                          <span className="tabular shrink-0 text-ink/80">{n.stamp}</span>
                          <span className="truncate">{n.preview || "No additional text"}</span>
                        </span>
                        {data.folder === ALL || data.folder === DELETED ? <FolderTag note={n} /> : null}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/** Where a note is filed, at a glance: a project's code tag, a workspace's colour, or the plain Notes folder. */
function FolderTag({ note: n }: { note: NoteRow }) {
  return (
    <span className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs">
      {n.folderCode ? (
        <ProjectTag code={n.folderCode} color={n.folderColor!} />
      ) : n.folderColor ? (
        <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: colorVar(n.folderColor) }} />
      ) : (
        <FolderIcon />
      )}
      {n.folderCode?.toLowerCase() === n.folderName.toLowerCase() ? null : (
        <span className={`truncate ${n.folderColor ? "font-medium text-ink/90" : "text-muted"}`}>{n.folderName}</span>
      )}
    </span>
  );
}

function NewNote({ folder, big = false }: { folder: string; big?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const create = () =>
    start(async () => {
      const res = await createNote(folder === ALL ? UNFILED : folder);
      if (res.id) router.push(href(folder, res.id));
      else setError(res.error ?? "Couldn't start a note.");
    });
  return (
    <>
      {big ? (
        <button type="button" onClick={create} disabled={pending} className="rounded-sm bg-ink px-4 py-2 text-sm font-semibold text-bg disabled:opacity-60">
          New note
        </button>
      ) : (
        <button type="button" onClick={create} disabled={pending} aria-label="New note" title="New note" className={iconBtn}>
          <ComposeIcon className="size-5" />
        </button>
      )}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}

function Empty({ data }: { data: Data }) {
  return (
    <div className="grid flex-1 place-items-center p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <p className="text-muted">{data.notes.length ? "Pick a note to read or edit it." : data.folder === DELETED ? "Nothing deleted." : `No notes in ${data.name} yet.`}</p>
        {data.folder !== DELETED ? <NewNote folder={data.folder} big /> : null}
      </div>
    </div>
  );
}

type Save = "saved" | "saving" | "error";

/** The open note: the first line is its title, the rest its text. Saves a moment after typing stops, and when you leave. */
function Editor({ note, data }: { note: NoteRow; data: Data }) {
  const router = useRouter();
  const split = note.body.indexOf("\n");
  const [title, setTitle] = useState(split < 0 ? note.body : note.body.slice(0, split));
  const [rest, setRest] = useState(split < 0 ? "" : note.body.slice(split + 1));
  const [save, setSave] = useState<Save>("saved");
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const readOnly = note.deleted;
  // the text shows formatted (code panels, images) until you click into it; an empty note opens ready to type
  const [editing, setEditing] = useState(!readOnly && !rest.trim());
  const [uploading, setUploading] = useState(0);
  // where the cursor was in the text, so buttons and pastes insert there; and where to put it after an insert
  const sel = useRef<{ start: number; end: number } | null>(null);
  const caret = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const body = pending.current;
    if (body == null) return;
    pending.current = null;
    setSave("saving");
    saveNote(note.id, body)
      .then((res) => {
        setError(res.error ?? null);
        setSave(res.error ? "error" : pending.current == null ? "saved" : "saving");
      })
      .catch(() => {
        // keep the text queued so the next keystroke or leaving the page tries again
        pending.current ??= body;
        setSave("error");
        setError("Couldn't save. Check your connection; it'll retry as you type.");
      });
  }, [note.id]);

  function changed(nextTitle: string, nextRest: string) {
    pending.current = nextRest ? `${nextTitle}\n${nextRest}` : nextTitle;
    setSave("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  }

  // save what's waiting when switching notes or leaving the page
  useEffect(() => {
    const leave = () => flush();
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      flush();
    };
  }, [flush]);

  // the text area grows with its text, so the pane scrolls rather than the box
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    if (caret.current != null) {
      el.focus();
      el.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [rest, editing]);

  /** Opens the text for editing with the cursor at `at` (the end by default). */
  function edit(at = rest.length) {
    if (readOnly) return;
    caret.current = at;
    setEditing(true);
  }

  /** Puts `text` on its own lines at the cursor (or the end), replacing any selection; the cursor lands `offset` characters in. */
  function insertBlock(text: string, offset = text.length) {
    const { start, end } = sel.current ?? { start: rest.length, end: rest.length };
    const before = rest.slice(0, start);
    const after = rest.slice(end);
    const lead = before && !before.endsWith("\n") ? "\n" : "";
    const tail = after.startsWith("\n") ? "" : "\n";
    const next = `${before}${lead}${text}${tail}${after}`;
    const at = before.length + lead.length + offset;
    sel.current = { start: at, end: at };
    setRest(next);
    changed(title, next);
    edit(at);
  }

  function codeBlock() {
    const picked = sel.current && editing ? rest.slice(sel.current.start, sel.current.end) : "";
    if (picked) insertBlock(`\`\`\`\n${picked.replace(/\n$/, "")}\n\`\`\``);
    else insertBlock("```\n\n```", 4);
  }

  async function addImages(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length || readOnly) return;
    setError(null);
    setUploading((n) => n + images.length);
    for (const file of images) {
      try {
        const path = await uploadImage(note.id, file);
        insertBlock(`![image](${path})`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't upload that image.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  // a new, empty note opens ready to type its title
  useEffect(() => {
    if (!note.body && !readOnly) titleRef.current?.focus();
  }, [note.body, readOnly]);

  const act = (fn: () => Promise<unknown>, then?: string) =>
    start(async () => {
      flush();
      await fn();
      if (then) router.replace(then);
    });

  return (
    <>
      <div className="flex items-center gap-1 border-b border-line px-3 py-2">
        <Link href={href(data.folder)} className={backLink}>
          <Chevron /> <span>{data.name}</span>
        </Link>
        {/* on phones there's only room for the status while it's news: saving, adding an image, or a failed save */}
        <p aria-live="polite" className={`ml-auto mr-2 shrink-0 text-xs text-muted xl:ml-0 ${!readOnly && !uploading && save === "saved" ? "max-sm:sr-only" : ""}`}>
          {readOnly ? "" : uploading ? "Adding image…" : save === "saving" ? "Saving…" : save === "error" ? <span className="text-danger">Not saved</span> : "Saved"}
        </p>
        {readOnly ? (
          <div className="ml-auto flex gap-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => act(() => restoreNote(note.id), href(data.folder))}
              className="rounded-sm px-3 py-1.5 text-sm font-semibold hover:bg-sunk"
            >
              Restore
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => (confirming ? act(() => destroyNote(note.id), href(data.folder)) : setConfirming(true))}
              onBlur={() => setConfirming(false)}
              className="rounded-sm px-3 py-1.5 text-sm text-danger hover:bg-sunk"
            >
              {confirming ? "Click again to delete for good" : "Delete now"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 xl:ml-auto">
            {/* mousedown keeps the text focused, so these insert where the cursor is */}
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={codeBlock} aria-label="Insert code block" title="Code block" className={iconBtn}>
              <CodeIcon className="size-[18px]" />
            </button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()} aria-label="Add image" title="Add image" className={iconBtn}>
              <ImageIcon className="size-[18px]" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              aria-label="Image to add"
              onChange={(e) => {
                void addImages([...(e.target.files ?? [])]);
                e.target.value = "";
              }}
            />
            <MoveTo note={note} data={data} disabled={busy} onMove={(to) => act(() => moveNote(note.id, to), href(data.folder === ALL ? ALL : to, note.id))} />
            <button
              type="button"
              disabled={busy}
              aria-pressed={note.pinned}
              aria-label={note.pinned ? "Unpin note" : "Pin note"}
              title={note.pinned ? "Unpin" : "Pin"}
              onClick={() => act(() => setNotePinned(note.id, !note.pinned))}
              className={iconBtn}
            >
              <PinIcon className="size-[18px]" />
            </button>
            <button
              type="button"
              disabled={busy}
              aria-label="Delete note"
              title="Delete"
              onClick={() => act(() => deleteNote(note.id), href(data.folder))}
              className={`${iconBtn} hover:text-danger`}
            >
              <TrashIcon className="size-[18px]" />
            </button>
          </div>
        )}
      </div>
      {error ? (
        <p role="alert" className="border-b border-line px-5 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {readOnly ? <p className="border-b border-line px-5 py-2 text-sm text-muted">This note is in Recently deleted. Restore it to edit it.</p> : null}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-5 pb-10 pt-4 md:px-8"
        onPaste={(e) => {
          const files = [...e.clipboardData.files];
          if (readOnly || !files.some((f) => f.type.startsWith("image/"))) return;
          e.preventDefault();
          void addImages(files);
        }}
        onDragOver={(e) => {
          if (!readOnly && e.dataTransfer.types.includes("Files")) e.preventDefault();
        }}
        onDrop={(e) => {
          if (readOnly || !e.dataTransfer.files.length) return;
          e.preventDefault();
          void addImages([...e.dataTransfer.files]);
        }}
      >
        <p className="tabular mb-4 text-center text-xs text-muted">{note.fullStamp}</p>
        <label htmlFor="note-title" className="sr-only">
          Title
        </label>
        <input
          ref={titleRef}
          id="note-title"
          value={title}
          readOnly={readOnly}
          maxLength={200}
          placeholder="Title"
          autoComplete="off"
          onChange={(e) => {
            setTitle(e.target.value);
            changed(e.target.value, rest);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "ArrowDown") {
              e.preventDefault();
              textRef.current?.focus();
              textRef.current?.setSelectionRange(0, 0);
            }
          }}
          className="w-full bg-transparent font-display text-2xl font-extrabold tracking-tight outline-none placeholder:text-muted/50"
        />
        {editing ? (
          <>
            <label htmlFor="note-body" className="sr-only">
              Note
            </label>
            <textarea
              ref={textRef}
              id="note-body"
              value={rest}
              placeholder="Start writing. Paste images, or use ``` for code."
              rows={8}
              onChange={(e) => {
                setRest(e.target.value);
                changed(title, e.target.value);
              }}
              onSelect={(e) => (sel.current = { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd })}
              onBlur={(e) => {
                sel.current = { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd };
                // back to the formatted view, unless there's nothing to show yet
                if (rest.trim()) setEditing(false);
              }}
              onKeyDown={(e) => {
                const el = e.currentTarget;
                // backspace at the very start goes back up to the title, like one continuous page
                if (e.key === "Backspace" && el.selectionStart === 0 && el.selectionEnd === 0) {
                  e.preventDefault();
                  titleRef.current?.focus();
                }
                if (e.key === "Escape") el.blur();
              }}
              className="mt-3 w-full resize-none overflow-hidden bg-transparent font-mono text-[15px] leading-relaxed outline-none placeholder:text-muted/50"
            />
          </>
        ) : rest.trim() ? (
          // a click anywhere but a link, image or button opens the text for editing
          <div
            className={`mt-3 ${readOnly ? "" : "cursor-text"}`}
            onClick={(e) => {
              if (!(e.target as HTMLElement).closest("a, button") && !window.getSelection()?.toString()) edit();
            }}
          >
            <NoteBody text={rest} />
            {readOnly ? null : (
              <button type="button" onClick={() => edit()} className="mt-4 text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink">
                Edit text
              </button>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}

/** Which folder the note is filed in. */
function MoveTo({ note, data, disabled, onMove }: { note: NoteRow; data: Data; disabled: boolean; onMove: (to: string) => void }) {
  return (
    <>
      <label htmlFor="note-folder" className="sr-only">
        Folder
      </label>
      <select
        id="note-folder"
        value={note.folder}
        disabled={disabled}
        onChange={(e) => onMove(e.target.value)}
        className="max-w-28 cursor-pointer truncate rounded-full sm:max-w-40 border border-line bg-bg py-1 pl-3 pr-2 text-sm hover:border-muted focus:border-queen"
      >
        <option value={UNFILED}>Notes</option>
        {data.tree.map((w) => (
          <optgroup key={w.key} label={w.name}>
            <option value={w.key}>{w.name}</option>
            {w.children?.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 5 2.5 10 7 15M13 5l4.5 5-4.5 5" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.75" y="3.75" width="14.5" height="12.5" />
      <circle cx="7" cy="8" r="1.4" />
      <path d="m3 15 4.5-4.5 3 3 2.5-2.5 4.5 4.5" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 3 5 8l5 5" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1.75 4.25v8h12.5v-6.5H7.5L6 4.25z" />
    </svg>
  );
}

function ComposeIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M9 3.5H4.5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V11" />
      <path d="m8 12 .6-2.6L15.4 2.6l2 2-6.8 6.8z" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="currentColor">
      <path d="M9.8 1.5 14.5 6.2l-1.1 1.1-.8-.3-2.4 2.4.3 3-1.2 1.2-2.7-2.7-3.4 3.4-.7-.7 3.4-3.4-2.7-2.7L4.4 6.3l3 .3 2.4-2.4-.3-.8z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4M6.75 6.5v4.5M9.25 6.5v4.5" />
    </svg>
  );
}
