import { test } from "node:test";
import assert from "node:assert/strict";
import { editorUrl, isSharedBranch, normalizeFolder, projectForFolder, resolveStage, shortId } from "./folders";

test("normalizeFolder takes absolute paths only", () => {
  assert.equal(normalizeFolder(" /Users/me/Documents/otasuke/ "), "/Users/me/Documents/otasuke");
  for (const bad of ["", "~/Documents/otasuke", "Documents/otasuke", "/a/../b", "/a\nb"]) assert.equal(normalizeFolder(bad), null, bad);
});

test("projectForFolder: the deepest folder holding cwd wins", () => {
  const ps = [
    { id: "repo", localPath: "/w/gaku" },
    { id: "web", localPath: "/w/gaku/web" },
    { id: "none", localPath: null },
  ];
  assert.equal(projectForFolder(ps, "/w/gaku/api/src")?.id, "repo");
  assert.equal(projectForFolder(ps, "/w/gaku/web/src")?.id, "web");
  assert.equal(projectForFolder(ps, "/w/gaku")?.id, "repo");
  assert.equal(projectForFolder(ps, "/w/gaku-test"), null); // a sibling with the same prefix isn't inside
});

test("resolveStage reads keys, labels and aliases per type", () => {
  assert.equal(resolveStage("code", false, "review"), "in_review");
  assert.equal(resolveStage("code", false, "In review"), "in_review");
  assert.equal(resolveStage("code", false, "dev-released"), "dev_released");
  assert.equal(resolveStage("code", false, "done"), "dev_released");
  assert.equal(resolveStage("code", false, "staging"), null); // no staging on this project
  assert.equal(resolveStage("code", true, "staging"), "staging");
  assert.equal(resolveStage("design", false, "done"), "approved");
  assert.equal(resolveStage("general", false, "done"), "done");
  assert.equal(resolveStage("general", false, "review"), null);
});

test("small helpers", () => {
  assert.equal(shortId("t_d7a89bad-9779-489c"), "d7a89b");
  assert.ok(isSharedBranch("Main") && !isSharedBranch("feat/x"));
  assert.equal(editorUrl("/Users/me/My Repo"), "cursor://file/Users/me/My%20Repo");
});
