"use server";
import { and, eq, inArray } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { isYmd, ymd } from "@/lib/domain/dates";
import { checkReleaseDay, defaultReleaseName, RELEASE_NAME_MAX } from "@/lib/domain/releases";
import { reconcileTask } from "@/lib/game/engine";
import type { FormState } from "./tasks";

/**
 * Ships the chosen dev-released code tasks to production as one release: a releases row, every task
 * moved to Prod released and closed on the release day, and each move logged.
 */
export async function shipRelease(_: FormState, form: FormData): Promise<FormState> {
  await requireSession();
  const projectId = String(form.get("projectId") ?? "");
  const taskIds = [...new Set(form.getAll("taskId").map(String))];
  const today = ymd();
  const day = String(form.get("day") ?? "").trim() || today;
  const name = String(form.get("name") ?? "").trim() || defaultReleaseName(day);

  if (taskIds.length === 0) return { error: "Tick at least one task to ship." };
  if (!isYmd(day)) return { error: "The release date isn't a real date." };
  if (name.length > RELEASE_NAME_MAX) return { error: `Keep the name under ${RELEASE_NAME_MAX} characters.` };

  const tasks = await db
    .select()
    .from(s.tasks)
    .where(and(eq(s.tasks.projectId, projectId), inArray(s.tasks.id, taskIds)));
  const shippable = tasks.filter((t) => t.type === "code" && t.devReleasedAt != null && t.closedAt == null);
  if (shippable.length !== taskIds.length) return { error: "Some of those tasks aren't waiting for production any more. Reload and try again." };

  const dayError = checkReleaseDay(day, today, shippable.map((t) => ymd(t.devReleasedAt!)));
  if (dayError) return { error: dayError };

  // today's release is stamped now; a back-dated one at midday UTC, which falls on that day from UTC−11 to UTC+11
  const at = day === today ? new Date() : new Date(`${day}T12:00:00Z`);
  const releaseId = `rel_${crypto.randomUUID()}`;
  await db.batch([
    db.insert(s.releases).values({ id: releaseId, projectId, name, releasedAt: at }),
    ...shippable.flatMap((t) => [
      db.update(s.tasks).set({ stage: "prod_released", closedAt: at, releaseId }).where(eq(s.tasks.id, t.id)),
      db.insert(s.stageEvents).values({ id: `se_${crypto.randomUUID()}`, taskId: t.id, fromStage: t.stage, toStage: "prod_released", at }),
    ]),
  ]);
  for (const t of shippable) await reconcileTask(t.id);
  refresh();
  return { saved: Date.now() };
}
