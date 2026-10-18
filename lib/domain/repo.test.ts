import { test } from "node:test";
import assert from "node:assert/strict";
import { branchLinks, branchList, isValidBranch, normalizeRepo, parseBranches, safeHttpUrl } from "./repo";

test("normalizeRepo accepts the usual ways of writing a repo", () => {
  const gh = "https://github.com/softsora/gaku";
  for (const input of ["softsora/gaku", "github.com/softsora/gaku", "https://github.com/softsora/gaku/", "https://GitHub.com/softsora/gaku.git", "git@github.com:softsora/gaku.git"]) {
    assert.equal(normalizeRepo(input), gh, input);
  }
  assert.equal(normalizeRepo("https://gitlab.com/softsora/web/olly"), "https://gitlab.com/softsora/web/olly");
});

test("normalizeRepo refuses things that aren't repos", () => {
  for (const input of ["", "gaku", "https://github.com/softsora", "javascript:alert(1)//a/b", "ftp://x.com/a/b", "https://github.com/a/b?tab=x"]) {
    assert.equal(normalizeRepo(input), null, input);
  }
});

test("branchLinks per host", () => {
  assert.deepEqual(branchLinks("https://github.com/softsora/gaku", "feat/gk-login"), {
    tree: "https://github.com/softsora/gaku/tree/feat/gk-login",
    pr: "https://github.com/softsora/gaku/compare/feat/gk-login?expand=1",
  });
  assert.equal(branchLinks("https://gitlab.com/a/b", "fix/x")?.tree, "https://gitlab.com/a/b/-/tree/fix/x");
  assert.equal(branchLinks("https://bitbucket.org/a/b", "fix/x")?.pr, "https://bitbucket.org/a/b/pull-requests/new?source=fix%2Fx");
  assert.equal(branchLinks("https://git.example.com/a/b", "fix/x"), null);
});

test("isValidBranch", () => {
  for (const b of ["main", "feat/gk-login", "release-1.2", "GK-123_fix"]) assert.ok(isValidBranch(b), b);
  for (const b of ["", "a b", "a..b", "/a", "a/", ".a", "a.lock", "a//b", "a~1"]) assert.ok(!isValidBranch(b), b);
});

test("safeHttpUrl only lets http(s) through", () => {
  assert.equal(safeHttpUrl("https://github.com/softsora/gaku/pull/12"), "https://github.com/softsora/gaku/pull/12");
  assert.equal(safeHttpUrl("javascript:alert(1)"), null);
  assert.equal(safeHttpUrl("not a url"), null);
});

test("parseBranches and branchList", () => {
  assert.deepEqual(parseBranches(" feat/a, fix/b  feat/a "), { ok: true, branches: ["feat/a", "fix/b"] });
  assert.deepEqual(parseBranches(""), { ok: true, branches: [] });
  assert.equal(parseBranches("feat/a a..b").ok, false);
  assert.equal(parseBranches(Array.from({ length: 11 }, (_, i) => `b${i}`).join(" ")).ok, false);
  assert.deepEqual(branchList("feat/a fix/b"), ["feat/a", "fix/b"]);
  assert.deepEqual(branchList(null), []);
});
