import { test } from "node:test";
import assert from "node:assert/strict";
import { checkProject, moved, normalizeCode } from "./projects";

test("normalizeCode", () => {
  assert.equal(normalizeCode("gk"), "GK");
  assert.equal(normalizeCode(" #mis "), "MIS");
  assert.equal(normalizeCode("Trjx2"), "TRJX2");
  for (const bad of ["g", "1gk", "toolong", "g k", ""]) assert.equal(normalizeCode(bad), null, bad);
});

test("checkProject", () => {
  assert.deepEqual(checkProject({ name: " Zenvy ", code: "zv", color: "teal" }), { ok: true, value: { name: "Zenvy", code: "ZV", color: "teal" } });
  assert.equal(checkProject({ name: "", code: "ZV", color: "teal" }).ok, false);
  assert.equal(checkProject({ name: "Zenvy", code: "Z", color: "teal" }).ok, false);
  assert.equal(checkProject({ name: "Zenvy", code: "ZV", color: "red" }).ok, false);
});

test("moved", () => {
  assert.deepEqual(moved(["a", "b", "c"], "b", "up"), ["b", "a", "c"]);
  assert.deepEqual(moved(["a", "b", "c"], "b", "down"), ["a", "c", "b"]);
  assert.deepEqual(moved(["a", "b", "c"], "a", "up"), ["a", "b", "c"]);
  assert.deepEqual(moved(["a", "b", "c"], "c", "down"), ["a", "b", "c"]);
});
