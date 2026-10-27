import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTaskEdit } from "./task-edit";

const TODAY = "2026-10-13"; // a Tuesday

test("only the fields sent change", () => {
  assert.deepEqual(parseTaskEdit({ title: "  Fix login  ", due: "fri", priority: "2", estimate: "1h30m" }, TODAY), {
    ok: true,
    value: { title: "Fix login", due: "2026-10-16", priority: "high", estimateMin: 90 },
  });
});

test("quick-add sigils are accepted", () => {
  assert.deepEqual(parseTaskEdit({ due: "!tmr", priority: "*urgent", estimate: "~30m", labels: ["+QA", "backend", "qa"] }, TODAY), {
    ok: true,
    value: { due: "2026-10-14", priority: "urgent", estimateMin: 30, labels: ["qa", "backend"] },
  });
});

test("null or empty clears a field", () => {
  assert.deepEqual(parseTaskEdit({ description: "", due: null, priority: null, estimate: "", blocker: null, labels: [] }, TODAY), {
    ok: true,
    value: { description: null, due: null, priority: null, estimateMin: null, blocker: null, labels: [] },
  });
});

test("labels can be one string", () => {
  assert.deepEqual(parseTaskEdit({ labels: "backend, +api" }, TODAY), { ok: true, value: { labels: ["backend", "api"] } });
});

test("bad input is refused with a reason", () => {
  for (const set of [
    undefined,
    [],
    {},
    { stage: "done" },
    { title: "" },
    { title: 5 },
    { due: "someday" },
    { priority: "huge" },
    { estimate: "a while" },
    { labels: ["no spaces!"] },
    { labels: Array.from({ length: 13 }, (_, i) => `l${i}`) },
  ]) {
    const r = parseTaskEdit(set, TODAY);
    assert.equal(r.ok, false, JSON.stringify(set));
  }
});
