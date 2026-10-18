"use client";
import { useState } from "react";
import Markdown, { type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";

type Hast = { type: string; value?: string; children?: Hast[] };
const textOf = (n: Hast | undefined): string => (n ? (n.value ?? (n.children ?? []).map(textOf).join("")) : "");

/**
 * A note's text, formatted: Markdown (GitHub flavour) with code blocks as their own panels, coloured by language,
 * and pasted images shown inline. Every Enter is a line break, as it is while typing. Raw HTML is never rendered.
 */
export function NoteBody({ text }: { text: string }) {
  return (
    <div className="md note-md">
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[[rehypeHighlight, { detect: false }]]}
        components={{
          pre: CodePanel,
          a: ({ href, title, children }) => (
            <a href={href} title={title} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) =>
            typeof src === "string" ? (
              <a href={src} target="_blank" rel="noreferrer" title="Open full size" className="block w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element -- private, session-checked images; next/image would re-host them */}
                <img src={src} alt={alt ?? ""} loading="lazy" className="max-h-[32rem] rounded-sm border border-line object-contain" />
              </a>
            ) : null,
          input: ({ type, checked }) => <input type={type} checked={checked} disabled readOnly />,
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}

/** A fenced code block: its language on top, a copy button, and the code on a dark panel that scrolls sideways. */
function CodePanel({ node, children }: React.ComponentProps<"pre"> & ExtraProps) {
  const code = (node?.children?.[0] ?? undefined) as (Hast & { properties?: { className?: string[] } }) | undefined;
  const lang = code?.properties?.className?.find((c) => c.startsWith("language-"))?.slice("language-".length);
  const raw = textOf(code).replace(/\n$/, "");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked (e.g. not https); the text can still be selected by hand
    }
  }

  return (
    <figure className="note-code" aria-label={lang ? `${lang} code` : "Code"}>
      <figcaption>
        <span className="tabular">{lang ?? "code"}</span>
        <button type="button" onClick={copy} aria-label={copied ? "Copied" : `Copy ${lang ?? ""} code`.replace("  ", " ")}>
          {copied ? "Copied" : "Copy"}
        </button>
      </figcaption>
      <pre>{children}</pre>
    </figure>
  );
}
