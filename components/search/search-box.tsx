"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** The search field. "/" from anywhere that isn't a field jumps here (or to the search page). */
export function SearchBox({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!defaultValue) ref.current?.focus();
  }, [defaultValue]);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = ref.current?.value.trim() ?? "";
        router.replace(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
      }}
      className="flex border border-line bg-surface focus-within:border-queen"
    >
      <label htmlFor="search" className="sr-only">
        Search everything
      </label>
      <input ref={ref} id="search" name="q" type="search" defaultValue={defaultValue} placeholder="Search tasks, notes, branches, PRs…" className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none" />
      <button className="border-l border-line px-4 text-sm font-semibold hover:bg-sunk">Search</button>
    </form>
  );
}

/** "/" opens search from any page. */
export function SearchShortcut() {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable=true]")) return;
      e.preventDefault();
      const box = document.getElementById("search") as HTMLInputElement | null;
      if (box) box.focus();
      else router.push("/search");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  return null;
}
