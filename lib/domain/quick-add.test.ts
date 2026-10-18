import { test } from "node:test";
import assert from "node:assert/strict";
import { dueFrom, parseQuickAdd } from "./quick-add";

const TODAY = "2026-10-13"; // a Tuesday

test("plain text is all title", () => {
  assert.deepEqual(parseQuickAdd("  Fix login   redirect ", TODAY), { ok: true, value: { title: "Fix login redirect" } });
});

test("shortcuts anywhere in the line", () => {
  assert.deepEqual(parseQuickAdd("#gk Fix login @code !fri", TODAY), {
    ok: true,
    value: { title: "Fix login", project: "GK", type: "code", due: "2026-10-16" },
  });
});

test("a branch makes it a code task", () => {
  assert.deepEqual(parseQuickAdd("Login page ^feat/gk-login #GK", TODAY), {
    ok: true,
    value: { title: "Login page", project: "GK", type: "code", branches: ["feat/gk-login"] },
  });
});

test("several branches, repeats dropped", () => {
  assert.deepEqual(parseQuickAdd("Login ^feat/gk-api ^feat/gk-web ^feat/gk-api", TODAY), {
    ok: true,
    value: { title: "Login", type: "code", branches: ["feat/gk-api", "feat/gk-web"] },
  });
});

test("a branch on a design task is refused", () => {
  assert.equal(parseQuickAdd("Logo @design ^feat/x", TODAY).ok, false);
});

test("bad shortcuts are explained, not swallowed", () => {
  for (const line of ["Thing !someday", "Thing ^bad..branch", "#gk #ot Thing", "#gk @code !fri", "@code @design x"]) {
    assert.equal(parseQuickAdd(line, TODAY).ok, false, line);
  }
});

test("words that only look like shortcuts stay in the title", () => {
  assert.deepEqual(parseQuickAdd("Reply to @home re #1 issue, ask bob@x.com", TODAY), {
    ok: true,
    value: { title: "Reply to @home re #1 issue, ask bob@x.com" },
  });
});

test("due words", () => {
  assert.equal(dueFrom("today", TODAY), TODAY);
  assert.equal(dueFrom("tmr", TODAY), "2026-10-14");
  assert.equal(dueFrom("TUE", TODAY), TODAY);
  assert.equal(dueFrom("mon", TODAY), "2026-10-19");
  assert.equal(dueFrom("sunday", TODAY), "2026-10-18");
  assert.equal(dueFrom("2026-11-02", TODAY), "2026-11-02");
  assert.equal(dueFrom("2026-02-30", TODAY), null);
});

test("long titles are refused", () => {
  assert.equal(parseQuickAdd("x".repeat(201), TODAY).ok, false);
});

test("kinds, priority, labels and estimates", () => {
  assert.deepEqual(parseQuickAdd("Login crash @bug *1 +auth +Mobile ~1h30m #gk", TODAY), {
    ok: true,
    value: { title: "Login crash", project: "GK", type: "code", kind: "bug", priority: "urgent", labels: ["auth", "mobile"], estimate: 90 },
  });
  assert.equal(parseQuickAdd("x *soon", TODAY).ok, false);
  assert.equal(parseQuickAdd("x ~forever", TODAY).ok, false);
  assert.equal(parseQuickAdd("x @bug @code", TODAY).ok, false);
  // a lone + or * stays in the title
  assert.deepEqual(parseQuickAdd("1 + 1 * 2", TODAY), { ok: true, value: { title: "1 + 1 * 2" } });
});
