"use server";
import { and, eq, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { ALL, DELETED, NOTE_MAX, UNFILED } from "@/lib/domain/notes";

/** A folder key as the two columns it's stored in; null when no such folder exists. */
async function place(folder: string): Promise<{ workspaceId: string | null; projectId: string | null } | null> {
  if (folder === UNFILED || folder === ALL || folder === DELETED) return { workspaceId: null, projectId: null };
  if (folder.startsWith("pr_")) return (await db.$count(s.projects, eq(s.projects.id, folder))) ? { workspaceId: null, projectId: folder } : null;
  return (await db.$count(s.workspaces, eq(s.workspaces.id, folder))) ? { workspaceId: folder, projectId: null } : null;
}

/** Starts an empty note in a folder and returns its id. Empty notes left behind earlier are cleared first, as Apple Notes does. */
export async function createNote(folder: string): Promise<{ id?: string; error?: string }> {
  await requireSession();
  const where = await place(folder);
  if (!where) return { error: "That folder doesn't exist any more." };
  await db.delete(s.notes).where(and(sql`trim(${s.notes.body}) = ''`, isNull(s.notes.deletedAt)));
  const id = `nt_${crypto.randomUUID()}`;
  await db.insert(s.notes).values({ id, ...where });
  refresh();
  return { id };
}

/** Saves a note's text as it's typed. Deleted notes can't be edited. */
export async function saveNote(id: string, body: string): Promise<{ error?: string }> {
  await requireSession();
  if (typeof body !== "string" || body.length > NOTE_MAX) return { error: `Notes can hold up to ${NOTE_MAX.toLocaleString("en-GB")} characters.` };
  const res = await db
    .update(s.notes)
    .set({ body, updatedAt: new Date() })
    .where(and(eq(s.notes.id, id), isNull(s.notes.deletedAt), ne(s.notes.body, body)));
  if (res.rowsAffected === 0 && !(await db.$count(s.notes, and(eq(s.notes.id, id), isNull(s.notes.deletedAt))))) return { error: "This note was deleted." };
  refresh();
  return {};
}

export async function moveNote(id: string, folder: string): Promise<{ error?: string }> {
  await requireSession();
  const where = await place(folder);
  if (!where) return { error: "That folder doesn't exist any more." };
  await db.update(s.notes).set(where).where(eq(s.notes.id, id));
  refresh();
  return {};
}

export async function setNotePinned(id: string, pinned: boolean) {
  await requireSession();
  await db.update(s.notes).set({ pinned }).where(eq(s.notes.id, id));
  refresh();
}

/** Moves a note to Recently deleted; it's cleared for good after 30 days. An empty note just goes. */
export async function deleteNote(id: string) {
  await requireSession();
  await db.delete(s.notes).where(and(eq(s.notes.id, id), sql`trim(${s.notes.body}) = ''`));
  await db.update(s.notes).set({ deletedAt: new Date(), pinned: false }).where(eq(s.notes.id, id));
  refresh();
}

export async function restoreNote(id: string) {
  await requireSession();
  await db.update(s.notes).set({ deletedAt: null }).where(eq(s.notes.id, id));
  refresh();
}

/** Deletes a note from Recently deleted for good. */
export async function destroyNote(id: string) {
  await requireSession();
  await db.delete(s.notes).where(and(eq(s.notes.id, id), isNotNull(s.notes.deletedAt)));
  refresh();
}
