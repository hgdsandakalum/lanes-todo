"use server";
import { eq, max, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { CODE_KINDS, TASK_TYPES, type CodeKind, type TaskType } from "@/lib/domain/stages";
import { TITLE_MAX } from "@/lib/domain/quick-add";
import { activeProject } from "@/lib/tasks/core";
import type { FormState } from "./tasks";

const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*]\s*)?(?:\[[ xX]\]\s*)?/, "").trim())
    .filter(Boolean);

/** Creates or updates a template from its form. */
export async function saveTemplate(_: FormState, form: FormData): Promise<FormState> {
  await requireSession();
  const id = String(form.get("id") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const type = String(form.get("type") ?? "general") as TaskType;
  const kind = String(form.get("kind") ?? "");
  const description = String(form.get("description") ?? "").trim();
  const checklist = lines(String(form.get("checklist") ?? ""));
  if (!name || name.length > 60) return { error: "Give the template a name under 60 characters." };
  if (!title || title.length > TITLE_MAX) return { error: "Give tasks made from it a title." };
  if (!TASK_TYPES.includes(type)) return { error: "Pick Code, Design or General." };
  if (type === "code" && kind && !CODE_KINDS.includes(kind as CodeKind)) return { error: "Pick a kind of code work." };
  if (checklist.length > 100 || checklist.some((l) => l.length > 300)) return { error: "Keep it to 100 items, each under 300 characters." };
  if (description.length > 20_000) return { error: "Keep the description under 20,000 characters." };
  const values = { name, title, type, kind: type === "code" && kind && kind !== "feature" ? kind : null, description: description || null, checklist };
  if (id) await db.update(s.templates).set(values).where(eq(s.templates.id, id));
  else {
    const [{ top }] = await db.select({ top: max(s.templates.sort) }).from(s.templates);
    await db.insert(s.templates).values({ id: `tpl_${crypto.randomUUID()}`, sort: (top ?? -1) + 1, ...values });
  }
  refresh();
  return { saved: Date.now() };
}

export async function deleteTemplate(id: string) {
  await requireSession();
  await db.delete(s.templates).where(eq(s.templates.id, id));
  refresh();
}

/** Appends a template's checklist to a task. */
export async function applyTemplate(taskId: string, templateId: string): Promise<FormState> {
  await requireSession();
  const [tpl] = await db.select().from(s.templates).where(eq(s.templates.id, templateId)).limit(1);
  if (!tpl) return { error: "That template doesn't exist any more." };
  if ((await db.$count(s.tasks, eq(s.tasks.id, taskId))) === 0) return { error: "That task doesn't exist any more." };
  const [{ n, top }] = await db
    .select({ n: sql<number>`count(*)`, top: max(s.checklistItems.sort) })
    .from(s.checklistItems)
    .where(eq(s.checklistItems.taskId, taskId));
  if (n + tpl.checklist.length > 100) return { error: "That would take the checklist past 100 items." };
  if (tpl.checklist.length)
    await db.insert(s.checklistItems).values(tpl.checklist.map((text, i) => ({ id: `ci_${crypto.randomUUID()}`, taskId, text, sort: (top ?? -1) + 1 + i })));
  refresh();
  return { saved: Date.now() };
}

/** Makes a new task from a template in a project, then opens it. */
export async function createFromTemplate(_: FormState, form: FormData): Promise<FormState> {
  await requireSession();
  const [tpl] = await db.select().from(s.templates).where(eq(s.templates.id, String(form.get("templateId") ?? ""))).limit(1);
  if (!tpl) return { error: "That template doesn't exist any more." };
  const project = await activeProject(eq(s.projects.id, String(form.get("projectId") ?? "")));
  if (!project) return { error: "Pick an active project." };
  const title = String(form.get("title") ?? "").trim() || tpl.title;
  if (title.length > TITLE_MAX) return { error: `Keep the title under ${TITLE_MAX} characters.` };
  const id = `t_${crypto.randomUUID()}`;
  await db.batch([
    db.insert(s.tasks).values({ id, projectId: project.id, title, description: tpl.description, type: tpl.type, kind: tpl.kind }),
    db.insert(s.stageEvents).values({ id: `se_${crypto.randomUUID()}`, taskId: id, fromStage: null, toStage: "todo" }),
    ...(tpl.checklist.length ? [db.insert(s.checklistItems).values(tpl.checklist.map((text, sort) => ({ id: `ci_${crypto.randomUUID()}`, taskId: id, text, sort })))] : []),
  ]);
  redirect(`/t/${id.replace(/^t_/, "")}`);
}
