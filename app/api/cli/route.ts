import { createHash, timingSafeEqual } from "node:crypto";
import { and, asc, desc, eq, gte, isNotNull, isNull, like, ne, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { isSharedBranch, normalizeFolder, projectForFolder, resolveStage, shortId, stageWords } from "@/lib/domain/folders";
import { branchList, isValidBranch, MAX_BRANCHES } from "@/lib/domain/repo";
import { stageLabel, type TaskType } from "@/lib/domain/stages";
import { addTask, moveTask } from "@/lib/tasks/core";
import { loadToday, type TodayTask } from "@/lib/data/today";
import { addDays, weekday, ymd, zonedTime } from "@/lib/domain/dates";
import { isOverdue, withClient } from "@/lib/domain/due";
import { FINISHED_FOR_ME } from "@/lib/domain/stages";

/**
 * The lanes command (bin/lanes.mjs) talks to this one endpoint. It sends the folder it runs in and the
 * current git branch; the server works out the project and task. Auth is a bearer token, LANES_CLI_TOKEN:
 * without it set, the endpoint is off. proxy.ts lets /api/cli through, since the command has no cookie.
 *
 * One read-only command, "brief", also takes LANES_BRIEF_TOKEN: a separate key for assistants (the morning
 * briefing) that can read the day's tasks but can't add, move or link anything.
 */

type Body = { cmd?: string; cwd?: string; root?: string; branch?: string; text?: string; description?: string; code?: string; stage?: string; task?: string };

const digest = (v: string) => createHash("sha256").update(v).digest();

function matches(sent: string, token: string | undefined): boolean {
  if (!token || token.length < 32) return false;
  return timingSafeEqual(digest(sent), digest(token));
}

/** "full" with LANES_CLI_TOKEN, "brief" with LANES_BRIEF_TOKEN (read-only), else null. */
function access(req: Request): "full" | "brief" | null {
  const sent = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (matches(sent, process.env.LANES_CLI_TOKEN)) return "full";
  if (matches(sent, process.env.LANES_BRIEF_TOKEN)) return "brief";
  return null;
}

const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request) {
  const level = access(req);
  if (!level) return fail("Not authorized. Check LANES_CLI_TOKEN in the app and the token in ~/.config/lanes.json.", 401);
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return fail("Send JSON.");
  }
  if (body.cmd === "brief") return brief();
  if (level !== "full") return fail("This token can only read the brief.", 403);
  const cwd = normalizeFolder(body.cwd ?? "");
  const branch = body.branch && isValidBranch(body.branch) ? body.branch : null;
  if (!cwd) return fail("The command didn't say which folder it runs in.");

  switch (body.cmd) {
    case "status":
      return status(cwd, branch);
    case "add":
      return add(cwd, branch, body);
    case "link":
      return link(body);
    case "move":
      return move(cwd, branch, body);
    case "attach":
      return attach(cwd, branch, body);
    default:
      return fail(`Unknown command "${body.cmd}".`);
  }
}

async function folderProject(cwd: string) {
  const linked = await db
    .select()
    .from(s.projects)
    .where(and(eq(s.projects.status, "active"), isNotNull(s.projects.localPath)));
  return projectForFolder(linked, cwd);
}

const notLinked = () => fail("This folder isn't linked to a project. In the repo, run: lanes link <code>  (e.g. lanes link ot)", 404);

const openTasks = (projectId: string) =>
  db
    .select()
    .from(s.tasks)
    .where(and(eq(s.tasks.projectId, projectId), isNull(s.tasks.closedAt)))
    .orderBy(asc(s.tasks.sort), asc(s.tasks.createdAt));

const view = (t: typeof s.tasks.$inferSelect, branch: string | null) => {
  const branches = branchList(t.branch);
  return { id: shortId(t.id), title: t.title, type: t.type, stage: stageLabel(t.type as TaskType, t.stage, t.kind), branches, onBranch: branch != null && branches.includes(branch) };
};

async function status(cwd: string, branch: string | null) {
  const project = await folderProject(cwd);
  if (!project) return notLinked();
  const tasks = await openTasks(project.id);
  return Response.json({ project: { code: project.code, name: project.name }, branch, tasks: tasks.map((t) => view(t, branch)) });
}

async function add(cwd: string, branch: string | null, body: Body) {
  const project = await folderProject(cwd);
  const added = await addTask({
    text: body.text ?? "",
    fallbackProjectId: project?.id ?? null,
    branch: branch && !isSharedBranch(branch) ? branch : null,
    description: body.description ?? null,
  });
  if (!added.ok) return fail(project || /#\w/.test(body.text ?? "") ? added.error : `${added.error} This folder isn't linked yet: lanes link <code>.`);
  return Response.json({ id: shortId(added.id), title: added.title, type: added.type, branches: added.branches, project: { code: added.project.code, name: added.project.name } });
}

async function link(body: Body) {
  const root = normalizeFolder(body.root ?? "");
  if (!root) return fail("The command didn't send a folder to link.");
  const code = (body.code ?? "").replace(/^#/, "").toUpperCase();
  const [project] = await db
    .select()
    .from(s.projects)
    .where(and(eq(s.projects.status, "active"), sql`upper(${s.projects.code}) = ${code}`))
    .limit(1);
  if (!project) {
    const codes = await db.select({ code: s.projects.code, name: s.projects.name }).from(s.projects).where(eq(s.projects.status, "active")).orderBy(asc(s.projects.code));
    return fail(`No active project uses #${code.toLowerCase() || "?"}. Codes: ${codes.map((c) => `${c.code.toLowerCase()} (${c.name})`).join(", ")}`, 404);
  }
  const [other] = await db
    .select({ name: s.projects.name })
    .from(s.projects)
    .where(and(eq(s.projects.localPath, root), ne(s.projects.id, project.id)))
    .limit(1);
  if (other) return fail(`${other.name} already uses ${root}. Clear it in that project's settings first.`, 409);
  await db.update(s.projects).set({ localPath: root }).where(eq(s.projects.id, project.id));
  return Response.json({ project: { code: project.code, name: project.name }, folder: root });
}

/** The task a move or attach is about: by short id if given, else the project's one open task on the current branch. */
async function pickTask(cwd: string, branch: string | null, id: string | undefined) {
  if (id) {
    if (!/^[0-9a-f]{4,36}$/i.test(id)) return { error: `"${id}" isn't a task id. lanes shows them.` };
    const found = await db
      .select({ task: s.tasks, hasStaging: s.projects.hasStaging })
      .from(s.tasks)
      .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
      .where(like(s.tasks.id, `t_${id.toLowerCase()}%`))
      .limit(2);
    if (found.length === 0) return { error: `No task starts with ${id}.` };
    if (found.length > 1) return { error: `More than one task starts with ${id}. Type more of the id.` };
    return found[0];
  }
  const project = await folderProject(cwd);
  if (!project) return { error: "This folder isn't linked to a project. Give a task id, or run lanes link <code> here." };
  if (!branch || isSharedBranch(branch)) return { error: `You're on ${branch ?? "no branch"}. Give a task id: lanes shows them.` };
  const onBranch = (await openTasks(project.id)).filter((t) => branchList(t.branch).includes(branch));
  if (onBranch.length === 0) return { error: `No open ${project.name} task is on ${branch}. Add one with lanes add "<title>", or attach one: lanes attach <id>.` };
  if (onBranch.length > 1) return { error: `${onBranch.length} tasks are on ${branch}: ${onBranch.map((t) => `${shortId(t.id)} ${t.title}`).join("; ")}. Give an id.` };
  return { task: onBranch[0], hasStaging: project.hasStaging };
}

async function move(cwd: string, branch: string | null, body: Body) {
  const picked = await pickTask(cwd, branch, body.task);
  if ("error" in picked) return fail(picked.error!, 404);
  const { task, hasStaging } = picked;
  const type = task.type as TaskType;
  const stage = resolveStage(type, hasStaging, body.stage ?? "", task.kind);
  if (!stage) return fail(`"${body.stage}" isn't a stage for a ${type} task. Try: ${stageWords(type, hasStaging, task.kind).join(", ")}.`);
  const xp = await moveTask(task.id, stage);
  return Response.json({ id: shortId(task.id), title: task.title, from: stageLabel(type, task.stage, task.kind), to: stageLabel(type, stage, task.kind), xp });
}

async function attach(cwd: string, branch: string | null, body: Body) {
  if (!body.task) return fail("Say which task: lanes attach <id>. lanes shows the ids.");
  if (!branch || isSharedBranch(branch)) return fail(`You're on ${branch ?? "no branch"}. Switch to the task's branch first.`);
  const picked = await pickTask(cwd, branch, body.task);
  if ("error" in picked) return fail(picked.error!, 404);
  const { task } = picked;
  // a general task that hasn't started becomes a code task; anything else keeps its type
  const becomesCode = task.type === "general" && task.stage === "todo";
  if (task.type !== "code" && !becomesCode) return fail(`${task.title} is a ${task.type} task. Branches are for code tasks.`);
  const branches = branchList(task.branch);
  if (branches.includes(branch)) return Response.json({ id: shortId(task.id), title: task.title, branches, already: true });
  if (branches.length >= MAX_BRANCHES) return fail(`${task.title} already has ${MAX_BRANCHES} branches.`);
  const next = [...branches, branch];
  await db
    .update(s.tasks)
    .set({ branch: next.join(" "), ...(becomesCode ? { type: "code" as const } : {}) })
    .where(eq(s.tasks.id, task.id));
  return Response.json({ id: shortId(task.id), title: task.title, branches: next });
}

/** A task in the brief: just enough to plan the day, kept small for assistants. */
const brieft = (t: TodayTask) => ({
  id: shortId(t.id),
  title: t.title,
  where: `${t.workspaceName} / ${t.projectName}`,
  type: t.type,
  stage: stageLabel(t.type as TaskType, t.stage, t.kind),
  ...(t.priority ? { priority: t.priority } : {}),
  ...(t.due ? { due: t.due } : {}),
  ...(t.prodDate ? { prodDate: t.prodDate } : {}),
  ...(t.blocker ? { blocker: t.blocker } : {}),
});

const RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

/** The day at a glance, read-only: deep task, weekly three, overdue, due soon, in progress, urgent, waiting on others, done today, routines. */
async function brief() {
  const today = ymd();
  const t = await loadToday(today);
  const open = t.pickable; // open and still yours to finish
  const listed = new Set<string>();
  const take = (list: TodayTask[], max: number) => {
    const out = list.filter((x) => !listed.has(x.id)).slice(0, max);
    out.forEach((x) => listed.add(x.id));
    return out.map(brieft);
  };

  const overdue = take(open.filter((x) => isOverdue(x, today)).sort((a, b) => a.due!.localeCompare(b.due!)), 15);
  const dueSoon = take(t.dueSoon.filter((x) => !isOverdue(x, today)), 15);
  const urgent = take(
    open.filter((x) => x.priority === "urgent" || x.priority === "high").sort((a, b) => RANK[a.priority!] - RANK[b.priority!]),
    10,
  );
  const inProgress = take(open.filter((x) => x.stage !== "todo" && !FINISHED_FOR_ME.has(x.stage) && !withClient(x)), 15);
  const blocked = open.filter((x) => x.blocker).slice(0, 10).map((x) => ({ id: shortId(x.id), title: x.title, blocker: x.blocker }));

  const day = weekday(today);
  const routineRows = await db.select({ title: s.routines.title, weekdays: s.routines.weekdays, items: s.routines.items }).from(s.routines).orderBy(asc(s.routines.sort));
  const routines = routineRows.filter((r) => r.weekdays.includes(day)).map((r) => ({ title: r.title, items: r.items.length }));

  // what you finished today: moves into a "your part is done" stage since local midnight, newest first, one per task
  const since = zonedTime(today, "00:00") ?? new Date(Date.now() - 864e5);
  const moves = await db
    .select({ id: s.tasks.id, title: s.tasks.title, type: s.tasks.type, kind: s.tasks.kind, to: s.stageEvents.toStage, project: s.projects.name, workspace: s.workspaces.name })
    .from(s.stageEvents)
    .innerJoin(s.tasks, eq(s.stageEvents.taskId, s.tasks.id))
    .innerJoin(s.projects, eq(s.tasks.projectId, s.projects.id))
    .innerJoin(s.workspaces, eq(s.projects.workspaceId, s.workspaces.id))
    .where(gte(s.stageEvents.at, since))
    .orderBy(desc(s.stageEvents.at));
  const doneSeen = new Set<string>();
  const doneToday = moves
    .filter((m) => FINISHED_FOR_ME.has(m.to) && !doneSeen.has(m.id) && doneSeen.add(m.id))
    .slice(0, 20)
    .map((m) => ({ id: shortId(m.id), title: m.title, where: `${m.workspace} / ${m.project}`, stage: stageLabel(m.type as TaskType, m.to, m.kind) }));

  const perWorkspace: Record<string, number> = {};
  for (const x of open) perWorkspace[x.workspaceName] = (perWorkspace[x.workspaceName] ?? 0) + 1;

  return Response.json({
    today,
    tomorrow: addDays(today, 1),
    deep: t.deep ? brieft(t.deep) : null,
    carryOver: t.carry ? brieft(t.carry) : null,
    weeklyThree: t.slots.map((sl) => ({ workspace: sl.workspace.name, star: sl.star ? brieft(sl.star) : null })),
    overdue,
    dueSoon,
    urgent,
    inProgress,
    blocked,
    waitingOnOthers: t.awaiting.slice(0, 10).map((x) => ({ ...brieft(x), waitedDays: x.waited, ...(x.flag ? { flag: x.flag } : {}) })),
    designWithClient: open.filter(withClient).slice(0, 10).map(brieft),
    doneToday,
    routinesToday: routines,
    openCounts: perWorkspace,
  });
}
