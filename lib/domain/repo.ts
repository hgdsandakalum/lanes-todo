/** Git repo and link helpers. Plain functions, no React or database code. */

/**
 * Turns what people paste into a canonical https repo URL, or null if it isn't one.
 * Accepts "owner/name" (GitHub), "github.com/owner/name", https URLs and git@host:owner/name.git.
 */
export function normalizeRepo(input: string): string | null {
  let s = input.trim().replace(/\.git$/, "").replace(/\/+$/, "");
  if (!s) return null;
  const ssh = s.match(/^git@([^:]+):(.+)$/);
  if (ssh) s = `https://${ssh[1]}/${ssh[2]}`;
  else if (/^[\w.-]+\/[\w.-]+$/.test(s) && !s.split("/")[0].includes(".")) s = `https://github.com/${s}`;
  else if (!/^[a-z]+:\/\//i.test(s)) s = `https://${s}`;
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const path = url.pathname.replace(/\/+$/, "");
  if (path.split("/").filter(Boolean).length < 2 || url.search || url.hash) return null;
  return `https://${url.host.toLowerCase()}${path}`;
}

/** "github.com/softsora/gaku" style label for a canonical repo URL. */
export const repoLabel = (repo: string) => repo.replace(/^https:\/\/(www\.)?/, "");

/** A conservative subset of git's branch-name rules: no spaces, no "..", no leading/trailing slash or dot. */
export function isValidBranch(branch: string): boolean {
  return (
    branch.length > 0 &&
    branch.length <= 200 &&
    /^[A-Za-z0-9._/-]+$/.test(branch) &&
    !branch.includes("..") &&
    !branch.includes("//") &&
    !/^[./]|[./]$/.test(branch) &&
    !branch.endsWith(".lock")
  );
}

/** A task holds up to this many branches, e.g. one per repo or a fix split across PRs. */
export const MAX_BRANCHES = 10;

/** The branches stored on a task. They are kept in one column, separated by spaces (a branch name can't contain one). */
export const branchList = (stored: string | null): string[] => (stored ? stored.split(" ").filter(Boolean) : []);

/** Branches typed into a field, separated by spaces or commas; duplicates are dropped. */
export function parseBranches(input: string): { ok: true; branches: string[] } | { ok: false; error: string } {
  const branches = [...new Set(input.split(/[\s,]+/).filter(Boolean))];
  const bad = branches.find((b) => !isValidBranch(b));
  if (bad) return { ok: false, error: `"${bad}" isn't a valid branch name.` };
  if (branches.length > MAX_BRANCHES) return { ok: false, error: `Keep it to ${MAX_BRANCHES} branches per task.` };
  return { ok: true, branches };
}

const TICKET_BRANCH_PREFIX: Partial<Record<string, string>> = { bug: "bugfix", feature: "feature" };

/** The branch a ticket gets by default: a bug on T-206 is "bugfix/t-206", a feature "feature/t-206". Null for other kinds. */
export function ticketBranch(kind: string | null, ticket: string | null): string | null {
  const prefix = kind && TICKET_BRANCH_PREFIX[kind];
  const name = (ticket ?? "").trim().toLowerCase().replace(/\s+/g, "-");
  if (!prefix || !name) return null;
  const branch = `${prefix}/${name}`;
  return isValidBranch(branch) ? branch : null;
}

/**
 * Keeps a task's ticket branch in step with its ticket and kind. The old ticket's branch, if still listed, is dropped,
 * and the new ticket's branch is added when that leaves no branches, so a branch typed by hand is never replaced.
 */
export function withTicketBranch(branches: string[], before: { kind: string | null; ticket: string | null }, after: { kind: string | null; ticket: string | null }): string[] {
  const old = ticketBranch(before.kind, before.ticket);
  const next = ticketBranch(after.kind, after.ticket);
  const kept = old && old !== next ? branches.filter((b) => b !== old) : branches;
  return kept.length || !next ? kept : [next];
}

const encBranch = (b: string) => b.split("/").map(encodeURIComponent).join("/");

/**
 * Where a branch lives and where to open its pull request, for hosts with known URL shapes.
 * Null for other hosts: the repo link alone is still shown.
 */
export function branchLinks(repo: string, branch: string): { tree: string; pr: string } | null {
  const host = new URL(repo).host;
  const q = encodeURIComponent(branch);
  if (host === "github.com") return { tree: `${repo}/tree/${encBranch(branch)}`, pr: `${repo}/compare/${encBranch(branch)}?expand=1` };
  if (host === "gitlab.com" || host.startsWith("gitlab."))
    return { tree: `${repo}/-/tree/${encBranch(branch)}`, pr: `${repo}/-/merge_requests/new?merge_request%5Bsource_branch%5D=${q}` };
  if (host === "bitbucket.org") return { tree: `${repo}/src/${encBranch(branch)}`, pr: `${repo}/pull-requests/new?source=${q}` };
  return null;
}

/** The URL if it is http(s), else null. Every user-entered link goes through this before it becomes an href. */
export function safeHttpUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
