#!/usr/bin/env node
/**
 * lanes: Lanes from the terminal. Run it inside a project's repo; it sends the folder and the current
 * git branch to the app (/api/cli), which works out the project and the task.
 *
 *   lanes                      open tasks for this repo (● = on your branch)
 *   lanes add "<line>" [-m "<description>"]
 *                              quick add; the project comes from the folder, the branch from git
 *   lanes start|review|released|staging|prod|done [id]
 *                              move the task on this branch (or the task with that id) to a stage
 *   lanes move <stage> [id]    the same, for any stage name
 *   lanes attach <id>          add the current branch to a task
 *   lanes link <code>          make this repo the folder of project #code
 *
 * Settings: ~/.config/lanes.json {"url": "...", "token": "..."}, or LANES_URL / LANES_TOKEN.
 * Without them it uses http://localhost:3000 and the token in the app's .env.local, so it works locally as is.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const STAGE_WORDS = new Set(["start", "review", "released", "dev", "staging", "prod", "done", "feedback"]);
const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const dim = (t) => (tty ? `\x1b[2m${t}\x1b[22m` : t);
const bold = (t) => (tty ? `\x1b[1m${t}\x1b[22m` : t);

function die(message) {
  console.error(message);
  process.exit(1);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

/** LANES_CLI_TOKEN from the app's .env.local, found next to this script. */
function localToken() {
  try {
    const app = dirname(dirname(realpathSync(fileURLToPath(import.meta.url))));
    const env = readFileSync(join(app, ".env.local"), "utf8");
    return env.match(/^LANES_CLI_TOKEN=(.+)$/m)?.[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

function settings() {
  const file = readJson(join(homedir(), ".config", "lanes.json"));
  const url = (process.env.LANES_URL || file.url || "http://localhost:3000").replace(/\/+$/, "");
  const token = process.env.LANES_TOKEN || file.token || localToken();
  if (!token) die("No token. Put LANES_CLI_TOKEN in the app's .env.local, or {\"url\", \"token\"} in ~/.config/lanes.json.");
  return { url, token };
}

function git(...args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null;
  } catch {
    return null;
  }
}

async function call(cmd, extra = {}) {
  const { url, token } = settings();
  const cwd = realpathSync(process.cwd());
  const payload = { cmd, cwd, root: git("rev-parse", "--show-toplevel") ?? cwd, branch: git("branch", "--show-current"), ...extra };
  let res;
  try {
    res = await fetch(`${url}/api/cli`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    die(`Lanes isn't answering at ${url}. Start it (npm run dev in the app folder), or set the URL in ~/.config/lanes.json.`);
  }
  const data = await res.json().catch(() => ({ error: `Lanes answered ${res.status} without JSON. Is ${url} the app?` }));
  if (!res.ok || data.error) die(data.error ?? `Lanes answered ${res.status}.`);
  return data;
}

const xpNote = (xp) => (xp > 0 ? `  +${xp} XP` : xp < 0 ? `  ${xp} XP` : "");

/** -m "text" or --message "text" anywhere in the arguments; the rest is the quick-add line. */
function splitMessage(args) {
  const rest = [];
  let description;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-m" || args[i] === "--message") description = args[++i] ?? "";
    else rest.push(args[i]);
  }
  return { line: rest.join(" "), description };
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  if (!cmd || cmd === "ls" || cmd === "status") {
    const { project, branch, tasks } = await call("status");
    console.log(`${bold(project.name)} ${dim(`#${project.code.toLowerCase()}`)}${branch ? dim(`  on ${branch}`) : ""}`);
    if (tasks.length === 0) return console.log(dim("No open tasks."));
    const width = Math.max(...tasks.map((t) => t.stage.length));
    for (const t of tasks) {
      const extra = t.branches.filter((b) => b !== branch);
      console.log(`${t.onBranch ? "●" : " "} ${dim(t.id)}  ${t.stage.padEnd(width)}  ${t.title}${extra.length ? dim(`  ${extra.join(" ")}`) : ""}`);
    }
    return;
  }

  if (cmd === "add") {
    const { line, description } = splitMessage(args);
    if (!line.trim()) die('Say what the task is: lanes add "Fix login redirect"');
    const t = await call("add", { text: line, description });
    const on = t.branches.length ? ` on ${t.branches.join(", ")}` : "";
    return console.log(`Added to ${t.project.name}: ${t.title} ${dim(`(${t.type}${on}, ${t.id})`)}`);
  }

  if (cmd === "link") {
    if (!args[0]) die("Say which project: lanes link <code>, e.g. lanes link ot");
    const r = await call("link", { code: args[0] });
    return console.log(`${r.project.name} now lives in ${r.folder}`);
  }

  if (cmd === "attach") {
    const r = await call("attach", { task: args[0] });
    return console.log(r.already ? `${r.title} is already on this branch.` : `${r.title} ${dim(`now on ${r.branches.join(", ")}`)}`);
  }

  if (cmd === "move" || STAGE_WORDS.has(cmd)) {
    const [stage, task] = cmd === "move" ? args : [cmd, args[0]];
    if (!stage) die("Say which stage: lanes move <stage> [id]");
    const r = await call("move", { stage, task });
    return console.log(r.from === r.to ? `${r.title} is already ${r.to}.` : `${r.title}: ${r.from} → ${bold(r.to)}${xpNote(r.xp)}`);
  }

  if (cmd === "help" || cmd === "-h" || cmd === "--help") {
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    const doc = src.slice(src.indexOf("/**") + 3, src.indexOf(" */"));
    return console.log(doc.split("\n").map((l) => l.replace(/^ \* ?/, "")).join("\n").trim());
  }

  die(`Unknown command "${cmd}". Try lanes help.`);
}

await main();
