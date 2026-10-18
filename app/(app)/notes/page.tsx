import type { Metadata } from "next";
import { Suspense } from "react";
import { getNotesPage } from "@/lib/data/notes";
import { ALL } from "@/lib/domain/notes";
import { NotesApp } from "@/components/notes/notes";

export const metadata: Metadata = { title: "Notes" };

type Props = PageProps<"/notes">;

export default function NotesPage({ searchParams }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Notes</h1>
      <Suspense fallback={<div aria-hidden className="h-[32rem] rounded-sm bg-sunk/60" />}>
        <Notes searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Notes({ searchParams }: Pick<Props, "searchParams">) {
  const query = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const data = await getNotesPage(one(query.f) ?? ALL);
  const open = data.notes.find((n) => n.id === one(query.n)) ?? null;
  // on narrow screens one pane shows at a time: a note if one is open, else the list once a folder is picked, else the folders
  const view = open ? "note" : one(query.f) ? "list" : "folders";
  return <NotesApp data={data} open={open} view={view} />;
}
