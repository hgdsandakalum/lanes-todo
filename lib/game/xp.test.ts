import { test } from "node:test";
import assert from "node:assert/strict";
import { finishedAt, routineAward, taskAwards, XP } from "./xp";

const now = new Date("2026-10-14T06:00:00Z");
const dev = new Date("2026-10-13T09:00:00Z");
const closed = new Date("2026-10-14T05:00:00Z");
const none = { deep: false, star: false };
const kinds = (a: { kind: string }[]) => a.map((x) => x.kind).sort();
const total = (a: { amount: number }[]) => a.reduce((s, x) => s + x.amount, 0);
const task = (type: string, stage: string, devReleasedAt: Date | null = null, closedAt: Date | null = null) => ({ id: "t1", type, stage, devReleasedAt, closedAt });

test("code: review, dev release and prod bonus build up", () => {
  assert.deepEqual(kinds(taskAwards(task("code", "in_progress"), none, now)), []);
  assert.deepEqual(kinds(taskAwards(task("code", "in_review"), none, now)), ["review"]);
  assert.deepEqual(kinds(taskAwards(task("code", "dev_released", dev), none, now)), ["dev", "review"]);
  assert.deepEqual(kinds(taskAwards(task("code", "staging", dev), none, now)), ["dev", "review"]);
  const shipped = taskAwards(task("code", "prod_released", dev, closed), none, now);
  assert.deepEqual(kinds(shipped), ["dev", "prod", "review"]);
  assert.equal(total(shipped), XP.review + XP.dev + XP.prod);
});

test("code: dev XP is dated by the dev release, prod by the close", () => {
  const a = taskAwards(task("code", "prod_released", dev, closed), none, now);
  assert.equal(a.find((x) => x.kind === "dev")!.at, dev);
  assert.equal(a.find((x) => x.kind === "prod")!.at, closed);
});

test("moving back drops what's no longer earned", () => {
  assert.deepEqual(kinds(taskAwards(task("code", "in_progress"), none, now)), []);
  assert.deepEqual(kinds(taskAwards(task("design", "drafting"), none, now)), []);
});

test("design: feedback then approval", () => {
  assert.deepEqual(kinds(taskAwards(task("design", "feedback"), none, now)), ["feedback"]);
  assert.deepEqual(kinds(taskAwards(task("design", "revisions"), none, now)), ["feedback"]);
  assert.deepEqual(kinds(taskAwards(task("design", "approved", null, closed), none, now)), ["approved", "feedback"]);
});

test("general: 10 XP, replaced by the deep or star award", () => {
  assert.deepEqual(kinds(taskAwards(task("general", "todo"), none, now)), []);
  assert.deepEqual(kinds(taskAwards(task("general", "done", null, closed), none, now)), ["general"]);
  assert.deepEqual(kinds(taskAwards(task("general", "done", null, closed), { deep: true, star: false }, now)), ["deep"]);
});

test("deep and star pay on finishing for you, in the task's track", () => {
  const picks = { deep: true, star: true };
  assert.deepEqual(kinds(taskAwards(task("code", "in_review"), picks, now)), ["review"]);
  const a = taskAwards(task("code", "dev_released", dev), picks, now);
  assert.deepEqual(kinds(a), ["deep", "dev", "review", "star"]);
  assert.ok(a.every((x) => x.track === "code"));
  assert.equal(a.find((x) => x.kind === "deep")!.at, dev);
});

test("keys are stable per task and kind", () => {
  assert.deepEqual(
    taskAwards(task("code", "dev_released", dev), none, now).map((x) => x.key).sort(),
    ["t:t1:dev", "t:t1:review"],
  );
});

test("finishedAt", () => {
  assert.equal(finishedAt(task("code", "in_review")), null);
  assert.equal(finishedAt(task("code", "staging", dev)), dev);
  assert.equal(finishedAt(task("design", "approved", null, closed)), closed);
});

test("routineAward needs every item, review pays more", () => {
  assert.equal(routineAward("2026-10-14", "sweep", 6, 7, now), null);
  assert.equal(routineAward("2026-10-14", "sweep", 7, 7, now)!.amount, XP.routine);
  assert.equal(routineAward("2026-10-18", "review", 7, 7, now)!.amount, XP.review_routine);
  assert.equal(routineAward("2026-10-14", "sweep", 7, 7, now)!.key, "r:2026-10-14:sweep");
});
