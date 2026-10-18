import { test } from "node:test";
import assert from "node:assert/strict";
import { dueMarks as marksOf, isOverdue, onTime, prodWait, releasedLate, waitingMark, type DatedTask } from "./due";

const today = "2026-10-19";
const at = (day: string) => new Date(`${day}T06:00:00Z`); // midday in Colombo
const base = { type: "code", stage: "in_progress", due: "2026-10-16", prodDate: null, devReleasedAt: null, closedAt: null };
const opts = { waitDays: 7 };
// text and tone; icons and hover titles are checked where they matter
const dueMarks = (t: DatedTask, day: string, o: Parameters<typeof marksOf>[2]) => marksOf(t, day, o).map(({ text, tone }) => ({ text, tone }));

test("before dev release the due date is the deadline", () => {
  assert.deepEqual(dueMarks(base, today, opts), [{ text: "Was due Fri 16 Oct", tone: "danger" }]);
  assert.deepEqual(dueMarks({ ...base, due: "2026-10-23" }, today, opts), [{ text: "Due Fri 23 Oct", tone: "plain" }]);
  assert.equal(isOverdue(base, today), true);
});

test("after dev release the due date is hidden and the wait counts", () => {
  const t = { ...base, stage: "dev_released", due: "2026-10-16", devReleasedAt: at("2026-10-16") };
  assert.deepEqual(dueMarks(t, today, opts), [{ text: "Dev released Fri 16 Oct, waiting 3 days", tone: "muted" }]);
  assert.equal(isOverdue(t, today), false);
  assert.deepEqual(dueMarks({ ...t, due: null, devReleasedAt: at(today) }, today, opts), [{ text: "Dev released today", tone: "muted" }]);
});

test("past the project's limit the wait turns amber, never red", () => {
  const t = { ...base, stage: "staging", due: null, devReleasedAt: at("2026-10-10") };
  assert.deepEqual(dueMarks(t, today, opts), [{ text: "Waiting 9 days for prod", tone: "warn" }]);
  assert.deepEqual(prodWait(t, today, 7), { devDay: "2026-10-10", waited: 9, flag: "long", flagged: true });
  assert.equal(waitingMark(t, today, 7).text, "Waiting 9 days for prod, over the 7-day limit");
});

test("a prod date from the client replaces the wait and goes red only once missed", () => {
  const t = { ...base, stage: "dev_released", due: null, devReleasedAt: at("2026-10-01") };
  assert.deepEqual(dueMarks({ ...t, prodDate: "2026-10-24" }, today, opts), [{ text: "Prod Sat 24 Oct", tone: "plain" }]);
  assert.equal(prodWait({ ...t, prodDate: "2026-10-24" }, today, 7).flagged, false);
  assert.deepEqual(dueMarks({ ...t, prodDate: "2026-10-17" }, today, opts), [{ text: "Prod was due Sat 17 Oct", tone: "danger" }]);
  assert.equal(prodWait({ ...t, prodDate: "2026-10-17" }, today, 7).flag, "late");
});

test("a late dev release keeps a quiet note", () => {
  const t = { ...base, stage: "dev_released", due: "2026-10-14", devReleasedAt: at("2026-10-16") };
  assert.equal(releasedLate(t), 2);
  assert.equal(marksOf(t, today, opts)[1].title, "Reached dev 2 days after its due date.");
  assert.deepEqual(dueMarks(t, today, opts)[1], { text: "Due Wed 14 Oct, 2 days late", tone: "muted" });
  assert.equal(releasedLate({ ...t, due: "2026-10-16" }), null);
  assert.deepEqual(onTime([t, { ...t, due: "2026-10-16" }, { ...t, due: null }]), { dated: 2, met: 1 });
});

test("design sent for feedback is with the client", () => {
  const t = { ...base, type: "design", stage: "feedback" };
  assert.deepEqual(dueMarks(t, today, { ...opts, since: at("2026-10-15") }), [{ text: "With client 4 days", tone: "muted" }]);
  assert.equal(isOverdue(t, today), false);
});

test("closed tasks and finished general work show nothing", () => {
  assert.deepEqual(dueMarks({ ...base, closedAt: at(today) }, today, opts), []);
});
