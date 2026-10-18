import "server-only";
import { and, asc, count, desc, eq, inArray, isNotNull, isNull, lt, type SQL } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { deleteImages } from "@/lib/storage/images";
import { ymd } from "@/lib/domain/dates";
import { ALL, DELETED, TRASH_DAYS, UNFILED, ageGroup, fullStamp, listStamp, notePreview, noteTitle } from "@/lib/domain/notes";

export type Folder = { key: string; name: string; count: number; color?: string; code?: string; children?: Folder[] };

export type NoteRow = {
  id: string;
  body: string;
  title: string;
  preview: string;
  pinned: boolean;
  group: string;
  stamp: string;
  fullStamp: string;
  folder: string; // the folder key it's filed in
  folderName: string;
  folderColor?: string; // a workspace or project folder's colour
  folderCode?: string; // a project folder's code
  deleted: boolean;
};

/** Which notes a folder holds: a folder shows its own notes, not its projects' (like Apple Notes' subfolders). */
function inFolder(key: string): SQL | undefined {
  const live = isNull(s.notes.deletedAt);
  if (key === ALL) return live;
  if (key === DELETED) return isNotNull(s.notes.deletedAt);
  if (key === UNFILED) return and(live, isNull(s.notes.workspaceId), isNull(s.notes.projectId));
  if (key.startsWith("pr_")) return and(live, eq(s.notes.projectId, key));
  return and(live, eq(s.notes.workspaceId, key), isNull(s.notes.projectId));
}

/** Deletes notes for good, and the images stored with them. Not an action: callers check the session. */
export async function purgeNotes(where: SQL | undefined) {
  const gone = await db.select({ id: s.notes.id }).from(s.notes).where(where);
  if (!gone.length) return;
  const ids = gone.map((n) => n.id);
  const images = await db.select({ key: s.noteImages.key }).from(s.noteImages).where(inArray(s.noteImages.noteId, ids));
  // files first: if storage fails, the rows stay and the next purge tries again
  await deleteImages(images.map((i) => i.key));
  await db.delete(s.notes).where(inArray(s.notes.id, ids));
}

/** The folder tree with counts, and the notes in one folder, ready to show. */
export async function getNotesPage(folder: string) {
  await requireSession();
  // deleted notes are kept for 30 days, then cleared
  await purgeNotes(lt(s.notes.deletedAt, new Date(Date.now() - TRASH_DAYS * 864e5)));

  const [workspaces, projects, counts] = await Promise.all([
    db.select().from(s.workspaces).orderBy(asc(s.workspaces.sort)),
    db.select().from(s.projects).orderBy(asc(s.projects.sort)),
    db
      .select({ workspaceId: s.notes.workspaceId, projectId: s.notes.projectId, deleted: isNotNull(s.notes.deletedAt), n: count() })
      .from(s.notes)
      .groupBy(s.notes.workspaceId, s.notes.projectId, isNotNull(s.notes.deletedAt)),
  ]);
  const live = counts.filter((c) => !c.deleted);
  const tally = (match: (c: (typeof counts)[number]) => boolean) => live.filter(match).reduce((n, c) => n + c.n, 0);

  // archived projects only show as folders while they still hold notes
  const shown = projects.filter((p) => p.status === "active" || tally((c) => c.projectId === p.id) > 0);
  const tree: Folder[] = workspaces.map((w) => ({
    key: w.id,
    name: w.name,
    color: w.color,
    count: tally((c) => c.workspaceId === w.id && !c.projectId),
    children: shown.filter((p) => p.workspaceId === w.id).map((p) => ({ key: p.id, name: p.name, code: p.code, color: p.color, count: tally((c) => c.projectId === p.id) })),
  }));
  const top: Folder[] = [
    { key: ALL, name: "All notes", count: tally(() => true) },
    { key: UNFILED, name: "Notes", count: tally((c) => !c.workspaceId && !c.projectId) },
  ];
  const trash: Folder = { key: DELETED, name: "Recently deleted", count: counts.filter((c) => c.deleted).reduce((n, c) => n + c.n, 0) };

  const projectById = new Map(projects.map((p) => [p.id, p]));
  const workspaceById = new Map(workspaces.map((w) => [w.id, w]));
  const names = new Map<string, string>([[UNFILED, "Notes"], ...workspaces.map((w) => [w.id, w.name] as const), ...projects.map((p) => [p.id, p.name] as const)]);
  const known = folder === ALL || folder === DELETED || names.has(folder);
  const key = known ? folder : ALL;

  const rows = await db.select().from(s.notes).where(inFolder(key)).orderBy(desc(s.notes.pinned), desc(s.notes.updatedAt));
  const today = ymd();
  const notes: NoteRow[] = rows.map((n) => {
    const day = ymd(n.updatedAt);
    const filed = n.projectId ?? n.workspaceId ?? UNFILED;
    return {
      id: n.id,
      body: n.body,
      title: noteTitle(n.body),
      preview: notePreview(n.body),
      pinned: n.pinned && key !== DELETED,
      group: n.pinned && key !== DELETED ? "Pinned" : ageGroup(day, today),
      stamp: listStamp(n.updatedAt, day, today),
      fullStamp: fullStamp(n.updatedAt),
      folder: filed,
      folderName: names.get(filed) ?? "Notes",
      folderColor: n.projectId ? projectById.get(n.projectId)?.color : n.workspaceId ? workspaceById.get(n.workspaceId)?.color : undefined,
      folderCode: n.projectId ? projectById.get(n.projectId)?.code : undefined,
      deleted: n.deletedAt != null,
    };
  });

  const name = key === ALL ? "All notes" : key === DELETED ? "Recently deleted" : names.get(key)!;
  return { folder: key, name, top, tree, trash, notes };
}
