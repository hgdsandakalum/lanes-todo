import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";
import { toCsv } from "@/lib/domain/csv";
import { ymd } from "@/lib/domain/dates";
import { branchList } from "@/lib/domain/repo";

/**
 * Downloads: ?format=json is a full backup of every table; ?format=csv is every task as a spreadsheet
 * (the same columns the CSV import reads). Signed-in only.
 */
export async function GET(req: Request) {
  if (!(await verifySession((await cookies()).get(SESSION_COOKIE)?.value))) return new Response("Sign in first.", { status: 401 });
  const format = new URL(req.url).searchParams.get("format");
  const day = ymd();

  if (format === "json") {
    const tables = {
      workspaces: s.workspaces,
      projects: s.projects,
      releases: s.releases,
      tasks: s.tasks,
      checklistItems: s.checklistItems,
      labels: s.labels,
      taskLabels: s.taskLabels,
      taskRefs: s.taskRefs,
      taskDeps: s.taskDeps,
      timeEntries: s.timeEntries,
      stageEvents: s.stageEvents,
      deepTasks: s.deepTasks,
      weeklyStars: s.weeklyStars,
      dayPlans: s.dayPlans,
      dayReviews: s.dayReviews,
      xpEvents: s.xpEvents,
      achievements: s.achievements,
      routines: s.routines,
      routineChecks: s.routineChecks,
      templates: s.templates,
      subscriptions: s.subscriptions,
      subscriptionPayments: s.subscriptionPayments,
      notes: s.notes,
    };
    const data = Object.fromEntries(await Promise.all(Object.entries(tables).map(async ([k, t]) => [k, await db.select().from(t)])));
    return new Response(JSON.stringify({ app: "lanes", version: 2, exportedAt: new Date().toISOString(), data }, null, 2), {
      headers: { "content-type": "application/json", "content-disposition": `attachment; filename="lanes-backup-${day}.json"` },
    });
  }

  if (format === "csv") {
    const [tasks, labels] = await Promise.all([
      db
        .select({ t: s.tasks, code: s.projects.code })
        .from(s.tasks)
        .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
        .orderBy(asc(s.projects.code), asc(s.tasks.createdAt)),
      db.select({ taskId: s.taskLabels.taskId, name: s.labels.name }).from(s.taskLabels).innerJoin(s.labels, eq(s.taskLabels.labelId, s.labels.id)),
    ]);
    const header = ["id", "title", "project", "type", "kind", "stage", "priority", "due", "estimate_minutes", "labels", "branches", "ticket", "link", "description", "created", "closed"];
    const rows = tasks.map(({ t, code }) => [
      t.id,
      t.title,
      code,
      t.type,
      t.kind ?? (t.type === "code" ? "feature" : ""),
      t.stage,
      t.priority,
      t.due,
      t.estimateMin,
      labels
        .filter((l) => l.taskId === t.id)
        .map((l) => l.name)
        .join(" "),
      branchList(t.branch).join(" "),
      t.ticket,
      t.link,
      t.description,
      t.createdAt.toISOString(),
      t.closedAt?.toISOString(),
    ]);
    return new Response("﻿" + toCsv([header, ...rows]), {
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="lanes-tasks-${day}.csv"` },
    });
  }

  return new Response("Use ?format=json or ?format=csv.", { status: 400 });
}
